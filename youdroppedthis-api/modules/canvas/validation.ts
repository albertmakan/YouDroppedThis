import { z } from "zod";
import { colorSchema } from "../artwork/validation.ts";

export const canvasHostingRequestSchema = z.object({
  name: z
    .string()
    .min(3, "Canvas name must be at least 3 characters")
    .max(60, "Canvas name must be at most 60 characters")
    .trim(),

  description: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .trim(),

  canvasSize: z.enum(["sm", "md", "lg"]),

  artworkSize: z
    .number()
    .int()
    .refine((val) => [8, 16, 32, 64].includes(val), {
      message: "Artwork size must be 8, 16, 32 or 64",
    }),

  palette: z
    .array(colorSchema)
    .min(2, "Palette must have at least 2 colors")
    .max(32, "Palette must have at most 32 colors"),

  backgroundColor: colorSchema,

  placementFee: z
    .number()
    .int("Placement fee must be a whole number")
    .min(8, "Placement fee cannot be less than 8 coins")
    .max(20, "Placement fee cannot be more than 20 coins"),
});
