export type PixelData = {
  palette: string[];
  mat: number[][];
};

export type Artwork = {
  id: bigint;
  pixel_data: PixelData;
  created_by: string;
  canvas_id: bigint;
  x: number;
  y: number;
  created_at: string;
  collectable_after?: string;
  collected_at?: string;
  collected_by?: string;
  expires_at: string;
  is_expired?: boolean;
};

export type PlacementRequest = {
  x: number;
  y: number;
  pixelData: PixelData;
};
