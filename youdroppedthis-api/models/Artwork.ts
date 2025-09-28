export interface Artwork {
  id: number;
  user_id: number;
  username?: string;
  x: number;
  y: number;
  resolution: 16 | 32 | 64;
  pixel_data: string; // JSON string
  created_at: string;
  expires_at: string;
  collected_by?: number;
  collected_at?: string;
  is_expired: boolean;
}
