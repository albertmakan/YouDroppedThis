export const JWT_SECRET = new TextEncoder().encode(
  Deno.env.get("JWT_SECRET") ||
    "your-super-secret-jwt-key-change-this-in-production"
);

export const PLACEMENT_FEE = parseInt(Deno.env.get("PLACEMENT_FEE") || "10");
export const DAILY_BONUS = parseInt(Deno.env.get("DAILY_BONUS") || "10");
export const ARTWORK_EXPIRY_HOURS = parseInt(
  Deno.env.get("ARTWORK_EXPIRY_HOURS") || "24"
);
