import { getDB } from "../../config/database.ts";
import type { Artwork, PlacementRequest } from "./model.ts";
import { CanvasService } from "../canvas/service.ts";
import { UserService } from "../user/service.ts";

export class ArtworkService {
  static async placeArtwork(
    userId: string,
    canvasId: number,
    { x, y, pixelData }: PlacementRequest
  ) {
    const canvas = await CanvasService.getCanvasInfo(canvasId);
    if (!canvas) {
      return { error: "Canvas not found", code: 404 };
    }
    if (!canvas.is_active) {
      return { error: "Canvas is inactive", code: 400 };
    }

    // Check user balance
    const userProfile = await UserService.getProfileById(userId);
    if (!userProfile || userProfile.balance < canvas.placement_fee) {
      return { error: "Insufficient balance", code: 402 };
    }

    // Check for collisions
    const hasCollision = await CanvasService.checkCollision(canvasId, x, y);
    if (hasCollision) {
      return { error: "Position is occupied", code: 409 };
    }

    const db = getDB();

    // Check rate limits (max n placements per hour)
    const recentPlacements = await db.queryObject<{ count: string }>`
      SELECT COUNT(*) as count
      FROM app.artworks
      WHERE user_id = ${userId}
        AND created_at > NOW() - INTERVAL '1 hour'`;

    if (
      parseInt(recentPlacements.rows[0].count) >=
      canvas.max_artworks_per_user_per_hour
    ) {
      return { error: "Rate limit exceeded (placements per hour)", code: 429 };
    }

    // Begin transaction
    await db.queryArray("BEGIN");

    try {
      // Create artwork
      const artworkResult = await db.queryObject<Artwork>`
        INSERT INTO app.artworks (canvas_id, user_id, x, y, pixel_data, expires_at, collectable_after)
        VALUES (
          ${canvasId}, ${userId},
          ${x}, ${y},
          ${pixelData},
          NOW() + INTERVAL '1 minute' * ${canvas.artwork_expiry_minutes},
          NOW() + INTERVAL '1 minute' * ${canvas.min_visibility_minutes ?? 1}
        )
        RETURNING *`;
      const artwork = artworkResult.rows[0];

      // Record transaction
      await db.queryArray`
        INSERT INTO app.transactions (user_id, type, amount, artwork_id, description)
        VALUES (
          ${userId},
          'placement',
          ${-canvas.placement_fee},
          ${artwork.id},
          'Artwork placement'
        )`;

      await db.queryArray("COMMIT");

      // Get updated user info
      const userProfile = await UserService.getProfileById(userId);

      return { artwork, userProfile };
    } catch (error) {
      await db.queryArray("ROLLBACK");
      throw error;
    }
  }

  static async collectArtwork(
    userId: string,
    canvasId: number,
    artworkId: number
  ) {
    const db = getDB();

    // Check rate limits!

    // Get artwork details
    const artworkResult = await db.queryObject<Artwork>`
      SELECT *
      FROM app.artworks
      WHERE id = ${artworkId}
        AND canvas_id = ${canvasId}`;

    const artwork = artworkResult.rows[0];
    if (!artwork) {
      return { error: "Artwork not found", code: 404 };
    }
    if (artwork.is_expired) {
      return { error: "Artwork has expired", code: 400 };
    }
    if (artwork.collected_by) {
      return { error: "Artwork already collected", code: 409 };
    }
    if (
      artwork.collectable_after &&
      artwork.collectable_after > new Date().toISOString()
    ) {
      return { error: "Artwork not collectable yet", code: 400 };
    }

    // Update artwork as collected
    await db.queryArray`
      UPDATE app.artworks
      SET collected_by = ${userId}, collected_at = NOW()
      WHERE id = ${artworkId}`;

    // Get updated user info
    const userProfile = await UserService.getProfileById(userId);

    return { artwork, userProfile };
  }

  static async getPlacedArtworksByUser(
    userId: string,
    page: number,
    limit: number
  ) {
    const db = getDB();

    const artworkResults = await db.queryObject<Artwork>`
      SELECT *
      FROM app.artworks
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    return artworkResults.rows;
  }

  static async getCollectedArtworksByUser(
    userId: string,
    page: number,
    limit: number
  ) {
    const db = getDB();

    const artworkResults = await db.queryObject<Artwork>`
      SELECT *
      FROM app.artworks
      WHERE collected_by = ${userId}
      ORDER BY collected_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    return artworkResults.rows;
  }
}
