import { Router } from "../deps.ts";
import { CanvasService } from "../services/CanvasService.ts";

export const canvasRouter = new Router();

// Get canvas state (public endpoint)
canvasRouter.get("/state", async (ctx) => {
  try {
    const canvasState = await CanvasService.getCanvasState();
    ctx.response.body = canvasState;
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get canvas state" };
  }
});

// Get artworks in a specific area
canvasRouter.get("/area", async (ctx) => {
  try {
    const params = ctx.request.url.searchParams;
    const minX = parseInt(params.get("minX") || "0");
    const maxX = parseInt(params.get("maxX") || "1000");
    const minY = parseInt(params.get("minY") || "0");
    const maxY = parseInt(params.get("maxY") || "1000");

    const artworks = await CanvasService.getArtworksInArea(
      minX,
      maxX,
      minY,
      maxY
    );
    ctx.response.body = { artworks };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get artworks" };
  }
});
