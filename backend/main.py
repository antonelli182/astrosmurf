from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai.nemotron_fal import process_article_and_generate_media, generate_image
from ai.nemotron_manim_generator import process_article_and_generate_media as process_article_and_generate_manim
from db.db import get_media_by_id, store_media, get_media_urls_by_article
from x.post import post_media_to_twitter
from utils.s3_upload import upload_to_s3
import os
import subprocess
import requests
import shutil
from pathlib import Path
from datetime import datetime
import sys

load_dotenv()

# Add Wan-2-1 to Python path for dynamic import
wan_path = str(Path(__file__).parent.parent / "submodules" / "Wan-2-1")
if wan_path not in sys.path:
    sys.path.insert(0, wan_path)

# Import Wan fast generator (dynamic import from submodule)
try:
    from generate_integrated_fast import get_generator  # type: ignore[import-not-found]
    WAN_AVAILABLE = True
    WAN_GENERATOR = None  # Will be lazily initialized
except ImportError as e:
    print(f"Warning: Wan generator not available: {e}")
    WAN_AVAILABLE = False
    WAN_GENERATOR = None
    get_generator = None  # type: ignore[assignment]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerateRequest(BaseModel):
    user_id: int| None = None
    link: str | None = None
    style: str
    persona_id: int | None = None


class PostToXRequest(BaseModel):
    user_id: int
    media_id: int
    text: str = ""


class GenerateImageRequest(BaseModel):
    prompt: str


async def download_image(url: str, output_path: str) -> str:
    """Download image from URL to local path"""
    response = requests.get(url, stream=True)
    response.raise_for_status()
    
    with open(output_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)
    
    return output_path


async def generate_wan_video_from_images(article_id: int, user_id: int = 1):
    """Generate Wan video from article images using in-memory model"""
    global WAN_GENERATOR
    
    try:
        if not WAN_AVAILABLE:
            print("Wan generator not available, skipping")
            return None
        # Get all image URLs from the article
        print(f"\n=== Fetching images for article {article_id} ===")
        image_urls = await get_media_urls_by_article(article_id, media_type='image')
        
        if not image_urls:
            print("No images found, skipping Wan video generation")
            return None
        
        print(f"Found {len(image_urls)} images for Wan video generation")
        
        # Create directory for this run with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        wan_dir_base = Path(__file__).parent.parent / "submodules" / "Wan-2-1"
        run_dir = wan_dir_base / "wan_generated" / f"run_{timestamp}"
        run_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Created run directory: {run_dir}")
        
        # Download all images locally
        local_image_paths = []
        for i, url in enumerate(image_urls):
            output_path = run_dir / f"ref_image_{i}.png"
            await download_image(url, str(output_path))
            local_image_paths.append(str(output_path))
        
        # Join paths with comma for Wan input
        # src_ref_images = ",".join(local_image_paths)
        src_ref_images = local_image_paths[0]
        
        # Generate prompt for video
        prompt = "create a coherent video animation using the reference images with smooth transitions and engaging movement"
        
        print(f"\n=== Generating Wan video ===")
        print(f"Reference images: {src_ref_images}")
        
        # Lazy load the generator (models loaded once, kept in memory)
        if WAN_GENERATOR is None:
            ckpt_dir = os.getenv("WAN_CKPT_DIR", "/home/ubuntu/karthik-ragunath-ananda-kumar-utah/unianimate-dit/Wan2.1-VACE-1.3B")
            print("🔄 Loading Wan models (first run - this will take a while)...")
            WAN_GENERATOR = get_generator(
                task="vace-1.3B",
                ckpt_dir=ckpt_dir,
                device_id=0
            )
            print("✓ Models loaded and cached in memory!")
        else:
            print("⚡ Using cached Wan models (FAST!)")
        
        # Define output video path in run_dir
        output_video_filename = f"wan_video_{timestamp}.mp4"
        output_video_path = run_dir / output_video_filename
        
        # Generate video using in-memory model (FAST!)
        print("Generating video with cached models...")
        output_file = WAN_GENERATOR.generate(
            prompt=prompt,
            src_ref_images=src_ref_images,
            save_file=str(output_video_path),
            size="832*480",
            frame_num=41,
            sample_steps=25,
            sample_shift=16.0,
            sample_solver='unipc',
            guide_scale=5.0,
            base_seed=-1,
            offload_model=True
        )
        
        # Check if video was generated
        if not output_video_path.exists():
            print(f"Video not found at expected path: {output_video_path}")
            return None
        
        print(f"\n=== Video generated at: {output_video_path} ===")
        
        # Upload to S3
        print("\n=== Uploading Wan video to S3 ===")
        try:
            s3_url = upload_to_s3(str(output_video_path), s3_folder="wan_videos")
            print(f"Video uploaded to S3: {s3_url}")
            media_url = s3_url
        except Exception as e:
            print(f"Failed to upload to S3: {e}")
            media_url = str(output_video_path)
        
        # Store the media in the database
        media_row = await store_media(
            article_id=article_id,
            prompt=prompt[:500],
            style="wan_video",
            media_type="video",
            media_url=media_url
        )
        
        print(f"\n=== Wan video stored in database with ID {media_row['id']} ===")
        print(f"All files saved in: {run_dir}")
        
        return {
            "media_id": media_row["id"],
            "video_url": media_url,
            "prompt": prompt,
            "num_reference_images": len(image_urls)
        }
        
    except Exception as e:
        print(f"Error generating Wan video: {e}")
        import traceback
        traceback.print_exc()
        return None


