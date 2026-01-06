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

  static async updateBalance(
    userId: string,
    amount: number,
    type: string,
    description: string
  ) {
    const db = getDB();

    // Record transaction, trigger will update balance
    await db.queryArray`
      INSERT INTO app.transactions (user_id, type, amount, description)
      VALUES (${userId}, ${type}, ${amount}, ${description})`;

    // Get updated balance
    const balanceResult = await db.queryObject<{ balance: number }>`
      SELECT balance
      FROM app.profiles
      WHERE id = ${userId}`;

    return {
      success: true,
      message: `Amount of ${amount} coins claimed!`,
      claimedAt: new Date().toISOString(),
      newBalance: balanceResult.rows[0].balance,
      userId,
    };
  }

  static async claimDailyBonus(userId: string) {
    const db = getDB();

    // Check if user already claimed bonus today
    const lastBonusResult = await db.queryObject<{ created_at: string }>`
      SELECT created_at
      FROM app.transactions
      WHERE user_id = ${userId}
        AND created_at > CURRENT_DATE
        AND type = 'bonus'`;

    if (lastBonusResult.rows.length > 0) {
      return {
        success: false,
        message: "Daily bonus already claimed today",
        claimedAt: lastBonusResult.rows[0].created_at,
        userId,
      };
    }

    // Award daily bonus
    return await this.updateBalance(
      userId,
      DAILY_BONUS,
      "bonus",
      "Daily bonus"
    );
  }
}
