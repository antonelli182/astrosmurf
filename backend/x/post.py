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

print(client.access_token)
res = client.create_tweet(text="Hello")
print(res)
