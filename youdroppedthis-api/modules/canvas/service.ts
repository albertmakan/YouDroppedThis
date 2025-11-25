import { getDB } from "../../config/database.ts";
import type { Artwork } from "../artwork/model.ts";
import type { Canvas } from "./model.ts";

export class CanvasService {
  static async getTopCanvases() {
    const db = getDB();

    const result = await db.queryObject<
      Pick<Canvas, "id" | "name" | "background_color">
    >`
      SELECT id, name, background_color FROM app.canvases`;

    return result.rows;
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
