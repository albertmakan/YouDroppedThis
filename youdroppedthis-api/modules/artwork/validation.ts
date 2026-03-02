import { z } from "../../deps.ts";

export const colorSchema = z
  .string()
  .regex(
    /^(#[0-9A-Fa-f]{6}|)$/,
    "Colors must be in hex format (#RRGGBB) or empty string for transparent",
  );

export const placementSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  guestName: z.string().min(1).max(32).optional(),
  guestSessionId: z.string().uuid().optional(),
  pixelData: z
    .object({
      palette: colorSchema
        .array()
        .min(1, "Palette must have at least one color")
        .max(32, "Palette cannot exceed 32 colors"),
      mat: z
        .number()
        .int()
        .nonnegative("Matrix values must be non-negative")
        .array()
        .min(8, "Matrix rows must have at least 8 elements")
        .max(64, "Matrix rows cannot exceed 64 elements")
        .array()
        .min(8, "Matrix must have at least 8 rows")
        .max(64, "Matrix cannot exceed 64 rows")
        .refine(
          (mat) => {
            // Ensure matrix is rectangular (all rows same length)
            const width = mat[0]?.length || 0;
            return mat.every((row) => row.length === width);
          },
          { message: "All matrix rows must have the same length" },
        )
        .refine(
          (mat) => {
            const validSizes = [8, 16, 32, 64];
            const height = mat.length;
            const width = mat[0]?.length || 0;
            return validSizes.includes(height) && validSizes.includes(width);
          },
          {
            message:
              "Matrix dimensions must be exactly 8x8, 16x16, 32x32 or 64x64",
          },
        ),
    })
    .refine(
      (data) => {
        // Cross-validate: ensure matrix indices don't exceed palette length
        const maxIndex = data.palette.length - 1;
        for (let y = 0; y < data.mat.length; y++) {
          for (let x = 0; x < data.mat[y].length; x++) {
            const value = data.mat[y][x];
            if (value > maxIndex) {
              return false;
            }
          }
        }
        return true;
      },
      (data) => ({
        message: `Matrix contains invalid palette index. All values must be between 0 and ${
          data.palette.length - 1
        }`,
        path: ["mat"],
      }),
    )
    .refine(
      (data) => {
        // Find transparent palette index (empty string)
        const transparentIndex = data.palette.findIndex(
          (color) => color === "",
        );

        // Count non-transparent pixels
        let filledPixels = 0;
        const totalPixels = data.mat.length * (data.mat[0]?.length || 0);

        for (const row of data.mat) {
          for (const value of row) {
            // Pixel is filled if it's not the transparent index
            if (transparentIndex === -1 || value !== transparentIndex) {
              filledPixels++;
            }
          }
        }

        // At least 1/8 should be filled
        const minimumFilled = Math.ceil(totalPixels / 8);
        return filledPixels >= minimumFilled;
      },
      (data) => {
        const totalPixels = data.mat.length * (data.mat[0]?.length || 0);
        const minimumFilled = Math.ceil(totalPixels / 8);
        const transparentIndex = data.palette.findIndex(
          (color) => color === "",
        );

        let filledPixels = 0;
        for (const row of data.mat) {
          for (const value of row) {
            if (transparentIndex === -1 || value !== transparentIndex) {
              filledPixels++;
            }
          }
        }

        const percentage = ((filledPixels / totalPixels) * 100).toFixed(1);

        return {
          message: `Artwork must have at least ${minimumFilled} filled pixels (12.5% of ${totalPixels}). Currently has ${filledPixels} (${percentage}%)`,
          path: ["mat"],
        };
      },
    ),
});
