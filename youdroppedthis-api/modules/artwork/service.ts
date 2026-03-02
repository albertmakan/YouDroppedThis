import { getDB } from "../../config/database.ts";
import type { Artwork, PlacementRequest } from "./model.ts";
import { UserService } from "../user/service.ts";
import { TransactionService } from "../transaction/service.ts";
import type { Canvas } from "../canvas/model.ts";
const COLLECTION_COOLDOWN_MINUTES = parseInt(
  Deno.env.get("COLLECTION_COOLDOWN_MINUTES") || "60"
);

export class ArtworkService {
  static async placeArtwork(
    ctx: {
      userId?: string;
      guestName?: string;
      guestSessionId?: string;
    },
    canvasId: bigint,
    { x, y, pixelData }: PlacementRequest
  ) {
    const db = getDB();

    const canvasResult = await db.queryObject<Canvas>`
      SELECT *
      FROM app.canvases
      WHERE id = ${canvasId}`;
    if (!canvasResult.rowCount) {
      return { error: "Canvas not found", code: 404 };
    }
    const canvas = canvasResult.rows[0];

    const now = new Date().toISOString();
    if (!canvas.accepting_artworks || canvas.end_at < now) {
      return { error: "Canvas is not accepting artworks", code: 400 };
    }
    if (x < canvas.min_x || x > canvas.max_x || y < canvas.min_y || y > canvas.max_y) {
      return { error: "Position is out of bounds", code: 400 };
    }
    if (pixelData.mat.length !== canvas.artwork_resolution) {
      return { error: "Wrong resolution", code: 400 };
    }

    const isAnonymous = !ctx.userId;

    if (!isAnonymous) {
      const userId = ctx.userId!;
      // Check user balance
      const userProfile = await UserService.getProfileById(userId);
      if (!userProfile || userProfile.balance < canvas.placement_fee) {
        return { error: "Insufficient balance", code: 402 };
      }

      // Check rate limits (max n placements per hour)
      if (
        userProfile.last_placed_at &&
        isInPastNMinutes(userProfile.last_placed_at, 60) &&
        (userProfile.artworks_placed_count ?? 0) >
          canvas.max_artworks_per_user_per_hour
      ) {
        const placementCountResult = await db.queryObject<{ count: bigint }>`
          SELECT COUNT(*) AS count
          FROM app.artworks
          WHERE canvas_id = ${canvas.id}
            AND created_by = ${userId}
            AND created_at > NOW() - INTERVAL '1 hour'`;
        if (placementCountResult.rows[0].count >= canvas.max_artworks_per_user_per_hour) {
          return {
            error: "Rate limit exceeded (placements per hour)",
            code: 429,
          };
        }
      }
    } else {
      if (!canvas.allow_anonymous_placement || canvas.placement_fee !== 0) {
        return {
          error: "Authentication required to place on this canvas",
          code: 401,
        };
      }

      if (!ctx.guestName || !ctx.guestSessionId) {
        return {
          error: "Anonymous placement requires guestName and guestSessionId",
          code: 400,
        };
      }

      // Anonymous rate limiting by guest_session_id
      const placementCountResult = await db.queryObject<{ count: bigint }>`
        SELECT COUNT(*) AS count
        FROM app.artworks
        WHERE canvas_id = ${canvas.id}
          AND guest_session_id = ${ctx.guestSessionId}
          AND created_at > NOW() - INTERVAL '1 hour'`;
      if (placementCountResult.rows[0].count >= canvas.max_artworks_per_user_per_hour) {
        return {
          error: "Rate limit exceeded (anonymous placements)",
          code: 429,
        };
      }
    }

    // Begin transaction
    await db.queryArray("BEGIN");

    try {
      // Create artwork
      const artworkResult = await db.queryObject<Artwork>`
        INSERT INTO app.artworks (canvas_id, created_by, x, y, pixel_data, expires_at, collectable_after, guest_name, guest_session_id)
        VALUES (
          ${canvas.id},
          ${ctx.userId ?? null},
          ${x},
          ${y},
          ${pixelData},
          NOW() + INTERVAL '1 minute' * ${canvas.artwork_expiry_minutes},
          NOW() + INTERVAL '1 minute' * ${canvas.min_visibility_minutes ?? 1},
          ${ctx.guestName ?? null},
          ${ctx.guestSessionId ?? null}
        )
        RETURNING *`;
      const artwork = artworkResult.rows[0];

      if (!isAnonymous && canvas.placement_fee > 0) {
        const userId = ctx.userId!;
        // Record transaction
        await TransactionService.recordTransaction({
          user_id: userId,
          type: "drop_fee",
          amount: -canvas.placement_fee,
          artwork_id: artwork.id,
          canvas_id: canvas.id,
        });
      }

      await db.queryArray("COMMIT");

      let userProfile;
      if (!isAnonymous) {
        // Get updated user info
        userProfile = await UserService.getProfileById(ctx.userId!);
      }

      return { artwork, userProfile };
    } catch (error) {
      await db.queryArray("ROLLBACK");
      if ((error as { fields: { code: string } }).fields.code === "23505") {
        return { error: "That spot is already taken", code: 409 };
      }
      throw error;
    }
  }

