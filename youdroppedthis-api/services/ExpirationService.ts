import { getDB } from "../config/database.ts";
import { WebSocketService } from "./WebSocketService.ts";

export class ExpirationService {
  private intervalId?: number;

  start() {
    // Check every minute for expired artworks
    this.intervalId = setInterval(() => {
      this.cleanupExpiredArtworks();
    }, 60 * 1000);

    console.log("🕒 Expiration service started");
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async cleanupExpiredArtworks() {
    const db = getDB();

    try {
      // Find expired artworks
      const expiredResult = await db.queryObject<{ id: number }>(
        "SELECT id FROM artworks WHERE expires_at <= NOW() AND is_expired = FALSE AND collected_by IS NULL"
      );

      if (expiredResult.rows.length > 0) {
        const expiredIds = expiredResult.rows.map((row) => row.id);

        // Mark as expired
        await db.queryArray(
          "UPDATE artworks SET is_expired = TRUE WHERE id = ANY($1)",
          [expiredIds]
        );

        // Notify connected clients
        WebSocketService.broadcast({
          type: "artwork_expired",
          data: { expiredIds },
        });

        console.log(`🗑️ Cleaned up ${expiredIds.length} expired artworks`);
      }
    } catch (error) {
      console.error("Error cleaning expired artworks:", error);
    }
  }
}
