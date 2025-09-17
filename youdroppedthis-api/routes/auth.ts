import { Router } from "../deps.ts";
import { z } from "../deps.ts";
import { AuthService } from "../services/AuthService.ts";

export const authRouter = new Router();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

authRouter.post("/register", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { username, email, password } = registerSchema.parse(body);

    const result = await AuthService.register(username, email, password);

    ctx.response.status = 201;
    ctx.response.body = result;
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

authRouter.post("/login", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { username, password } = loginSchema.parse(body);

    const result = await AuthService.login(username, password);

    ctx.response.body = result;
  } catch (error: any) {
    ctx.response.status = 401;
    ctx.response.body = { error: error.message };
  }
});
