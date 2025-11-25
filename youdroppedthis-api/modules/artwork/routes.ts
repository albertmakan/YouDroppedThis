import { Router } from "../../deps.ts";
import { ArtworkService } from "./service.ts";
import { placementSchema } from "./validation.ts";

export const artworkRouter = new Router();

artworkRouter.post("/place", async (ctx) => {
  const userId = ctx.state.user.id;
  const canvasId = parseInt(
    ctx.request.url.searchParams.get("canvas_id") || ""
  );
  if (!canvasId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid canvas id" };
    return;
  }
  const body = await ctx.request.body().value;
  const placementRequest = placementSchema.safeParse(body);
  if (!placementRequest.success) {
    ctx.response.status = 400;
    ctx.response.body = { error: placementRequest.error };
    return;
  }
  try {
    const { artwork, error, code, userProfile } =
      await ArtworkService.placeArtwork(
        userId,
        canvasId,
        placementRequest.data
      );
    if (error) {
      ctx.response.status = code;
      ctx.response.body = { error };
      return;
    }
    ctx.response.body = { artwork, userProfile };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error };
  }
});

artworkRouter.post("/collect/:id", async (ctx) => {
  const userId = ctx.state.user.id;
  const canvasId = parseInt(
    ctx.request.url.searchParams.get("canvas_id") || ""
  );
  if (!canvasId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid canvas id" };
    return;
  }
  const artworkId = parseInt(ctx.params.id);
  if (!artworkId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid id" };
    return;
  }
  try {
    const { artwork, error, code, userProfile } =
      await ArtworkService.collectArtwork(userId, canvasId, artworkId);
    if (error) {
      ctx.response.status = code;
      ctx.response.body = { error };
      return;
    }
    ctx.response.body = { artwork, userProfile };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error };
  }
});

artworkRouter.get("/placed/:userId", async (ctx) => {
  const userId = ctx.params.userId;
  const limit = parseInt(ctx.request.url.searchParams.get("limit") || "16");
  const page = parseInt(ctx.request.url.searchParams.get("page") || "0");
  try {
    const artworks = await ArtworkService.getPlacedArtworksByUser(
      userId,
      page,
      limit
    );
    ctx.response.body = { artworks };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get users placed artworks" };
  }
});

artworkRouter.get("/collected/:userId", async (ctx) => {
  const userId = ctx.params.userId;
  const limit = parseInt(ctx.request.url.searchParams.get("limit") || "16");
  const page = parseInt(ctx.request.url.searchParams.get("page") || "0");
  try {
    const artworks = await ArtworkService.getCollectedArtworksByUser(
      userId,
      page,
      limit
    );
    ctx.response.body = { artworks };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get users collected artworks" };
  }
});
