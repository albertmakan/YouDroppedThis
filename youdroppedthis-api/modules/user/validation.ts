import { z } from "../../deps.ts";

export const profileUpdateSchema = z.object({
  bio: z.string().optional(),
  profilePicture: z
    .object({
      palette: z.string().array(),
      mat: z.number().array().array(),
    })
    .optional(),
});
