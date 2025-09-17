export interface Transaction {
  id: number;
  user_id: number;
  type: "placement" | "collection" | "bonus";
  amount: number;
  artwork_id?: number;
  description?: string;
  created_at: string;
}
