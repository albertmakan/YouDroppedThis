import { getDB } from "../../config/database.ts";
import type { Artwork } from "../artwork/model.ts";
import { TransactionService } from "../transaction/service.ts";
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
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    return canvasesResults.rows;
  }

  static async getNowActiveCanvases(limit: number) {
    const db = getDB();

    const canvasesResults = await db.queryObject<Canvas>`
      SELECT c.*,
        jsonb_build_object(
          'username', p.username,
          'profile_picture', p.profile_picture
        ) as host
      FROM app.canvases c
      LEFT JOIN app.profiles p ON p.id = c.created_by
      WHERE c.accepting_artworks = TRUE
        AND c.end_at > NOW()
      ORDER BY c.end_at DESC
      LIMIT ${limit} `;

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
        INSERT INTO app.canvases (name, description, placement_fee, artwork_expiry_minutes, min_visibility_minutes, max_artworks_per_user_per_hour, min_x, max_x, min_y, max_y, background_color, palette, artwork_resolution, created_by, end_at)
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
          ${userId},
          NOW() + INTERVAL '1 hour' * ${lifetime}
        )
        RETURNING *`;
      const canvas = canvasResult.rows[0];

      // Record transaction
      await TransactionService.recordTransaction({
        user_id: userId,
        type: "canvas_creation",
        amount: -fee,
        canvas_id: canvas.id,
      });

      await db.queryArray("COMMIT");

      // Get updated user info
      const userProfile = await UserService.getProfileById(userId);

      return { canvas, userProfile };
    } catch (error) {
      await db.queryArray("ROLLBACK");
      throw error;
    }
  }

  static async getCanvasInfo(id: bigint) {
    const db = getDB();

    const result = await db.queryObject<Canvas>`
      SELECT c.*,
        jsonb_build_object(
          'username', p.username,
          'profile_picture', p.profile_picture
        ) as host
      FROM app.canvases c
      LEFT JOIN app.profiles p ON p.id = c.created_by
      WHERE c.id = ${id}`;

    return result.rows[0];
  }

  static async getArtworksInArea(
    canvasId: bigint,
    bounds: { minX: number; maxX: number; minY: number; maxY: number }
  ) {
    const db = getDB();

    const result = await db.queryObject<Artwork>`
      SELECT a.*,
        jsonb_build_object(
          'username', creator.username,
          'profile_picture', creator.profile_picture
        ) as creator
      FROM app.artworks a
      JOIN app.profiles creator ON creator.id = a.created_by
      WHERE a.canvas_id = ${canvasId}
        AND a.x >= ${bounds.minX} AND a.x < ${bounds.maxX}
        AND a.y >= ${bounds.minY} AND a.y < ${bounds.maxY}
        AND a.is_expired = FALSE 
        AND a.collected_by IS NULL`;

    return result.rows;
  }

  static async getRecentActivity(
    canvasId: bigint,
    userId: string,
    intervalHours: number
  ) {
    const db = getDB();

    const result = await db.queryObject<{
      artwork_id: bigint;
      event_time: string;
      kind: "placement" | "collection";
    }>`
      (
        SELECT id AS artwork_id, created_at AS event_time, 'placement' AS kind
        FROM app.artworks
        WHERE canvas_id = ${canvasId}
          AND created_by = ${userId}
          AND created_at > NOW() - INTERVAL '1 hour' * ${intervalHours}
      )
      UNION ALL
      (
        SELECT id AS artwork_id, collected_at AS event_time, 'collection' AS kind
        FROM app.artworks
        WHERE canvas_id = ${canvasId}
          AND collected_by = ${userId}
          AND collected_at IS NOT NULL
      )
      ORDER BY event_time DESC`;

    return result.rows;
  }

  static async claimHostReward(canvasId: bigint, userId: string) {
    const db = getDB();

    await db.queryArray("BEGIN");

    try {
      // Update artwork as collected
      const updateResult = await db.queryObject<Canvas>`
        UPDATE app.canvases
        SET reward_claimed_at = NOW()
        WHERE id = ${canvasId}
          AND created_by = ${userId}
          AND reward_claimed_at IS NULL
          AND end_at < NOW()
        RETURNING *`;

      if (!updateResult.rowCount) {
        await db.queryArray("ROLLBACK");
        return { error: "Host reward cannot be claimed", code: 400 };
      }
      const canvas = updateResult.rows[0];

      const { amount: hostingFee } =
        await TransactionService.getCanvasCreationFee(
          canvas.id,
          canvas.created_by!
        );
      const uniqueArtistsCountResult = await db.queryObject<{ count: bigint }>`
        SELECT COUNT(DISTINCT created_by) AS count
        FROM app.artworks
        WHERE canvas_id = ${canvasId}`;

      const reward = this.calculateHostReward(
        canvas,
        hostingFee,
        Number(uniqueArtistsCountResult.rows[0].count)
      );

      // Record transaction
      await TransactionService.recordTransaction({
        user_id: userId,
        type: "host_reward",
        amount: reward,
        canvas_id: canvasId,
      });

      await db.queryArray("COMMIT");

      // Get updated user info
      const userProfile = await UserService.getProfileById(userId);

      return { canvas, userProfile, reward };
    } catch (error) {
      await db.queryArray("ROLLBACK");
      throw error;
    }
  }

  static calculateHostReward(
    canvas: Canvas,
    hostingFee: number,
    uniqueArtistsCount: number
  ) {
    const maxReturn = hostingFee * 0.6;
    const placementScore = Math.sqrt(Number(canvas.total_artworks_placed));
    const artistScore = uniqueArtistsCount * 1.2;
    const collectionScore = Number(canvas.total_artworks_collected) * 1.5;
    const rawScore = placementScore + artistScore + collectionScore;
    const reward = Math.min(maxReturn, rawScore * canvas.placement_fee * 0.15);
    return Math.round(reward);
  }
}
