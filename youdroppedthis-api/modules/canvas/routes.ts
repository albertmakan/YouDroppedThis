import { Router } from "../../deps.ts";
import { CanvasService } from "./service.ts";

export const canvasRouter = new Router();

canvasRouter.get("/", async (ctx) => {
  try {
    const topCanvases = await CanvasService.getTopCanvases();
    ctx.response.body = topCanvases;
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get canvases" };
  }
});

canvasRouter.get("/:id/info", async (ctx) => {
  const canvasId = parseInt(ctx.params.id);
  if (!canvasId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid id" };
    return;
  }
  try {
    const canvasInfo = await CanvasService.getCanvasInfo(canvasId);
    if (!canvasInfo) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Canvas not found" };
      return;
    }
    ctx.response.body = canvasInfo;
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get canvas state" };
  }
});

canvasRouter.get("/:id/area", async (ctx) => {
  const canvasId = parseInt(ctx.params.id);
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
