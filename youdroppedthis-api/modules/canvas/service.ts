import { getDB } from "../../config/database.ts";
import type { Artwork } from "../artwork/model.ts";
import { UserService } from "../user/service.ts";
import { canvasSizes } from "./config.ts";
import type { Canvas, CanvasHostingRequest } from "./model.ts";

export class CanvasService {
  static async getHostedCanvasesByUser(
    userId: string,
    page: number,
    limit: number
  ) {
    const db = getDB();

    const canvasesResults = await db.queryObject<Canvas>`
      SELECT *
      FROM app.canvases
      WHERE created_by = ${userId}
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    return canvasesResults.rows;
  }

  static async getNowActiveCanvases() {
    const db = getDB();

    const canvasesResults = await db.queryObject<Canvas>`
      SELECT *
      FROM app.canvases
      ORDER BY created_at DESC
      LIMIT ${5} `;

    return canvasesResults.rows;
  }

  static async createCanvas(
    userId: string,
    hostingRequest: CanvasHostingRequest
  ) {
    // Check user balance
    const userProfile = await UserService.getProfileById(userId);
    const { fee, grid, lifetime, minVisibility } =
      canvasSizes[hostingRequest.canvasSize];
    if (!userProfile || userProfile.balance < fee) {
      return { error: "Insufficient balance", code: 402 };
    }

    const db = getDB();

    // Begin transaction
    await db.queryArray("BEGIN");

    try {
      const canvasResult = await db.queryObject<Canvas>`
        INSERT INTO app.canvases (name, description, placement_fee, artwork_expiry_minutes, min_visibility_minutes, max_artworks_per_user_per_hour, min_x, max_x, min_y, max_y, background_color, palette, artwork_resolution, created_by)
        VALUES (
          ${hostingRequest.name},
          ${hostingRequest.description},
          ${hostingRequest.placementFee},
          ${lifetime * 60},
          ${minVisibility * 60},
          ${5},
          ${-grid / 2},
          ${grid / 2 - 1},
          ${-grid / 2},
          ${grid / 2 - 1},
          ${hostingRequest.backgroundColor},
          ${hostingRequest.palette},
          ${hostingRequest.artworkSize},
          ${userId}
        )
        RETURNING *`;
      const canvas = canvasResult.rows[0];

      // Record transaction
      await db.queryArray`
        INSERT INTO app.transactions (user_id, type, amount, canvas_id)
        VALUES (
          ${userId},
          'canvas_creation',
          ${-fee},
          ${canvas.id}
        )`;

      await db.queryArray("COMMIT");

      // Get updated user info
      const userProfile = await UserService.getProfileById(userId);

      return { canvas, userProfile };
    } catch (error) {
      await db.queryArray("ROLLBACK");
      throw error;
    }
  }

  static async getCanvasInfo(id: number) {
    const db = getDB();

    const result = await db.queryObject<Canvas>`
      SELECT * FROM app.canvases WHERE id = ${id}`;

    return result.rows[0];
  }

  static async getArtworksInArea(
    canvasId: number,
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ) {
    const db = getDB();

    const result = await db.queryObject<Artwork>`
      SELECT *
      FROM app.artworks
      WHERE canvas_id = ${canvasId}
        AND x >= ${bounds.minX} AND x < ${bounds.maxX}
        AND y >= ${bounds.minY} AND y < ${bounds.maxY}
        AND is_expired = FALSE 
        AND collected_by IS NULL`;

    return result.rows;
  }

  static async checkCollision(canvasId: number, x: number, y: number) {
    const db = getDB();

    const result = await db.queryObject<{ count: string }>`
      SELECT COUNT(*) as count
      FROM app.artworks
      WHERE canvas_id = ${canvasId}
        AND x = ${x} AND y = ${y}
        AND is_expired = FALSE 
        AND collected_by IS NULL`;

    return parseInt(result.rows[0].count) > 0;
  }
}
