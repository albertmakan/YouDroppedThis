import { getDB } from "../config/database.ts";
import { bcrypt, create, getNumericDate } from "../deps.ts";
import { JWT_SECRET, DAILY_BONUS } from "../config/env.ts";
import { User } from "../models/User.ts";

export class AuthService {
  static async register(
    username: string,
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const db = getDB();

    // Check if user exists
    const existingUser = await db.queryObject<{ id: number }>(
      "SELECT id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password);

    // Create user
    const result = await db.queryObject<User>(
      "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, balance, created_at",
      [username, email, passwordHash]
    );

    const user = result.rows[0];

    // Create welcome bonus transaction
    await db.queryArray(
      "INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'bonus', $2, 'Welcome bonus')",
      [user.id, DAILY_BONUS]
    );

    const token = await this.generateToken(user.id, username);

    return { user, token };
  }

  static async login(
    username: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const db = getDB();

    const result = await db.queryObject<User & { password_hash: string }>(
      "SELECT id, username, email, balance, created_at, password_hash FROM users WHERE username = $1",
      [username]
    );

    if (result.rows.length === 0) {
      throw new Error("Invalid credentials");
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    const token = await this.generateToken(user.id, user.username);

    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  private static async generateToken(
    userId: number,
    username: string
  ): Promise<string> {
    const payload = {
      sub: userId.toString(),
      username,
      iat: getNumericDate(new Date()),
      exp: getNumericDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
    };

    const secret = await crypto.subtle.importKey(
      "raw",
      JWT_SECRET,
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign", "verify"]
    );
    return await create({ alg: "HS256", typ: "JWT" }, payload, secret);
  }
}