  static async collectArtwork(
    userId: string,
    canvasId: bigint,
    artworkId: bigint
  ) {
    const db = getDB();

    // Get artwork details
    const artworkResult = await db.queryObject<
      Artwork & Pick<Canvas, "placement_fee">
    >`
      SELECT a.*, c.placement_fee
      FROM app.artworks a
      JOIN app.canvases c ON c.id = a.canvas_id
      WHERE a.id = ${artworkId}
        AND a.canvas_id = ${canvasId}`;

    if (!artworkResult.rowCount) {
      return { error: "Artwork not found", code: 404 };
    }
    const { placement_fee, ...artwork } = artworkResult.rows[0];
    const now = new Date().toISOString();
    if (artwork.is_expired || artwork.expires_at < now) {
      return { error: "Artwork has expired", code: 400 };
    }
    if (artwork.collected_by) {
      return { error: "Artwork already collected", code: 409 };
    }
    if (artwork.created_by === userId) {
      return { error: "Cannot collect own artwork", code: 400 };
    }
    if (artwork.collectable_after && artwork.collectable_after > now) {
      return { error: "Artwork not collectable yet", code: 400 };
    }

    // Check rate limits
    const { last_collected_at } = await UserService.getProfileById(userId);
    if (last_collected_at) {
      if (isInPastNMinutes(last_collected_at, COLLECTION_COOLDOWN_MINUTES)) {
        return { error: "Collection cooldown period", code: 429 };
      }
      const collectionCountResult = await db.queryObject<{ count: bigint }>`
        SELECT COUNT(*) AS count
        FROM app.artworks
        WHERE canvas_id = ${canvasId}
          AND collected_by = ${userId}
          AND collected_at IS NOT NULL`;
      if (collectionCountResult.rows[0].count >= 1) {
        return {
          error: "Rate limit exceeded (collection per canvas)",
          code: 429,
        };
      }
    }

    // Begin transaction
    await db.queryArray("BEGIN");

    try {
      // Update artwork as collected
      const updateResult = await db.queryArray`
        UPDATE app.artworks
        SET collected_by = ${userId}, collected_at = NOW()
        WHERE id = ${artworkId}
          AND is_expired = FALSE
          AND expires_at > NOW()
          AND collected_at IS NULL
          AND created_by <> ${userId}
          AND collectable_after <= NOW()`;

      if (!updateResult.rowCount) {
        await db.queryArray("ROLLBACK");
        return { error: "Artwork could not be collected", code: 409 };
      }

      if (artwork.created_by && placement_fee > 0) {
        const reward = this.calculateCollectionReward(artwork, placement_fee);

        // Record transaction
        await TransactionService.recordTransaction({
          user_id: artwork.created_by,
          type: "collection_reward",
          amount: reward,
          artwork_id: artwork.id,
          canvas_id: canvasId,
        });
      }

      await db.queryArray("COMMIT");

      // Get updated user info
      const userProfile = await UserService.getProfileById(userId);

      return { artwork, userProfile };
    } catch (error) {
      await db.queryArray("ROLLBACK");
      throw error;
    }
  }

  static async getPlacedArtworksByUser(
    userId: string,
    page: number,
    limit: number
  ) {
    const db = getDB();

    const artworksResults = await db.queryObject<Artwork>`
      SELECT a.*, c.name as canvas_name, c.background_color,
        CASE WHEN a.collected_by IS NULL THEN NULL ELSE jsonb_build_object(
          'username', collector.username,
          'profile_picture', collector.profile_picture
        ) END as collector
      FROM app.artworks a
      LEFT JOIN app.profiles collector ON collector.id = a.collected_by
      JOIN app.canvases c ON c.id = a.canvas_id
      WHERE a.created_by = ${userId}
      ORDER BY a.created_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    return artworksResults.rows;
  }

  static async getCollectedArtworksByUser(
    userId: string,
    page: number,
    limit: number
  ) {
    const db = getDB();

    const artworksResults = await db.queryObject<Artwork>`
      SELECT a.*, c.name as canvas_name, c.background_color,
        jsonb_build_object(
          'username', creator.username,
          'profile_picture', creator.profile_picture
        ) as creator
      FROM app.artworks a
      JOIN app.profiles creator ON creator.id = a.created_by
      JOIN app.canvases c ON c.id = a.canvas_id
      WHERE a.collected_by = ${userId}
      ORDER BY a.collected_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    return artworksResults.rows;
  }

  static calculateCollectionReward(artwork: Artwork, placementFee: number) {
    const createdAtTime = new Date(artwork.created_at).getTime();
    const visibleMinutes = (Date.now() - createdAtTime) / 60_000;
    const totalLifetime =
      new Date(artwork.expires_at).getTime() - createdAtTime;
    const survivalRatio = visibleMinutes / totalLifetime;
    const resolutionWeight =
      0.25 + Math.log2(artwork.pixel_data.mat.length) * 0.15;
    const base = placementFee * 0.6;
    const survivalBonus = (base * survivalRatio) ^ 1.5;
    const resolutionBonus = base * resolutionWeight * 0.3;
    const reward = base + survivalBonus + resolutionBonus;
    return Math.round(reward);
  }
}

function isInPastNMinutes(dateTime: string, nMinutes: number) {
  return Date.now() - new Date(dateTime).getTime() < nMinutes * 60_000;
}
