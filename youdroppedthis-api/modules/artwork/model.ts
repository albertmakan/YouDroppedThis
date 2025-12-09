export type PixelData = {
  palette: string[];
  mat: number[][];
  bg?: string;
};

export type Artwork = {
  id: number;
  pixel_data: PixelData;
  user_id: string;
  canvas_id: number;
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
