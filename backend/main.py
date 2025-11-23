from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai.nemotron_fal import process_article_and_generate_media

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


@app.post("/generate")
async def generate_media(req: GenerateRequest):
    """FastAPI endpoint to trigger media generation"""
    result = await process_article_and_generate_media(
        article_url=req.link,
        style= req.style
    )

    if not result:
        return {"success": False, "error": "Failed to generate media"}

    return {
        "success": True,
        "article_id": result["article_id"],
        "media_id": result["media_id"],
        "media_url": result["media_url"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

