import { z } from "../../deps.ts";

export const profileUpdateSchema = z.object({
  bio: z.string().max(2000).optional(),
  profilePicture: z
    .object({
      palette: z
        .string()
        .regex(
          /^(#[0-9A-Fa-f]{6}|)$/,
          "Colors must be in hex format (#RRGGBB) or empty string for transparent"
        ) // Allow empty string
        .array()
        .min(1, "Palette must have at least one color")
        .max(2, "Palette cannot exceed 2 colors"),
      mat: z.number().array().max(1).array().max(1),
    })
    .optional(),
});
