'use server'

import { mockFirecrawlScrape, mockOrchestrator, mockImageGeneration, ScrapedContent, Concept } from "@/lib/mock-ai";

/**
 * Server Actions - API Interface to Backend
 * 
 * These actions handle the communication between the frontend and backend.
 * In production, these would make HTTP requests to your Python backend.
 * 
 * The flow is:
 * 1. Frontend calls scrapeUrlAction with contentType and URL
 * 2. Backend scrapes the URL and returns content
 * 3. Frontend calls generateConceptsAction to process content
 * 4. Backend returns structured concepts based on contentType
 * 5. Frontend calls generateImageAction for each concept
 * 6. Backend returns generated images
 */

/**
 * Step 1: Scrape and extract content from URL
 * 
 * Frontend sends: { url: string }
 * Backend returns: { title, content, markdown, url, wordCount, estimatedReadTime }
 */
export async function scrapeUrlAction(url: string): Promise<ScrapedContent> {
  console.log(`[Action] Initiating scrape for URL: ${url}`);
  
  // In production, this would call your Python backend:
  // const response = await fetch(`${BACKEND_URL}/api/scrape`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ url })
  // });
  // return await response.json();
  
  try {
    const scraped = await mockFirecrawlScrape(url);
    console.log(`[Action] Scrape successful: ${scraped.title}`);
    return scraped;
  } catch (error) {
    console.error('[Action] Scrape failed:', error);
    throw new Error('Failed to scrape URL. Please check the URL and try again.');
  }
}

/**
 * Step 2: Generate concepts based on content and contentType
 * 
 * Frontend sends: { contentType: 'meme' | 'comic' | 'simplify', scraped: ScrapedContent }
 * Backend returns: Array of { title, description, prompt, visual, tone }
 */
export async function generateConceptsAction(
  contentType: string, 
  scraped: ScrapedContent
): Promise<Concept[]> {
  console.log(`[Action] Generating concepts for contentType: ${contentType}`);
  
  // Validate contentType
  const validTypes = ['meme', 'comic', 'simplify'];
  if (!validTypes.includes(contentType)) {
    throw new Error(`Invalid contentType: ${contentType}. Must be one of: ${validTypes.join(', ')}`);
  }
  
  // In production, this would call your Python backend:
  // const response = await fetch(`${BACKEND_URL}/api/generate`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ 
  //     contentType, 
  //     content: scraped.content,
  //     title: scraped.title 
  //   })
  // });
  // return await response.json();
  
  try {
    const concepts = await mockOrchestrator(contentType, scraped);
    console.log(`[Action] Generated ${concepts.length} concepts`);
    return concepts;
  } catch (error) {
    console.error('[Action] Concept generation failed:', error);
    throw new Error('Failed to generate concepts. Please try again.');
  }
}

/**
 * Step 3: Generate image from prompt
 * 
 * Frontend sends: { prompt: string }
 * Backend returns: { imageUrl: string }
 */
export async function generateImageAction(prompt: string): Promise<string> {
  console.log(`[Action] Generating image for prompt: ${prompt.slice(0, 50)}...`);
  
  // In production, this would call your Python backend:
  // const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ prompt })
  // });
  // const { imageUrl } = await response.json();
  // return imageUrl;
  
  try {
    const imageUrl = await mockImageGeneration(prompt);
    console.log(`[Action] Image generated successfully`);
    return imageUrl;
  } catch (error) {
    console.error('[Action] Image generation failed:', error);
    throw new Error('Failed to generate image. Please try again.');
  }
}

