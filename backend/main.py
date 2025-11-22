import asyncio
import os
from dotenv import load_dotenv
from ai.nemotron_fal import process_article_and_generate_media

load_dotenv()

async def generate_media_for_article(article_id=None, article_url=None, article_text=None):
    """Generate media for an article and store it in the database"""
    result = await process_article_and_generate_media(
        article_id=article_id,
        article_url=article_url,
        article_text=article_text
    )
    return result

async def main():
    """Main function to run the application"""
    # Example: Generate media for an article URL
    test_url = "https://www.lesswrong.com/posts/fJtELFKddJPfAxwKS/natural-emergent-misalignment-from-reward-hacking-in"
    result = await generate_media_for_article(article_url=test_url)
    
    if result:
        print(f"Successfully generated media for article")
        print(f"Article ID: {result['article_id']}")
        print(f"Media ID: {result['media_id']}")
        print(f"Media URL: {result['media_url']}")
    else:
        print("Failed to generate media")

if __name__ == "__main__":
    asyncio.run(main())