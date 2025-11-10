import { z } from "../../deps.ts";

export const placementSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
  pixelData: z.object({
    palette: z.string().array(),
    mat: z.number().array().array(),
  }),
});
