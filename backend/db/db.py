import os
import asyncpg
from dotenv import load_dotenv
from datetime import datetime

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
    """Store media information in the database
    
    Args:
        article_id: ID of the associated article
        prompt: Text prompt used to generate the media
        style: Style of the media (e.g., 'meme', 'comic', etc.)
        media_type: Type of media (e.g., 'image', 'video', etc.)
        media_url: URL where the media is stored
        
    Returns:
        The newly created media row
    """
    db = await Database.get_instance()
    query = """
        INSERT INTO media (article_id, prompt, style, media_type, media_url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    """
    return await db.fetchrow(query, article_id, prompt, style, media_type, media_url)

async def get_media_by_id(media_id):
    """Get media by ID
    
    Args:
        media_id: ID of the media to retrieve
    """
    db = await Database.get_instance()
    query = "SELECT * FROM media WHERE id = $1"
    return await db.fetchrow(query, media_id)

async def get_media_urls_by_article(article_id, media_type='image'):
    """Get all media URLs for a specific article and media type
    
    Args:
        article_id: ID of the article
        media_type: Type of media to filter by (default: 'image')
        
    Returns:
        List of media_url strings
    """
    db = await Database.get_instance()
    query = """
        SELECT media_url FROM media 
        WHERE article_id = $1 AND media_type = $2
        ORDER BY id
    """
    rows = await db.fetch(query, article_id, media_type)
    return [row['media_url'] for row in rows]

async def delete_media(media_id):
    """Delete media by ID
    
    Args:
        media_id: ID of the media to delete
    """
    db = await Database.get_instance()
    query = "DELETE FROM media WHERE id = $1 RETURNING id"
    return await db.fetchrow(query, media_id)

async def get_persona_by_id(persona_id):
    db = await Database.get_instance()
    query = "SELECT * FROM personas where id = $1"
    return await db.fetchrow(query, persona_id)

async def get_media_by_article(article_id):
    """Get all media associated with an article
    
    Args:
        article_id: ID of the article
    """
    db = await Database.get_instance()
    query = "SELECT * FROM media WHERE article_id = $1 ORDER BY date_created DESC"
    return await db.fetch(query, article_id)

async def get_media_with_article_info(limit=50):
    """Get all media entries with article information
    
    Args:
        limit (int, optional): Maximum number of media entries to return. Defaults to 50.
    """
    db = await Database.get_instance()
    query = """
        SELECT m.id, m.article_id, m.prompt, m.style, m.media_type, m.media_url, m.date_created,
               a.text as article_text, a.source as article_source
        FROM media m
        JOIN articles a ON m.article_id = a.id
        ORDER BY m.date_created DESC
        LIMIT $1
    """
    return await db.fetch(query, limit)

async def search_media(search_term, limit=20):
    """Search media by associated article text
    
    Args:
        search_term: Term to search for in article text
        limit: Maximum number of results to return
    """
    db = await Database.get_instance()
    query = """
        SELECT m.id, m.article_id, m.prompt, m.style, m.media_type, m.media_url, m.date_created,
               a.text as article_text, a.source as article_source
        FROM media m
        JOIN articles a ON m.article_id = a.id
        WHERE a.text ILIKE $1 OR a.source ILIKE $1 OR m.prompt ILIKE $1
        ORDER BY m.date_created DESC
        LIMIT $2
    """
    search_pattern = f"%{search_term}%"
    return await db.fetch(query, search_pattern, limit)

# Article operations
async def get_article_by_id(article_id):
    """Get article by ID"""
    db = await Database.get_instance()
    query = "SELECT * FROM articles WHERE id = $1"
    return await db.fetchrow(query, article_id)

async def get_recent_articles(limit=10):
    """Get recent articles
    
    Args:
        limit: Maximum number of articles to return
    """
    db = await Database.get_instance()
    query = "SELECT * FROM articles ORDER BY date_created DESC LIMIT $1"
    return await db.fetch(query, limit)

async def create_article(source, text, user_id=None):
    """Create a new article
    
    Args:
        source: Source of the article (URL or other identifier)
        text: Text content of the article
        user_id: ID of the user who created the article
    """
    db = await Database.get_instance()
    query = """
        INSERT INTO articles (source, text, user_id)
        VALUES ($1, $2, $3)
        RETURNING id
    """
    return await db.fetchrow(query, source, text, user_id)

async def delete_article(article_id):
    """Delete an article and all associated media
    
    Args:
        article_id: ID of the article to delete
    """
    db = await Database.get_instance()
    # The ON DELETE CASCADE in the schema will handle deleting associated media
    query = "DELETE FROM articles WHERE id = $1 RETURNING id"
    return await db.fetchrow(query, article_id)