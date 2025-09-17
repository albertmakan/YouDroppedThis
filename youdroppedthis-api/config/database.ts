import { Client } from "../deps.ts";

let client: Client;

export async function initDatabase() {
  client = new Client({
    user: Deno.env.get("DB_USER") || "postgres",
    password: Deno.env.get("DB_PASSWORD") || "password",
    database: Deno.env.get("DB_NAME") || "youdroppedthis",
    hostname: Deno.env.get("DB_HOST") || "localhost",
    port: parseInt(Deno.env.get("DB_PORT") || "5432"),
  });

  await client.connect();
  console.log("📊 Database connected");

  // Create tables if they don't exist
  await createTables();
}

async function createTables() {
  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      balance INTEGER DEFAULT 100,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS artworks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      x INTEGER NOT NULL,
      y INTEGER NOT NULL,
      width INTEGER DEFAULT 64,
      height INTEGER DEFAULT 64,
      resolution INTEGER NOT NULL,
      pixel_data TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMPTZ NOT NULL,
      collected_by INTEGER REFERENCES users(id),
      collected_at TIMESTAMPTZ,
      is_expired BOOLEAN DEFAULT FALSE
    )
  `);

  await client.queryArray(`
    CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL,
      amount INTEGER NOT NULL,
      artwork_id INTEGER REFERENCES artworks(id),
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  await client.queryArray(`
    CREATE INDEX IF NOT EXISTS idx_artworks_position ON artworks(x, y)
  `);
  await client.queryArray(`
    CREATE INDEX IF NOT EXISTS idx_artworks_active 
    ON artworks(is_expired, collected_by, expires_at)
  `);

  console.log("📋 Database tables ready");
}

export function getDB(): Client {
  return client;
}
