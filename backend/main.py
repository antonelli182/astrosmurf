from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai.nemotron_fal import process_article_and_generate_media, generate_image
from db.db import get_media_by_id
from x.post import post_media_to_twitter

load_dotenv()

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

    # Format the response to include all generated media
    return {
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


@app.get("/media")
async def get_all_media(limit: int = 50, search: str|None = None):
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

