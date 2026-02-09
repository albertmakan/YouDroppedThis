import { getDB } from "../../config/database.ts";
import type { Transaction } from "./model.ts";
export const DAILY_BONUS = parseInt(Deno.env.get("DAILY_BONUS") || "10");

export class TransactionService {
  static async getUserTransactions(
    userId: string,
    limit: number,
    page: number
  ) {
    const db = getDB();

    const result = await db.queryObject<Transaction>`
      SELECT *
      FROM app.transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}`;

    return result.rows;
  }

  static async recordTransaction(
    transaction: Omit<Transaction, "id" | "created_at">
  ) {
    const {
      user_id,
      type,
      amount,
      artwork_id = null,
      canvas_id = null,
    } = transaction;
    const db = getDB();
    return await db.queryArray`
      INSERT INTO app.transactions (user_id, type, amount, artwork_id, canvas_id)
      VALUES (${user_id}, ${type}, ${amount}, ${artwork_id}, ${canvas_id})`;
  }

  static async claimDailyBonus(userId: string) {
    const db = getDB();

    // Check if user already claimed bonus today
    const lastBonusResult = await db.queryObject<{ created_at: string }>`
      SELECT created_at
      FROM app.transactions
      WHERE user_id = ${userId}
        AND created_at > CURRENT_DATE
        AND type = 'daily_grant'`;

    if (lastBonusResult.rows.length > 0) {
      return {
        success: false,
        message: "Daily bonus already claimed today",
        claimedAt: lastBonusResult.rows[0].created_at,
        userId,
      };
    }

    // Award daily bonus
    await this.recordTransaction({
      user_id: userId,
      type: "daily_grant",
      amount: DAILY_BONUS,
    });

    // Get updated balance
    const balanceResult = await db.queryObject<{ balance: number }>`
      SELECT balance
      FROM app.profiles
      WHERE id = ${userId}`;

    return {
      success: true,
      message: `Amount of ${DAILY_BONUS} coins claimed!`,
      claimedAt: new Date().toISOString(),
      newBalance: balanceResult.rows[0].balance,
      userId,
    };
  }

  static async getCanvasCreationFee(canvasId: bigint, hostId: string) {
    const db = getDB();

    const result = await db.queryObject<{ amount: number }>`
      SELECT (0-amount) as amount
      FROM app.transactions
      WHERE type = 'canvas_creation'
        AND canvas_id = ${canvasId}
        AND user_id = ${hostId}
      LIMIT 1`;

    return result.rows[0];
  }
}
