import asyncio
from ai.nemotron_fal import generate_image_with_persona
import pytest 

@pytest.mark.asyncio
async def test_generate_image_with_persona():
    res = await generate_image_with_persona("Make a photorealistic image of a person doing science, based on the person in this image", 2)
    print(res)


if __name__ =="__main__":
    asyncio.run(test_generate_image_with_persona())