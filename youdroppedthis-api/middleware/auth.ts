import { Context } from "../deps.ts";
import { getSupabase } from "../config/supabase.ts";

async function auth(
  isOptional: boolean,
  ctx: Context,
  next: () => Promise<unknown>
) {
  const authHeader = ctx.request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);

    const {
      data: { user },
      error,
    } = await getSupabase().auth.getUser(token);

    if (error || !user) {
      ctx.response.status = 401;
      ctx.response.body = { error };
      return;
    }

    ctx.state.user = user;
  } else if (!isOptional) {
    ctx.response.status = 401;
    ctx.response.body = { error: "No token provided" };
    return;
  }
  await next();
}

export const authMiddleware = (ctx: Context, next: () => Promise<unknown>) =>
  auth(false, ctx, next);

export const optionalAuthMiddleware = (
  ctx: Context,
  next: () => Promise<unknown>
) => auth(true, ctx, next);
