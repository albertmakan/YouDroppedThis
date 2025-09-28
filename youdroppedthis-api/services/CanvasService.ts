import { getDB } from "../config/database.ts";
import { Artwork } from "../models/Artwork.ts";

export interface CanvasState {
  artworks: Artwork[];
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export class CanvasService {
  static async getCanvasState(): Promise<CanvasState> {
    const db = getDB();

    // Get all active (non-expired, non-collected) artworks
    const result = await db.queryObject<Artwork & { username: string }>(
      `SELECT a.*, u.username
       FROM artworks a
       JOIN users u ON a.user_id = u.id
       WHERE a.is_expired = FALSE AND a.collected_by IS NULL`
    );

    const artworks = result.rows;

    // Calculate bounds
    let bounds = { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    if (artworks.length > 0) {
      bounds = {
        minX: Math.min(...artworks.map((a) => a.x)),
        maxX: Math.max(...artworks.map((a) => a.x + 1)),
        minY: Math.min(...artworks.map((a) => a.y)),
        maxY: Math.max(...artworks.map((a) => a.y + 1)),
      };
    }

    return { artworks, bounds };
  }

  static async getArtworksInArea(
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
  ): Promise<Artwork[]> {
    const db = getDB();

    const result = await db.queryObject<Artwork & { username: string }>(
      `SELECT a.*, u.username
       FROM artworks a
       JOIN users u ON a.user_id = u.id
       WHERE a.is_expired = FALSE 
         AND a.collected_by IS NULL
         AND a.x < $2 AND a.x >= $1
         AND a.y < $4 AND a.y >= $3`,
      [minX, maxX, minY, maxY]
    );

    return result.rows;
  }

  static async checkCollision(
    x: number,
    y: number,
    excludeId?: number
  ): Promise<boolean> {
    const db = getDB();

    let query = `
      SELECT COUNT(*) as count
      FROM artworks
      WHERE is_expired = FALSE 
        AND collected_by IS NULL
        AND x = $1 AND y = $2
    `;
    const params = [x, y];

    if (excludeId) {
      query += " AND id != $5";
      params.push(excludeId);
    }

    const result = await db.queryObject<{ count: string }>(query, params);
    return parseInt(result.rows[0].count) > 0;
  }
}
