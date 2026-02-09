import { Router } from "../../deps.ts";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../../middleware/auth.ts";
import { CanvasService } from "./service.ts";
import { canvasHostingRequestSchema } from "./validation.ts";

export const canvasRouter = new Router();

canvasRouter.get("/hosted-by/:userId", async (ctx) => {
  const userId = ctx.params.userId;
  const limit = parseInt(ctx.request.url.searchParams.get("limit") || "16");
  const page = parseInt(ctx.request.url.searchParams.get("page") || "0");
  try {
    const canvases = await CanvasService.getHostedCanvasesByUser(
      userId,
      page,
      limit
    );
    ctx.response.body = { canvases };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get canvases" };
  }
});

canvasRouter.get("/now", async (ctx) => {
  try {
    const canvases = await CanvasService.getNowActiveCanvases(5);
    ctx.response.body = { canvases };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get canvases" };
  }
});

canvasRouter.post("/", authMiddleware, async (ctx) => {
  const userId = ctx.state.user.id;
  const body = await ctx.request.body().value;
  const hostingRequest = canvasHostingRequestSchema.safeParse(body);
  if (!hostingRequest.success) {
    ctx.response.status = 400;
    ctx.response.body = { error: hostingRequest.error };
    return;
  }
  try {
    const { canvas, error, code, userProfile } =
      await CanvasService.createCanvas(userId, hostingRequest.data);
    if (error) {
      ctx.response.status = code;
      ctx.response.body = { message: error };
      return;
    }
    ctx.response.body = { canvas, userProfile };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error };
  }
});

canvasRouter.get("/:id/info", optionalAuthMiddleware, async (ctx) => {
  const userId = ctx.state.user?.id;
  const canvasId = BigInt(ctx.params.id);
  if (!canvasId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid id" };
    return;
  }
  try {
    const canvas = await CanvasService.getCanvasInfo(canvasId);
    if (!canvas) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Canvas not found" };
      return;
    }
    const recentActivity = userId
      ? await CanvasService.getRecentActivity(canvasId, userId, 24)
      : [];
    ctx.response.body = { canvas, recentActivity };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get canvas state" };
  }
});

canvasRouter.get("/:id/area", async (ctx) => {
  const canvasId = BigInt(ctx.params.id);
  if (!canvasId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid id" };
    return;
  }
  const { searchParams: q } = ctx.request.url;
  const params = {
    minX: q.get("minX"),
    maxX: q.get("maxX"),
    minY: q.get("minY"),
    maxY: q.get("maxY"),
  };
  if (!params.minX || !params.maxX || !params.minY || !params.maxY) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid bounds" };
    return;
  }
  const bounds = {
    minX: parseInt(params.minX),
    maxX: parseInt(params.maxX),
    minY: parseInt(params.minY),
    maxY: parseInt(params.maxY),
  };
  const w = bounds.maxX - bounds.minX;
  const h = bounds.maxY - bounds.minY;
  if (w < 1 || h < 1 || w * h > 256) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Area too small or big" };
    return;
  }
  try {
    const artworks = await CanvasService.getArtworksInArea(canvasId, bounds);
    ctx.response.body = { artworks };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get artworks" };
  }
});

canvasRouter.post("/:id/reward", authMiddleware, async (ctx) => {
  const userId = ctx.state.user.id;
  const canvasId = BigInt(ctx.params.id);
  if (!canvasId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid id" };
    return;
  }
  try {
    const { error, code, ...result } = await CanvasService.claimHostReward(
      canvasId,
      userId
    );
    if (error) {
      ctx.response.status = code;
      ctx.response.body = { error };
      return;
    }
    ctx.response.body = result;
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error };
  }
});
