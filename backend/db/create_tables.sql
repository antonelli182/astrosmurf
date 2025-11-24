CREATE TABLE verification_token
(
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
 
  PRIMARY KEY (identifier, token)
);
 
CREATE TABLE accounts
(
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
 
  PRIMARY KEY (id)
);
 
CREATE TABLE sessions
(
  id SERIAL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,
 
  PRIMARY KEY (id)
);
 
CREATE TABLE users
(
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
 
  PRIMARY KEY (id)
);
 

CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  source VARCHAR(200) NOT NULL,
  text TEXT NOT NULL,
  user_id INTEGER,
  date_created TIMESTAMPTZ DEFAULT NOW(),
  date_written TIMESTAMPTZ
);

CREATE TABLE media (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  prompt TEXT,
  style TEXT,
  media_type VARCHAR(50) NOT NULL,  -- 'image', 'video', 'comic', etc.
  media_url TEXT NOT NULL, -- s3 or fal link
  date_created TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE socials (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,   -- 'twitter', 'instagram', etc.
  account_identifier VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ
); 

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  social_account_id INTEGER NOT NULL REFERENCES socials(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  caption TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  posted_at TIMESTAMPTZ
);

CREATE TABLE personas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  date_created TIMESTAMPTZ DEFAULT NOW()
);