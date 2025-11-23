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
        style= req.style,
        persona_id = req.persona_id
    )

    if not result:
        return {"success": False, "error": "Failed to generate media"}

    return {
        "success": True,
        "article_id": result["article_id"],
        "media_id": result["media_id"],
        "media_url": result["media_url"]
    }


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

