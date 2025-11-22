import os
import asyncpg
from dotenv import load_dotenv

load_dotenv()

class Database:
    _instance = None
    _pool = None
    
    @classmethod
    async def get_instance(cls):
        if cls._instance is None:
            cls._instance = Database()
            await cls._instance._initialize()
        return cls._instance
    
    async def _initialize(self):
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable not set")
            
        self._pool = await asyncpg.create_pool(database_url)
    
    async def execute(self, query, *args):
        async with self._pool.acquire() as connection:
            return await connection.execute(query, *args)
    
    async def fetch(self, query, *args):
        async with self._pool.acquire() as connection:
            return await connection.fetch(query, *args)
    
    async def fetchrow(self, query, *args):
        async with self._pool.acquire() as connection:
            return await connection.fetchrow(query, *args)
            
    async def close(self):
        if self._pool:
            await self._pool.close()
            self._pool = None

# Media table operations
async def store_media(article_id, prompt, style, media_type, media_url):
    db = await Database.get_instance()
    query = """
        INSERT INTO media (article_id, prompt, style, media_type, media_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    """
    return await db.fetchrow(query, article_id, prompt, style, media_type, media_url)

async def get_media_by_id(media_id):
    db = await Database.get_instance()
    query = "SELECT * FROM media WHERE id = $1"
    return await db.fetchrow(query, media_id)

async def get_media_by_article(article_id):
    db = await Database.get_instance()
    query = "SELECT * FROM media WHERE article_id = $1"
    return await db.fetch(query, article_id)

# Article operations
async def get_article_by_id(article_id):
    db = await Database.get_instance()
    query = "SELECT * FROM articles WHERE id = $1"
    return await db.fetchrow(query, article_id)

async def get_recent_articles(limit=10):
    db = await Database.get_instance()
    query = "SELECT * FROM articles ORDER BY date_created DESC LIMIT $1"
    return await db.fetch(query, limit)

async def create_article(source, text, user_id=None):
    db = await Database.get_instance()
    query = """
        INSERT INTO articles (source, text, user_id)
        VALUES ($1, $2, $3)
        RETURNING id
    """
    return await db.fetchrow(query, source, text, user_id)
