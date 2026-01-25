import { z } from "../../deps.ts";
import { colorSchema } from "../artwork/validation.ts";

export const profileUpdateSchema = z.object({
  bio: z.string().max(500).optional(),
  profilePicture: z
    .object({
      palette: colorSchema
        .array()
        .min(1, "Palette must have at least one color")
        .max(2, "Palette cannot exceed 2 colors"),
      mat: z.number().array().max(1).array().max(1),
    })
    .optional(),
});
