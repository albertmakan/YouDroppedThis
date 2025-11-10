import { Router } from "../../deps.ts";
import { TransactionService } from "./service.ts";

export const transactionRouter = new Router();

transactionRouter.get("/", async (ctx) => {
  const userId = ctx.state.user.id;
  const { searchParams: q } = ctx.request.url;
  const limit = Math.max(Math.min(parseInt(q.get("limit") || "20"), 50), 1);
  const page = Math.max(parseInt(q.get("page") || "0"), 0);
  try {
    const transactions = await TransactionService.getUserTransactions(
      userId,
      limit,
      page
    );
    ctx.response.body = { transactions };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get transactions" };
  }
});

// will listen to payment webhook (TODO)
transactionRouter.post("/purchase", async (ctx) => {
  const userId = ctx.state.user.id;
  const { amount } = await ctx.request.body().value;
  if (typeof amount !== "number" || amount < 1) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid amount" };
    return;
  }
  try {
    const result = await TransactionService.updateBalance(
      userId,
      amount,
      "purchase",
      ""
    );
    ctx.response.body = result;
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to record transaction" };
  }
});

transactionRouter.post("/daily-bonus", async (ctx) => {
  const userId = ctx.state.user.id;
  try {
    const result = await TransactionService.claimDailyBonus(userId);
    if (!result.success) {
      ctx.response.status = 400;
      ctx.response.body = { error: result.message };
      return;
    }
    ctx.response.body = result;
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error, msg: "Failed to claim daily bonus" };
  }
});
