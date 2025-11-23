import requests
from markdownify import markdownify as md
import re
from ai.prompts import generate_prompt
def get_article(article_url):
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://google.com",
        "DNT": "1",
    })

    r = session.get(article_url)
    return md(r.text)

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


if __name__ =="__main__":
    get_article("https://www.lesswrong.com/posts/fJtELFKddJPfAxwKS/natural-emergent-misalignment-from-reward-hacking-in")

