"use server"
import OpenAI from "openai";
import { fal } from "@fal-ai/client";
const client = new OpenAI();

fal.config({
    credentials: process.env.FAL_KEY,
});


async function generateImageFromText(prompt: string) {
    const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
            prompt
        },
    });
    return result
}

async function generateImageFromTextAndImage(prompt: string, image_url: string) {
    const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
        input: {
            prompt,
            image_url
        },
    });
    return result
}
async function inference(prompt: string) {
    console.log("Mock inference called with prompt:", prompt);
    return `This is a mock response for: ${prompt.substring(0, 50)}...`;
}

// Content scraping and processing types
export interface ScrapedContent {
    title: string;
    content: string;
    markdown: string;
    url: string;
    wordCount: number;
    estimatedReadTime: number;
}

export interface Concept {
    title: string;
    description: string;
    prompt: string;
    visual: string;
    tone: string;
}

// Mock implementation of Firecrawl service for scraping content
export async function mockFirecrawlScrape(url: string): Promise<ScrapedContent> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return mock data
    return {
        title: `Article from ${new URL(url).hostname}`,
        content: `This is a mock article content extracted from ${url}. In production, this would be the actual content scraped from the provided URL using our backend services.`,
        markdown: `# Article from ${new URL(url).hostname}\n\nThis is a mock article content in markdown format. It would contain all the formatted content from the page.`,
        url: url,
        wordCount: 250,
        estimatedReadTime: 2 // minutes
    };
}

// Mock orchestrator for concept generation
export async function mockOrchestrator(contentType: string, scraped: ScrapedContent): Promise<Concept[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock concepts based on contentType
    return [
        {
            title: "Main Concept",
            description: `Key idea from the article on ${scraped.title}`,
            prompt: "Generate a visual representation of the main concept discussed in the article",
            visual: "photograph",
            tone: "informative"
        },
        {
            title: "Secondary Point",
            description: "An interesting secondary point from the article",
            prompt: "Create an illustration highlighting the secondary point from the article",
            visual: "illustration",
            tone: "educational"
        }
    ];
}

// Mock image generation
export async function mockImageGeneration(prompt: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Return a random placeholder image URL
    const imageIds = [
        "bSdHvxIBzgeamAYOAh3hw",
        "7oCFzqOr3NwZ8Oy5qVCAL",
        "FqVEILcG0hAxv2rKNfShK",
        "8lZYKdPB7EMnF2j3IfHlQ",
        "HcvcEPoTSbdIhJffHPPp5"
    ];

    const randomId = imageIds[Math.floor(Math.random() * imageIds.length)];
    return `https://v3b.fal.media/files/b/tiger/${randomId}.png`;
}

export { inference, generateImageFromText, generateImageFromTextAndImage }