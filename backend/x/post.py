import tweepy
import os
import httpx
import tempfile
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

client = tweepy.Client(
    consumer_key=os.getenv("X_CONSUMER_KEY"),
    consumer_secret=os.getenv("X_CONSUMER_KEY_SECRET"),
    access_token=os.getenv("X_ACCESS_TOKEN"),
    access_token_secret=os.getenv("X_SECRET")
)

auth = tweepy.OAuth1UserHandler(
    os.getenv("X_CONSUMER_KEY"),
    os.getenv("X_CONSUMER_KEY_SECRET"),
    os.getenv("X_ACCESS_TOKEN"),
    os.getenv("X_SECRET")
)
api = tweepy.API(auth)


async def post_media_to_twitter(media_url: str, text: str = ""):
    async with httpx.AsyncClient() as http_client:
        response = await http_client.get(media_url)
        response.raise_for_status()

        file_extension = Path(media_url).suffix

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file.write(response.content)
            temp_path = temp_file.name

        try:
            upload = api.media_upload(temp_path)
            media_id = upload.media_id_string

            tweet_response = client.create_tweet(text=text, media_ids=[media_id])

            tweet_id = None
            if hasattr(tweet_response, "data") and tweet_response.data:
                tweet_id = tweet_response.data.get("id") if isinstance(tweet_response.data, dict) else getattr(tweet_response.data, "id", None)

            return {
                "success": True,
                "tweet_id": tweet_id,
                "media_id": media_id
            }
        finally:
            os.unlink(temp_path)
