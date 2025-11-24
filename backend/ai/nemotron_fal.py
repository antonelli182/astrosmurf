import asyncio
import sys
from pathlib import Path

from ai.prompts import generate_multiple_prompts
from ai.scrape import decompose_article

# Add the backend directory to the path so we can import from db
sys.path.insert(0, str(Path(__file__).parent.parent))
from dotenv import load_dotenv
import fal_client
from db.db import get_persona_by_id, store_media, create_article, get_article_by_id
from ai.scrape import get_article

load_dotenv()




async def generate_image(prompt):
    """Generate an image using fal-ai API"""
    if not prompt:
        print("\nError: Empty prompt")
        return None

    print(f"\n\nGenerating image with prompt: {prompt}\n")
    
    handler = await fal_client.submit_async(
        "fal-ai/alpha-image-232/text-to-image",
        arguments={
            "prompt": prompt
        },
    )
    
    async for event in handler.iter_events(with_logs=True):
        print(event)
    
    result = await handler.get()
    return result

async def generate_image_with_persona(prompt, persona_id):
    persona = await get_persona_by_id(persona_id)
    prompt = f"{prompt}"
    print(persona)
    print(f"Generating Image with prompt: {prompt}")
    handler  = await fal_client.submit_async(
        "fal-ai/alpha-image-232/edit-image",
        arguments={
            "image_urls": [persona["image_url"]],
            "prompt": prompt
        },
    )

    async for event in handler.iter_events(with_logs=True):
        print(event)

    result = await handler.get()

    print(result)
    return result

async def generate_multiple_images(prompts):
    """Generate multiple images from a list of prompts"""
    if not prompts or len(prompts) == 0:
        print("\nError: No prompts provided")
        return []

    print(f"\n\nGenerating {len(prompts)} images...\n")

    # Create tasks for all image generations to run in parallel
    tasks = [generate_image(prompt) for prompt in prompts]

    # Wait for all tasks to complete and gather results
    results = await asyncio.gather(*tasks)

    # Filter out any failed generations
    valid_results = [result for result in results if result and "images" in result]

    return valid_results

async def process_article_and_generate_media(persona_id = None, article_url=None, style="meme", user_id=1):
    """Process an article and generate media content, storing results in the database"""
    
    article_text = get_article(article_url)
    concepts = await decompose_article(article_text)
    
    if not concepts or len(concepts) == 0:
        print("No concepts extracted from article")
        return None
        
    print(f"Generating prompts for {len(concepts)} concepts")
    
    # Generate prompts for all concepts
    prompts = await generate_multiple_prompts(concepts, style)
    
    # Validate and filter out empty prompts
    print(f"\nReceived {len(prompts)} prompts from generation")
    valid_prompts = [p for p in prompts if p and p.strip()]
    
    if len(valid_prompts) < len(prompts):
        print(f"Warning: {len(prompts) - len(valid_prompts)} empty prompts were filtered out")
    
    if not valid_prompts:
        print("Error: No valid prompts generated")
        return None
    
    print(f"Proceeding with {len(valid_prompts)} valid prompts\n")
    
    # Generate images for all prompts in parallel
    image_results = await generate_multiple_images(valid_prompts)
    
    if not image_results or len(image_results) == 0:
        print("Failed to generate any images")
        return None
    
    # Create article in database
    article = await create_article(article_url, text="\n ".join(concepts), user_id=user_id)
    article_id = article["id"]
    
    # Store all media in the database and collect results
    media_entries = []
    
    for i, image_result in enumerate(image_results):
        if not image_result or "images" not in image_result:
            print(f"Skipping invalid image result for concept {i+1}")
            continue
            
        # Extract the image URL from the nested structure
        image_obj = image_result["images"][0]
        media_url = image_obj["url"]  # Extract just the URL string
        
        print(f"\nExtracted image URL for concept {i+1}: {media_url}")
        
        # Store the media in the database
        try:
            media_row = await store_media(
                article_id=article_id,
                prompt=valid_prompts[i],
                style=style,
                media_type="image",
                media_url=media_url
            )
            
            print(f"=== Media stored in database with ID {media_row['id']} ===")
            
            # Add to results
            media_entries.append({
                "article_id": article_id,
                "media_id": media_row["id"],
                "concept": concepts[i],
                "prompt": valid_prompts[i],
                "media_url": media_url,
                "image_metadata": image_result["images"][0]
            })
        except Exception as e:
            print(f"Error storing media for concept {i+1}: {str(e)}")
    
    # Return complete results with all media entries
    return {
        "article_id": article_id,
        "media_count": len(media_entries),
        "media_entries": media_entries
    }

# async def process_article_and_generate_media(persona_id = None, article_url=None, style="meme", user_id=1):
#     """Process an article and generate media content, storing results in the database"""
    
#     article_text = get_article(article_url)
#     concepts = await decompose_article(article_text)
#     concept = concepts[0]
#     prompt = await create_generation_prompt(concept=concept, max_length=500,style=style)
#     if persona_id:
#         #prompt = f"Generate an image about the concept: {concept} involving the character in this image in the style of a {style}"
#         image_result= await generate_image_with_persona(prompt, persona_id)
#     else:
#         #prompt = f"Generate an image of the following concept in the style of a {style}: {concept}"
#         image_result = await generate_image(prompt)
#     print(f"PROMP :{prompt}")
#     article = await create_article(article_url, text="\n ".join(concepts), user_id=user_id)
#     article_id = article["id"]
    
#     # Store all media in the database and collect results
#     media_entries = []
    
#     for i, image_result in enumerate(image_results):
#         if not image_result or "images" not in image_result:
#             print(f"Skipping invalid image result for concept {i+1}")
#             continue
            
#         # Extract the image URL from the nested structure
#         image_obj = image_result["images"][0]
#         media_url = image_obj["url"]  # Extract just the URL string
        
#         print(f"\nExtracted image URL for concept {i+1}: {media_url}")
        
#         # Store the media in the database
#         try:
#             media_row = await store_media(
#                 article_id=article_id,
#                 prompt=prompts[i],
#                 style=style,
#                 media_type="image",
#                 media_url=media_url
#             )
            
#             print(f"=== Media stored in database with ID {media_row['id']} ===")
            
#             # Add to results
#             media_entries.append({
#                 "article_id": article_id,
#                 "media_id": media_row["id"],
#                 "concept": concepts[i],
#                 "prompt": prompts[i],
#                 "media_url": media_url,
#                 "image_metadata": image_result["images"][0]
#             })
#         except Exception as e:
#             print(f"Error storing media for concept {i+1}: {str(e)}")
    
#     # Return complete results with all media entries
#     return {
#         "article_id": article_id,
#         "media_count": len(media_entries),
#         "media_entries": media_entries
#     }

async def main():
    # Example usage
    article_url = "https://www.lesswrong.com/posts/fJtELFKddJPfAxwKS/natural-emergent-misalignment-from-reward-hacking-in"
    result = await process_article_and_generate_media(article_url=article_url)
    print(result)

async def test():
    article_url = "https://www.lesswrong.com/posts/fJtELFKddJPfAxwKS/natural-emergent-misalignment-from-reward-hacking-in"
    res = get_article(article_url)
    print(res)
    concepts = await decompose_article(res)
    print(concepts)

if __name__ == "__main__":
    asyncio.run(test())
