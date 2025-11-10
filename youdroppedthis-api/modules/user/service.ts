import { getDB } from "../../config/database.ts";
import type { PixelData } from "../artwork/model.ts";
import type { Profile } from "./model.ts";

export class UserService {
  static async getProfileById(id: string) {
    const db = getDB();

    const result = await db.queryObject<Profile>`
      SELECT * FROM app.profiles WHERE id = ${id}`;

    return result.rows[0] || null;
  }

  static async updateProfile(
    userId: string,
    profileUpdate: { bio?: string; profilePicture?: PixelData }
  ) {
    const db = getDB();

    const result = await db.queryObject<Profile>(
      `
      UPDATE app.profiles SET
        ${profileUpdate.bio !== undefined ? "bio = $bio," : ""}
        ${
          profileUpdate.profilePicture !== undefined
            ? "profile_picture = $profilePicture,"
            : ""
        }
        updated_at = NOW()
      WHERE id = $userId
      RETURNING *`,
      { ...profileUpdate, userId }
    );

    return result.rows[0] || null;
  }
}
