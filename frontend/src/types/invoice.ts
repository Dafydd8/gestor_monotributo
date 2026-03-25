export type Invoice = {
  id: number;
  user_id: number;
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  client_name?: string | null;
  client_cuit?: string | null;
};