import { getDB } from "../config/database.ts";
import { User } from "../models/User.ts";
import { Transaction } from "../models/Transaction.ts";

import { DAILY_BONUS } from "../config/env.ts";

export class UserService {
  static async getUserById(id: number): Promise<User | null> {
    const db = getDB();

    const result = await db.queryObject<User>(
      "SELECT id, username, email, balance, created_at FROM users WHERE id = $1",
      [id]
    );

    return result.rows[0] || null;
  }

  static async getUserTransactions(
    userId: number,
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    const db = getDB();

    const result = await db.queryObject<Transaction>(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
      [userId, limit, offset]
    );

    return result.rows;
  }

  static async claimDailyBonus(
    userId: number
  ): Promise<{ success: boolean; message?: string; newBalance?: number }> {
    const db = getDB();

    // Check if user already claimed bonus today
    const lastBonusResult = await db.queryObject<{ created_at: string }>(
      "SELECT created_at FROM transactions WHERE user_id = $1 AND type = 'bonus' AND description = 'Daily bonus' AND created_at > CURRENT_DATE",
      [userId]
    );

    if (lastBonusResult.rows.length > 0) {
      return { success: false, message: "Daily bonus already claimed today" };
    }

    // Award daily bonus
    await db.queryArray("BEGIN");

    try {
      // Add bonus to user balance
      await db.queryArray(
        "UPDATE users SET balance = balance + $1 WHERE id = $2",
        [DAILY_BONUS, userId]
      );

      // Record transaction
      await db.queryArray(
        "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'bonus', $2, 'Daily bonus')",
        [userId, DAILY_BONUS]
      );

      // Get updated balance
      const balanceResult = await db.queryObject<{ balance: number }>(
        "SELECT balance FROM users WHERE id = $1",
        [userId]
      );

      await db.queryArray("COMMIT");

      return {
        success: true,
        message: `Daily bonus of ${DAILY_BONUS} coins claimed!`,
        newBalance: balanceResult.rows[0].balance,
      };
    } catch (error) {
      await db.queryArray("ROLLBACK");
      throw error;
    }
  }
}
