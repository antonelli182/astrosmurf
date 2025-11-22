# API Integration Guide

## URL Routing Structure

The frontend uses a dynamic routing pattern to handle content transformation:

```
/{contentType}/{encodedUrl}
```

### Parameters

1. **contentType** (required)
   - Valid values: `meme`, `comic`, `simplify`
   - Determines the output format for the transformed content
   - Examples:
     - `/meme/...` - Generate meme-style visual content
     - `/comic/...` - Generate comic/sequential visual story
     - `/simplify/...` - Generate simplified explanations with visuals

2. **encodedUrl** (required)
   - URL-encoded string of the source content URL
   - The URL to be scraped and transformed
   - Example: `https%3A%2F%2Fexample.com%2Farticle`

### Example Routes

```
/meme/https%3A%2F%2Fexample.com%2Farticle
/comic/https%3A%2F%2Fblog.com%2Fpost
/simplify/https%3A%2F%2Fresearch.edu%2Fpaper
```

## Backend Integration Flow

### Overview

The frontend orchestrates the full transformation through three main steps:

```
1. Scrape URL → 2. Generate Concepts → 3. Generate Images
```

### API Endpoints (To Be Implemented)

#### 1. Scrape Content

**Frontend Request:**
```typescript
POST /api/scrape
Content-Type: application/json

{
  "url": "https://example.com/article"
}
```

**Backend Response:**
```typescript
{
  "title": "Article Title",
  "content": "Full text content...",
  "markdown": "# Article Title\n\nContent in markdown...",
  "url": "https://example.com/article",
  "wordCount": 1234,
  "estimatedReadTime": 6
}
```

**Backend Tasks:**
- Use Firecrawl or similar scraping service
- Extract main content (remove ads, navigation, etc.)
- Convert to markdown format
- Calculate reading statistics

---

#### 2. Generate Concepts

**Frontend Request:**
```typescript
POST /api/generate
Content-Type: application/json

{
  "contentType": "meme" | "comic" | "simplify",
  "title": "Article Title",
  "content": "Full text content..."
}
```

**Backend Response:**
```typescript
{
  "concepts": [
    {
      "title": "Concept Title",
      "description": "Brief explanation of the concept",
      "prompt": "Detailed DALL-E prompt for image generation",
      "tone": "Humorous" | "Educational" | "Narrative"
    },
    // ... typically 3 concepts
  ]
}
```

**Backend Tasks:**
- Use LLM (GPT-4, Claude, etc.) to analyze content
- Extract key concepts based on contentType
- Generate appropriate prompts for each concept
- Tailor output to contentType:
  - **meme**: Witty, relatable, shareable
  - **comic**: Sequential narrative panels
  - **simplify**: Clear, educational explanations

---

#### 3. Generate Images

**Frontend Request:**
```typescript
POST /api/generate-image
Content-Type: application/json

{
  "prompt": "Detailed image generation prompt"
}
```

**Backend Response:**
```typescript
{
  "imageUrl": "https://storage.example.com/generated/image-123.png"
}
```

**Backend Tasks:**
- Use DALL-E 3, Stable Diffusion, or similar
- Generate image based on prompt
- Store image in cloud storage (S3, etc.)
- Return accessible URL

---

## Current Implementation

### Frontend (Implemented)

The frontend is fully functional with mock data:

- ✅ URL routing with contentType and encodedUrl
- ✅ URL validation and encoding
- ✅ Progress tracking UI
- ✅ Three-step orchestration flow
- ✅ Results display with all contentTypes
- ✅ Error handling

**Files:**
- `app/[category]/[encodedUrl]/page.tsx` - Dynamic route handler
- `app/actions.ts` - Server actions (currently mocked)
- `components/generation-form.tsx` - Input form
- `components/process-flow.tsx` - Orchestration UI
- `lib/mock-ai.ts` - Mock backend responses

### Backend (To Be Implemented)

Create a Python FastAPI backend with these endpoints:

```python
# main.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import os

app = FastAPI()

class ScrapeRequest(BaseModel):
    url: str

class GenerateRequest(BaseModel):
    contentType: str
    title: str
    content: str

class ImageRequest(BaseModel):
    prompt: str

@app.post("/api/scrape")
async def scrape_url(request: ScrapeRequest):
    # Use Firecrawl to scrape URL
    # Return structured content
    pass

@app.post("/api/generate")
async def generate_concepts(request: GenerateRequest):
    # Use OpenAI/Anthropic to generate concepts
    # Tailor to contentType
    pass

@app.post("/api/generate-image")
async def generate_image(request: ImageRequest):
    # Use DALL-E 3 or similar
    # Return image URL
    pass
```

## Environment Variables

### Frontend

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### Backend

```env
FIRECRAWL_API_KEY=your_firecrawl_key
OPENAI_API_KEY=your_openai_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET_NAME=your_bucket_name
```

## Testing the Integration

### 1. Start Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 2. Update Frontend
```typescript
// app/actions.ts
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function scrapeUrlAction(url: string): Promise<ScrapedContent> {
  const response = await fetch(`${BACKEND_URL}/api/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  return await response.json();
}

// Similar for other actions...
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
```

### 4. Test Flow
1. Navigate to http://localhost:3000
2. Enter a URL (e.g., https://example.com/article)
3. Select a contentType (meme, comic, or simplify)
4. Click "Transform Now"
5. Watch the three-step process
6. View results

## Error Handling

The backend should return appropriate error responses:

```typescript
// 400 Bad Request - Invalid input
{
  "error": "Invalid URL format",
  "details": "..."
}

// 429 Too Many Requests - Rate limiting
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}

// 500 Internal Server Error - Processing failed
{
  "error": "Failed to generate concepts",
  "details": "..."
}
```

The frontend will display these errors in the UI.

## Performance Considerations

- Image generation happens in parallel (all 3 images at once)
- Consider caching scraped content for 24 hours
- Consider caching generated concepts for repeat URLs
- Store generated images permanently (don't regenerate)
- Implement rate limiting on backend
- Consider queueing for heavy processing

## Future Enhancements

- [ ] User authentication and saved transformations
- [ ] Download individual or all generated images
- [ ] Share functionality (social media, links)
- [ ] Custom prompt editing
- [ ] More contentTypes (infographic, slides, etc.)
- [ ] Batch processing multiple URLs
- [ ] PDF/document upload support

