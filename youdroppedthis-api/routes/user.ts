import { Router } from "../deps.ts";
import { UserService } from "../services/UserService.ts";

export const userRouter = new Router();

// Get user profile
userRouter.get("/profile", async (ctx) => {
  try {
    const userId = parseInt(ctx.state.user.sub);
    const user = await UserService.getUserById(userId);

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    ctx.response.body = { user };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get user profile" };
  }
});

// Get user transactions
userRouter.get("/transactions", async (ctx) => {
  try {
    const userId = parseInt(ctx.state.user.sub);
    const limit = parseInt(ctx.request.url.searchParams.get("limit") || "50");
    const offset = parseInt(ctx.request.url.searchParams.get("offset") || "0");

    const transactions = await UserService.getUserTransactions(
      userId,
      limit,
      offset
    );

    ctx.response.body = { transactions };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get transactions" };
  }
});

// Claim daily bonus
userRouter.post("/daily-bonus", async (ctx) => {
  try {
    const userId = parseInt(ctx.state.user.sub);
    const result = await UserService.claimDailyBonus(userId);

    if (!result.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: result.message };
      return;
    }

    ctx.response.body = result;
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to claim daily bonus" };
  }
});
