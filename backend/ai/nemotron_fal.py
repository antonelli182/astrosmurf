import asyncio
import os
import sys
from pathlib import Path
import requests
import re

# Add the backend directory to the path so we can import from db
sys.path.insert(0, str(Path(__file__).parent.parent))

from openai import OpenAI
import httpx
from dotenv import load_dotenv
import fal_client
from db.db import get_persona_by_id, store_media, create_article, get_article_by_id
from ai.scrape import get_article

load_dotenv()

async def decompose_article(article):
    "decompose article to concepts"
    
    # Use a more specific prompt with clear instructions and formatting
    prompt = f"""Analyze this article and extract 3-7 key concepts. Each concept should be a single, complete idea.
    
    {article}
    
    Format each concept with <concept> </concept> tags. Each concept should be on its own line.
    
    Example format:
    <concept>First key concept described in a complete sentence.</concept>
    <concept>Second key concept with important details.</concept>
    
    Do not include any other formatting or explanations outside the concept tags.
    """
    
    # Get the model's response
    res = await generate_prompt(prompt=prompt)
    print(res)
    
    # Extract concepts using regex
    concepts = extract_concepts(res)
    
    # Debug
    print(f"Extracted {len(concepts)} concepts: {concepts}")
    
    # Fallback if no concepts found
    if not concepts or len(concepts) == 0:
        print("No concepts extracted from article, creating fallback concepts")
        # Create at least one fallback concept
        fallback_concepts = ["This article discusses important information that can be visualized", 
                            "Key points from the article represented visually",
                            "Visual representation of article highlights"]
        return fallback_concepts
        
    return concepts

def extract_concepts(text: str) -> list[str]:
    """Extract concepts from text using regex pattern"""
    if not text:
        return []
        
    # First check if the text contains any concept tags
    if "<concept>" not in text or "</concept>" not in text:
        print("No concept tags found in text")
        return []
    
    # Use regex pattern to extract content between concept tags
    pattern = r"<concept>\s*(.*?)\s*</concept>"
    concepts = re.findall(pattern, text, flags=re.DOTALL)
    
    # Filter out empty concepts and strip whitespace
    concepts = [c.strip() for c in concepts if c.strip()]
    
    return concepts

async def create_generation_prompt(concept, max_length, style="meme"):
    # Create generation prompt
    prompt = f"""Create a detailed text-to-image prompt for a social media {style}
    
    based on this concept: '{concept[:max_length]}...'.Follow the FLUX framework structure and enhancement layers, with careful attention "
                    "to word order (most important elements first)")
    """
    system_prompt=f"""You are an expert in creating detailed, creative prompts for text-to-image models that will generate engaging social media {style} following the FLUX Prompt Framework: Subject + Action + Style + Context. Your prompts should use structured descriptions with enhancement layers: Visual Layer (lighting, color palette, composition), Technical Layer (camera settings, lens specs), and Atmospheric Layer (mood, emotional tone). Follow optimal prompt length (30-80 words) and prioritize elements by importance (front-load critical elements). Include specific text integration instructions when needed, placing text in quotation marks with clear placement and style descriptions."""
    prompt = await generate_prompt(prompt, system_prompt="")
    return prompt

async def generate_prompt(prompt:str="", system_prompt:str=""):
    """Generate a prompt using the Qwen model based on an article content or URL"""
    # Create a custom http client without proxies to avoid compatibility issues
    http_client = httpx.Client(base_url="https://integrate.api.nvidia.com/v1")
    
    # Initialize the OpenAI client with the custom http client
    client = OpenAI(
        base_url = "https://integrate.api.nvidia.com/v1",
        api_key = os.getenv("NVIDIA_API_KEY"),
        http_client = http_client
    )

    completion = client.chat.completions.create(
        model="qwen/qwen3-next-80b-a3b-thinking",
        messages=[
            {"role":"system","content":system_prompt},
            {"role":"user","content": prompt}
        ],
        temperature=0.6,
        top_p=0.7,
        max_tokens=4096,
        stream=True
    )

    full_content = ""
    reasoning_done = False
    for chunk in completion:
        reasoning = getattr(chunk.choices[0].delta, "reasoning_content", None)
        if reasoning:
            print(reasoning, end="")
            reasoning_done = True
        elif reasoning_done and chunk.choices[0].delta.content is not None:
            print("\n--- END OF REASONING ---\n", end="")
            reasoning_done = False
        
        content = chunk.choices[0].delta.content
        if content is not None:
            print(content, end="")
            full_content += content
    
    return full_content

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
    prompts = []
    for concept in concepts:
        if persona_id:
            image_result= await generate_image_with_persona(prompt, persona_id)
        else:
            prompt = await create_generation_prompt(concept=concept, max_length=500, style=style)
        prompts.append(prompt)
    
    # Generate images for all prompts in parallel
    image_results = await generate_multiple_images(prompts)
    
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
                prompt=prompts[i],
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
                "prompt": prompts[i],
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
