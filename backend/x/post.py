import tweepy
import os
from dotenv import load_dotenv
load_dotenv()

# oauth2_user_handler = tweepy.OAuth2UserHandler(
#     client_id="Client ID here",
#     redirect_uri="Callback / Redirect URI / URL here",
#     scope=["Scope here", "Scope here"],
#     # Client Secret is only necessary if using a confidential client
#     client_secret="Client Secret here"
# )

# response = oauth2_user_handler.fetch_token(
#     "Authorization Response URL here"
# )
# access_token = response["access_token"]
# client = tweepy.Client("Access Token here")

#only sign in as me
client = tweepy.Client(
    consumer_key=os.getenv("X_CONSUMER_KEY"),
    consumer_secret=os.getenv("X_CONSUMER_KEY_SECRET"),
    access_token=os.getenv("X_ACCESS_TOKEN"),
    access_token_secret=os.getenv("X_SECRET")
)

# V1.1 API (required for media upload)
auth = tweepy.OAuth1UserHandler(
    os.getenv("X_CONSUMER_KEY"),
    os.getenv("X_CONSUMER_KEY_SECRET"),
    os.getenv("X_ACCESS_TOKEN"),
    os.getenv("X_SECRET")
)
api = tweepy.API(auth)

media_path = "your_image_or_video.jpg"  # or .png / .mp4
upload = api.media_upload(media_path)
media_id = upload.media_id_string

print("Uploaded media_id:", media_id)


print(client.access_token)
res = client.create_tweet(text="Hello", media_ids=[media_id])
print(res)
