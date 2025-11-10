import type { PixelData } from "../artwork/model.ts";

export type Profile = {
  id: string;
  username: string;
  profile_picture?: PixelData;
  bio?: string;
  balance: number;
  artworks_placed_count?: number;
  artworks_collected_count?: number;
  created_at: string;
  updated_at?: string;
};
