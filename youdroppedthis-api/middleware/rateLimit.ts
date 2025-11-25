import { Context } from "../deps.ts";

const kv = await Deno.openKv();
const windowMs = 60 * 1000; // 1 minute
const maxRequests = 100;

function getClientIp(ctx: Context): string {
  // Check headers in order of precedence
  const forwarded = ctx.request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const cfConnectIp = ctx.request.headers.get("cf-connect-ip");
  if (cfConnectIp) {
    return cfConnectIp;
  }

  // Fallback to request IP
  return ctx.request.ip || "unknown";
}

export async function rateLimitMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const ip = getClientIp(ctx);
  const key = ["ratelimit", ip];
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;

  // Get current bucket data
  const entry = await kv.get(key);
  let data = entry.value as { count: number; windowStart: number } | null;

  // If we're in a new window, reset
  if (!data || data.windowStart !== windowStart) {
    data = { count: 0, windowStart };
  }

  // Check if limit exceeded
  if (data.count >= maxRequests) {
    ctx.response.status = 429;
    ctx.response.body = { error: "Too many requests" };
    ctx.response.headers.set(
      "Retry-After",
      String(Math.ceil((data.windowStart + windowMs - now) / 1000))
    );
    ctx.response.headers.set("X-RateLimit-Limit", String(maxRequests));
    ctx.response.headers.set("X-RateLimit-Remaining", "0");
    return;
  }

  // Increment count
  data.count++;

  // Set with TTL (2 minutes to be safe)
  await kv.set(key, data, { expireIn: 2 * windowMs });

  // Add rate limit headers to response
  ctx.response.headers.set("X-RateLimit-Limit", String(maxRequests));
  ctx.response.headers.set(
    "X-RateLimit-Remaining",
    String(maxRequests - data.count)
  );
  ctx.response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil((data.windowStart + windowMs) / 1000))
  );

  return next();
}
