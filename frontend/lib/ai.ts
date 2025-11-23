"use server"
import OpenAI from "openai";
import { fal } from "@fal-ai/client";
const client = new OpenAI();

fal.config({
    credentials: process.env.FAL_KEY,
});


async function generate_image_from_text(prompt: string) {
    const result = await fal.subscribe("fal-ai/flux/dev", {
        input: {
            prompt
        },
    });
    return result
}

async function generate_image_from_text_and_image(prompt: string, image_url: string) {
    const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
        input: {
            prompt,
            image_url
        },
    });
    return result
}
async function inference(prompt: string) {
    const response = await client.responses.create({
        model: "gpt-5-nano",
        input: prompt
    });

    console.log(response.output_text);
    return response.output_text
}

export { inference, generate_image_from_text, generate_image_from_text_and_image }