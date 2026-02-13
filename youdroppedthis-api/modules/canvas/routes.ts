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

    const previewUrl = `${ctx.request.url.origin}/api/canvases/${canvasId}/preview.svg`;
    const siteUrl = "https://youdroppedthis.xyz";
    const title = canvas.name || "Untitled";
    const description =
      canvas.description ||
      "A shared canvas for moments, not monuments. Pixel art that lives for a while, then quietly fades.";

    // Generate HTML with OG meta tags
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} | YouDroppedThis</title>
  
  <meta name="title" content="${escapeHtml(title)}">
  <meta name="description" content="${escapeHtml(description)}">
  
  <meta property="og:type" content="website">
  <meta property="og:url" content="${siteUrl}/canvas/${canvasId}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${previewUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="${siteUrl}/canvas/${canvasId}">
  <meta property="twitter:title" content="${escapeHtml(title)}">
  <meta property="twitter:description" content="${escapeHtml(description)}">
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

canvasRouter.get("/:id/preview.svg", async (ctx) => {
  const canvasId = BigInt(ctx.params.id);
  try {
    const canvas = await CanvasService.getCanvasInfo(canvasId);

    if (!canvas) {
      ctx.response.status = 404;
      ctx.response.body = "Canvas not found";
      return;
    }

    const svg = generatePaletteSVG(
      canvas.palette || [],
      canvas.background_color || "#18181b",
      canvas.name,
    );

    ctx.response.headers.set("Content-Type", "image/svg+xml");
    ctx.response.headers.set("Cache-Control", "public, max-age=3600");
    ctx.response.body = svg;
  } catch (error) {
    console.error("Error generating preview:", error);
    ctx.response.status = 500;
  }
});

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

function generatePaletteSVG(
  palette: string[],
  backgroundColor: string,
  canvasName: string,
): string {
  const width = 1200;
  const height = 630;
  const swatchSize = 80;
  const gap = 20;
  const totalWidth = palette.length * swatchSize + (palette.length - 1) * gap;
  const startX = (width - totalWidth) / 2;
  const startY = (height - swatchSize) / 2;

  // Generate color swatches
  const swatches = palette
    .map((color, i) => {
      const x = startX + i * (swatchSize + gap);
      return `
        <rect 
          x="${x}" 
          y="${startY}" 
          width="${swatchSize}" 
          height="${swatchSize}" 
          fill="${color}" 
          rx="8"
        />`;
    })
    .join("");

  const safeName = escapeHtml(canvasName);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>
  
  <!-- Gradient overlay for depth -->
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgb(0,0,0);stop-opacity:0" />
      <stop offset="100%" style="stop-color:rgb(0,0,0);stop-opacity:0.1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)"/>
  
  <!-- Color swatches -->
  ${swatches}
  
  <!-- Canvas name -->
  <text 
    x="${width / 2}" 
    y="${startY - 40}" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="36" 
    font-weight="600"
    fill="#e0e0e0" 
    text-anchor="middle"
  >${safeName}</text>
  
  <!-- Subtle branding -->
  <text 
    x="${width / 2}" 
    y="${startY + swatchSize + 50}" 
    font-family="system-ui, -apple-system, sans-serif" 
    font-size="18" 
    fill="#666" 
    text-anchor="middle"
  >YouDroppedThis</text>
</svg>`;
}
