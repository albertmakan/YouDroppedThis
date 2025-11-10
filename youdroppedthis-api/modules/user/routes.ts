import { Router } from "../../deps.ts";
import { authMiddleware } from "../../middleware/auth.ts";
import { UserService } from "./service.ts";
import { profileUpdateSchema } from "./validation.ts";

export const userRouter = new Router();

userRouter.get("/:id/profile", async (ctx) => {
  const userId = ctx.params.id;
  try {
    const profile = await UserService.getProfileById(userId);
    if (!profile) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User profile not found" };
      return;
    }
    ctx.response.body = { profile };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get user profile" };
  }
});

userRouter.patch("/", authMiddleware, async (ctx) => {
  const userId = ctx.state.user.id;
  const body = await ctx.request.body().value;
  const profileUpdateRequest = profileUpdateSchema.safeParse(body);
  if (!profileUpdateRequest.success) {
    ctx.response.status = 400;
    ctx.response.body = { error: profileUpdateRequest.error };
    return;
  }
  try {
    const updated = await UserService.updateProfile(
      userId,
      profileUpdateRequest.data
    );
    ctx.response.body = { profile: updated };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to update user profile" };
  }
});
