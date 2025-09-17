import { Context } from "../deps.ts";
import { verify } from "../deps.ts";
import { JWT_SECRET } from "../config/env.ts";

export async function authMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const authHeader = ctx.request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "No token provided" };
    return;
  }

  const token = authHeader.slice(7);

  try {
    const secret = await crypto.subtle.importKey(
      "raw",
      JWT_SECRET,
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign", "verify"]
    );
    const payload = await verify(token, secret);
    ctx.state.user = payload;
    await next();
  } catch (error) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid token" };
  }
}
