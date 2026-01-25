export type Transaction = {
  id: number;
  user_id: string;
  amount: number;
  type:
    | "drop_fee"
    | "collection_reward"
    | "daily_grant"
    | "host_reward"
    | "canvas_creation"
    | "purchase";
  created_at: string;
  artwork_id?: number;
  canvas_id?: number;
};
