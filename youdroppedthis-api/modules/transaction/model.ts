export type Transaction = {
  id: number;
  user_id: string;
  amount: number;
  type: string;
  created_at: string;
  description?: string;
  artwork_id?: number;
};
