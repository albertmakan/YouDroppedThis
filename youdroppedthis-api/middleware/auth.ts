import { Context } from "../deps.ts";
import { getSupabase } from "../config/supabase.ts";

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
  await next();
}
