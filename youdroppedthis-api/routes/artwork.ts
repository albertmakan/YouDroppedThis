import { Router } from "../deps.ts";
import { z } from "../deps.ts";
import { ArtworkService } from "../services/ArtworkService.ts";

export const artworkRouter = new Router();

const placementSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  resolution: z.union([z.literal(16), z.literal(32), z.literal(64)]),
  pixel_data: z.string(),
});

// Place artwork
artworkRouter.post("/place", async (ctx) => {
  try {
    const userId = parseInt(ctx.state.user.sub);
    const body = await ctx.request.body().value;
    const placementData = placementSchema.parse(body);

    const artwork = await ArtworkService.placeArtwork(userId, placementData);

    ctx.response.status = 201;
    ctx.response.body = { artwork };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Collect artwork
artworkRouter.post("/:id/collect", async (ctx) => {
  try {
    const userId = parseInt(ctx.state.user.sub);
    const artworkId = parseInt(ctx.params.id);

    const result = await ArtworkService.collectArtwork(userId, artworkId);

    ctx.response.body = result;
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Get user's artworks (placed or collected)
artworkRouter.get("/mine", async (ctx) => {
  try {
    const userId = parseInt(ctx.state.user.sub);
    const type = ctx.request.url.searchParams.get("type") || "all"; // "placed", "collected", "all"

    const artworks = await ArtworkService.getUserArtworks(userId, type as any);

    ctx.response.body = { artworks };
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get canvas state" };
  }
});