@app.post("/generate")
async def generate_media(req: GenerateRequest):
    """FastAPI endpoint to trigger media generation"""
    result = await process_article_and_generate_media(
        article_url=req.link,
        user_id=req.user_id if req.user_id else 1,
        style= req.style,
        persona_id = req.persona_id
    )

    if not result:
        return {"success": False, "error": "Failed to generate media"}

    # After images are generated, automatically generate Wan video
    wan_result = None
    try:
        print("\n=== Starting Wan video generation from generated images ===")
        wan_result = await generate_wan_video_from_images(
            article_id=result["article_id"],
            user_id=req.user_id if req.user_id else 1
        )
        if wan_result:
            print(f"Wan video generated successfully: {wan_result['video_url']}")
    except Exception as e:
        print(f"Wan video generation failed (non-fatal): {e}")
        import traceback
        traceback.print_exc()

    # Format the response to include all generated media
    response = {
        "success": True,
        "article_id": result["article_id"],
        "media_count": result["media_count"],
        "media_entries": [
            {
                "media_id": entry["media_id"],
                "media_url": entry["media_url"],
                "concept": entry["concept"]
            } for entry in result["media_entries"]
        ]
    }
    
    # Add Wan video if generated
    if wan_result:
        response["wan_video"] = {
            "media_id": wan_result["media_id"],
            "video_url": wan_result["video_url"],
            "num_reference_images": wan_result["num_reference_images"]
        }
    
    return response


@app.post("/manim")
async def generate_manim_video(req: GenerateRequest):
    """FastAPI endpoint to trigger Manim video generation"""
    result = await process_article_and_generate_manim(
        article_url=req.link,
        user_id=req.user_id if req.user_id else 1,
        style="manim",
        max_retries=5  # Use retry mechanism for robust code generation
    )

    if not result:
        return {"success": False, "error": "Failed to generate Manim video"}

    # Format the response
    return {
        "success": True,
        "article_id": result["article_id"],
        "media_id": result["media_id"],
        "video_path": result["video_path"],
        "concept": result["concept"]
    }


@app.get("/media")
async def get_all_media(limit: int = 50, search: str = None):
    """Get all media entries from the database
    
    Args:
        limit: Maximum number of media entries to return
        search: Optional search term to filter media
    """
    from db.db import get_media_with_article_info, search_media
    try:
        if search:
            # Search media based on search term
            media_entries = await search_media(search, limit)
        else:
            # Get all media with pagination
            media_entries = await get_media_with_article_info(limit)
        
        return {"success": True, "media": media_entries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/media/{media_id}")
async def delete_media_endpoint(media_id: int):
    """Delete a media entry
    
    Args:
        media_id: ID of the media to delete
    """
    from db.db import delete_media
    try:
        result = await delete_media(media_id)
        if not result:
            raise HTTPException(status_code=404, detail="Media not found")
        return {"success": True, "deleted_id": media_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/article/{article_id}")
async def delete_article_endpoint(article_id: int):
    """Delete an article and all its associated media
    
    Args:
        article_id: ID of the article to delete
    """
    from db.db import delete_article
    try:
        result = await delete_article(article_id)
        if not result:
            raise HTTPException(status_code=404, detail="Article not found")
        return {"success": True, "deleted_id": article_id}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/x_post")
async def post_to_x(req: PostToXRequest):
    media = await get_media_by_id(req.media_id)

    if not media:
        raise HTTPException(status_code=404, detail="Media not found")

    media_url = media["media_url"]

    try:
        result = await post_media_to_twitter(media_url, req.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate_image")
async def generate_image_endpoint(req: GenerateImageRequest):
    """Generate an image from a text prompt"""
    try:
        result = await generate_image(req.prompt)

        if not result or "images" not in result:
            raise HTTPException(status_code=500, detail="Failed to generate image")

        image_url = result["images"][0]["url"]

        return {
            "success": True,
            "image_url": image_url,
            "metadata": result["images"][0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

