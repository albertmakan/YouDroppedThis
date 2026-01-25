import { z } from "zod";
import { colorSchema } from "../artwork/validation.ts";

export const canvasHostingRequestSchema = z
  .object({
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
      .refine((val) => [8, 16, 32].includes(val), {
        message: "Artwork size must be 8, 16, or 32",
      }),

    palette: z
      .array(colorSchema)
      .min(4, "Palette must have at least 4 colors")
      .max(12, "Palette must have at most 12 colors"),

    backgroundColor: colorSchema,

    placementFee: z
      .number()
      .int("Placement fee must be a whole number")
      .min(8, "Placement fee cannot be less than 8 coins")
      .max(20, "Placement fee cannot be more than 20 coins"),
  })
  .refine(
    (data) => {
      if (data.canvasSize !== "lg" && data.artworkSize === 32) {
        return false;
      }
      return true;
    },
    {
      message: "32×32 artwork is only available for large canvases",
      path: ["artworkSize"],
    }
  );
