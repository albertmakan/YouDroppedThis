import { getDB } from "../config/database.ts";
import { Artwork } from "../models/Artwork.ts";
import { PLACEMENT_FEE } from "../config/env.ts";
import { CanvasService } from "./CanvasService.ts";
import { UserService } from "./UserService.ts";
import { WebSocketService } from "./WebSocketService.ts";

export interface PlacementRequest {
  x: number;
  y: number;
  resolution: 16 | 32 | 64;
  pixel_data: string;
}

export class ArtworkService {
  static async placeArtwork(userId: number, placement: PlacementRequest) {
    const db = getDB();

    // Validate pixel data
    // this.validatePixelData(placement.pixel_data, placement.resolution);

    // Check user balance
    const user = await UserService.getUserById(userId);
    if (!user || user.balance < PLACEMENT_FEE) {
      throw new Error("Insufficient balance");
    }

    // Check for collisions
    const hasCollision = await CanvasService.checkCollision(
      placement.x,
      placement.y
    );

    if (hasCollision) {
      throw new Error("Position is occupied");
    }

    // Check rate limits (max 5 placements per hour)
    const recentPlacements = await db.queryObject<{ count: string }>(
      "SELECT COUNT(*) as count FROM artworks WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'",
      [userId]
    );

    if (parseInt(recentPlacements.rows[0].count) >= 50) {
      throw new Error("Rate limit exceeded (5 placements per hour)");
    }

    // Begin transaction
    await db.queryArray("BEGIN");

    try {
      // Deduct fee from user balance
      await db.queryArray(
        "UPDATE users SET balance = balance - $1 WHERE id = $2",
        [PLACEMENT_FEE, userId]
      );

      // Create artwork
      const artworkResult = await db.queryObject<Artwork>(
        `INSERT INTO artworks (user_id, x, y, width, height, resolution, pixel_data, expires_at)
         VALUES ($1, $2, $3, 64, 64, $4, $5, NOW() + INTERVAL '1 day')
         RETURNING *`,
        [
          userId,
          placement.x,
          placement.y,
          placement.resolution,
          placement.pixel_data,
        ]
      );

      // Record transaction
      await db.queryArray(
        "INSERT INTO transactions (user_id, type, amount, artwork_id, description) VALUES ($1, 'placement', $2, $3, 'Artwork placement')",
        [userId, -PLACEMENT_FEE, artworkResult.rows[0].id]
      );

      await db.queryArray("COMMIT");

      const artwork = artworkResult.rows[0];

      // Broadcast to all clients
      WebSocketService.broadcast({
        type: "artwork_placed",
        data: {
          ...artwork,
          username: user.username,
        },
      });

      return artwork;
    } catch (error) {
      await db.queryArray("ROLLBACK");
      throw error;
    }
  }

  static async collectArtwork(userId: number, artworkId: number) {
    const db = getDB();

    // Check rate limits (max 20 collections per hour)
    const recentCollections = await db.queryObject<{ count: string }>(
      "SELECT COUNT(*) as count FROM artworks WHERE collected_by = $1 AND collected_at > NOW() - INTERVAL '1 hour'",
      [userId]
    );

    if (parseInt(recentCollections.rows[0].count) >= 20) {
      throw new Error("Collection rate limit exceeded (20 per hour)");
    }

    // Get artwork details
    const artworkResult = await db.queryObject<Artwork & { username: string }>(
      `SELECT a.*, u.username
       FROM artworks a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [artworkId]
    );

    if (artworkResult.rows.length === 0) {
      throw new Error("Artwork not found");
    }

    const artwork = artworkResult.rows[0];

    if (artwork.is_expired) {
      throw new Error("Artwork has expired");
    }

    if (artwork.collected_by) {
      throw new Error("Artwork already collected");
    }

    // Update artwork as collected
    await db.queryArray(
      "UPDATE artworks SET collected_by = $1, collected_at = NOW() WHERE id = $2",
      [userId, artworkId]
    );

    // Get updated user info
    const user = await UserService.getUserById(userId);

    // Broadcast collection event
    WebSocketService.broadcast({
      type: "artwork_collected",
      data: {
        collected: { id: artworkId, x: artwork.x, y: artwork.y },
        collectorId: userId,
      },
    });

    return { artwork, user };
  }

  static async getUserArtworks(
    userId: number,
    type: "placed" | "collected" | "all" = "all",
    page: number = 1,
    limit: number = 12
  ): Promise<{ artworks: Artwork[]; total: number }> {
    const db = getDB();
    const offset = (page - 1) * limit;

    // Build the main query
    let query = `
      SELECT a.*, u.username
      FROM artworks a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1
    `;

    // Build the count query
    let countQuery = `
      SELECT COUNT(*) as total
      FROM artworks a
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Add type-specific conditions
    if (type === "placed") {
      const condition = ` AND a.user_id = $${paramIndex}`;
      query += condition;
      countQuery += condition;
      params.push(userId);
      paramIndex++;
    } else if (type === "collected") {
      const condition = ` AND a.collected_by = $${paramIndex} AND a.collected_at IS NOT NULL`;
      query += condition;
      countQuery += condition;
      params.push(userId);
      paramIndex++;
    } else {
      // all
      const condition = ` AND (a.user_id = $${paramIndex} OR a.collected_by = $${paramIndex})`;
      query += condition;
      countQuery += condition;
      params.push(userId);
      paramIndex++;
    }

    // Add ordering and pagination to main query
    query += ` ORDER BY 
      CASE 
        WHEN a.collected_at IS NOT NULL THEN a.collected_at 
        ELSE a.created_at 
      END DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

    params.push(limit, offset);

    try {
      // Execute both queries
      const [artworkResult, countResult] = await Promise.all([
        db.queryObject<Artwork & { username: string }>(query, params),
        db.queryObject<{ total: number }>(countQuery, params.slice(0, -2)), // Remove limit/offset for count
      ]);

      const artworks = artworkResult.rows;

      const total = parseInt(countResult.rows[0]?.total?.toString() || "0");

      return { artworks, total };
    } catch (error) {
      console.error("Error fetching user artworks:", error);
      throw new Error("Failed to fetch artworks");
    }
  }

  private static validatePixelData(pixelData: string, resolution: number) {
    try {
      const data = JSON.parse(pixelData);

      if (!Array.isArray(data)) {
        throw new Error("Pixel data must be an array");
      }

      const expectedLength = resolution * resolution;
      if (data.length !== expectedLength) {
        throw new Error(
          `Pixel data must contain exactly ${expectedLength} pixels for ${resolution}x${resolution} resolution`
        );
      }

      // Validate each pixel is a valid hex color
      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
      for (let i = 0; i < data.length; i++) {
        if (typeof data[i] !== "string" || !hexColorRegex.test(data[i])) {
          throw new Error(`Invalid color at pixel ${i}: ${data[i]}`);
        }
      }
    } catch (error: any) {
      throw new Error(`Invalid pixel data: ${error.message}`);
    }
  }
}
