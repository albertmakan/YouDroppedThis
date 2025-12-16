import { Client } from "../deps.ts";

let client: Client;

export async function initDatabase() {
  client = new Client({
    user: Deno.env.get("DB_USER"),
    password: Deno.env.get("DB_PASSWORD"),
    database: Deno.env.get("DB_NAME"),
    hostname: Deno.env.get("DB_HOST"),
    port: parseInt(Deno.env.get("DB_PORT") || "5432"),
  });

  await client.connect();
  console.log("📊 Database connected");
  const result = await client.queryObject("SELECT NOW()");
  console.log("✅ Query test:", result.rows);
}

export function getDB() {
  return client;
}

export async function closeDatabase() {
  if (client) {
    await client.end();
    console.log("Database connection closed");
  }
}
