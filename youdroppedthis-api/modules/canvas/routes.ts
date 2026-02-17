import { createCanvas } from "canvas";
import { Router } from "../../deps.ts";
import { authMiddleware } from "../../middleware/auth.ts";
import { CanvasService } from "./service.ts";
import { canvasHostingRequestSchema } from "./validation.ts";
import { rgbToHSL } from "../../utils/color.ts";

export const canvasRouter = new Router();

canvasRouter.get("/hosted-by/:userId", async (ctx) => {
  const userId = ctx.params.userId;
  const limit = parseInt(ctx.request.url.searchParams.get("limit") || "16");
  const page = parseInt(ctx.request.url.searchParams.get("page") || "0");
  try {
    const canvases = await CanvasService.getHostedCanvasesByUser(
      userId,
      page,
      limit,
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

canvasRouter.get("/:id/info", async (ctx) => {
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
    ctx.response.body = { canvas };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get canvas info" };
  }
});

canvasRouter.get("/:id/my-recent-activity", authMiddleware, async (ctx) => {
  const userId = ctx.state.user.id;
  const canvasId = BigInt(ctx.params.id);
  if (!canvasId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid id" };
    return;
  }
  try {
    const recentActivity = await CanvasService.getRecentActivity(
      canvasId,
      userId,
      24,
    );
    ctx.response.body = { recentActivity };
  } catch {
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get recent activity" };
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
      userId,
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

canvasRouter.get("/:id/meta", async (ctx) => {
  const canvasId = BigInt(ctx.params.id);
  try {
    const canvas = await CanvasService.getCanvasInfo(canvasId);

    if (!canvas) {
      ctx.response.status = 404;
      ctx.response.body = "Canvas not found";
      return;
    }

    const previewUrl = `${ctx.request.url.origin}/api/canvases/${canvasId}/preview.png`;
    const siteUrl = "https://youdroppedthis.xyz";
    const title = escapeHtml(canvas.name) || "Untitled";
    const description =
      escapeHtml(canvas.description) ||
      "A shared canvas for moments, not monuments. Pixel art that lives for a while, then quietly fades.";

    // Generate HTML with OG meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | YouDroppedThis</title>
  
  <meta name="title" content="${title}">
  <meta name="description" content="${description}">
  
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}/canvas/${canvasId}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${previewUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${siteUrl}/canvas/${canvasId}">
  <meta property="twitter:title" content="${title}">
  <meta property="twitter:description" content="${description}">
  <meta property="twitter:image" content="${previewUrl}">
  
  <meta http-equiv="refresh" content="0;url=${siteUrl}/canvas/${canvasId}">
</head>
<body>
</body>
</html>`;

    ctx.response.headers.set("Content-Type", "text/html; charset=utf-8");
    ctx.response.headers.set("Cache-Control", "public, max-age=3600");
    ctx.response.body = html;
  } catch (error) {
    console.error("Error generating meta page:", error);
    ctx.response.status = 500;
    ctx.response.body = "Internal Server Error";
  }
});

const previewCache = new Map<
  bigint,
  { buffer: Uint8Array; timestamp: number }
>();

canvasRouter.get("/:id/preview.png", async (ctx) => {
  const canvasId = BigInt(ctx.params.id);

  const cached = previewCache.get(canvasId);
  if (cached) {
    ctx.response.headers.set("Content-Type", "image/png");
    ctx.response.headers.set("Cache-Control", "public, max-age=3600");
    ctx.response.headers.set("X-Cache", "HIT");
    ctx.response.body = cached.buffer;
    return;
  }

  const canvas = await CanvasService.getCanvasInfo(canvasId);

  if (!canvas) {
    ctx.response.status = 404;
    ctx.response.body = "Canvas not found";
    return;
  }
  const imageBuffer = generatePreviewImage(
    canvas.name,
    canvas.palette ?? [],
    canvas.background_color ?? "#18181b",
  ).toBuffer("image/png");

  // Store in cache
  previewCache.set(canvasId, { buffer: imageBuffer, timestamp: Date.now() });

  ctx.response.headers.set("Content-Type", "image/png");
  ctx.response.headers.set("Cache-Control", "public, max-age=3600");
  ctx.response.body = imageBuffer;
});

function generatePreviewImage(
  name: string,
  palette: string[],
  bgColor: string,
) {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  const [r, g, b] = Array.from(ctx.getImageData(0, 0, 1, 1).data);

  // Palette swatches
  const swatchSize = 64;
  const gap = 12;
  const totalWidth = palette.length * swatchSize + (palette.length - 1) * gap;
  const startX = (width - totalWidth) / 2;
  const startY = (height - swatchSize) / 2;

  palette.forEach((color, i) => {
    const x = startX + i * (swatchSize + gap);
    ctx.fillStyle = color;
    ctx.fillRect(x, startY, swatchSize, swatchSize);
  });

  // Canvas name
  const [h, s, l] = rgbToHSL(r, g, b);
  ctx.fillStyle = `hsl(${h}, ${s}%, ${l + (l > 50 ? -50 : 50)}%)`;
  ctx.font = "600 32px sans-serif";
  const nameWidth = ctx.measureText(name).width;
  ctx.fillText(name, (width - nameWidth) / 2, startY - 60);

  // Branding
  const brandText = "YouDroppedThis";
  ctx.font = "20px sans-serif";
  const brandingWidth = ctx.measureText(brandText).width;
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(0, height - 36, brandingWidth + 16, 36);
  ctx.fillStyle = "#fff";
  ctx.fillText(brandText, 8, height - 10);

  return canvas;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
