import { Context } from "../deps.ts";

const rateLimits = new Map<string, { count: number; resetTime: number }>();

export function rateLimitMiddleware(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const ip = ctx.request.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // per window

  // Clean old entries
  for (const [key, data] of rateLimits.entries()) {
    if (now > data.resetTime) {
      rateLimits.delete(key);
    }
  }

  const current = rateLimits.get(ip) || { count: 0, resetTime: now + windowMs };

  if (current.count >= maxRequests && now < current.resetTime) {
    ctx.response.status = 429;
    ctx.response.body = { error: "Too many requests" };
    return;
  }

  current.count++;
  rateLimits.set(ip, current);

  return next();
}
