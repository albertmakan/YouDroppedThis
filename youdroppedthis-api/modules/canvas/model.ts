export type Canvas = {
  id: bigint;
  created_at: string;
  name: string;
  accepting_artworks: boolean;
  placement_fee: number;
  artwork_expiry_minutes: number;
  min_visibility_minutes: number;
  max_artworks_per_user_per_hour: number;
  description: string;
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
  background_color?: string;
  palette?: string[];
  first_artwork_at?: string;
  last_artwork_at?: string;
  end_at: string;
  created_by?: string;
  artwork_resolution: number;
  reward_claimed_at?: string;
  total_artworks_placed: bigint;
  total_artworks_collected: bigint;
  active_artworks_count: bigint;
};

export type CanvasHostingRequest = {
  name: string;
  description: string;
  canvasSize: "sm" | "md" | "lg";
  artworkSize: number;
  palette: string[];
  backgroundColor: string;
  placementFee: number;
};
