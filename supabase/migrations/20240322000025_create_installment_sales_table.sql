
-- Create installment_sales table for sales on credit
CREATE TABLE IF NOT EXISTS installment_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('final', 'resale')),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  salesperson_id TEXT NOT NULL,
  salesperson_name TEXT NOT NULL,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  description TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  received_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received')),
  cash_flow_entry_id UUID REFERENCES cash_flow_entries(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_installment_sales_status ON installment_sales(status);
CREATE INDEX IF NOT EXISTS idx_installment_sales_customer ON installment_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_installment_sales_due_date ON installment_sales(due_date);

-- Enable RLS
ALTER TABLE installment_sales ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users
CREATE POLICY installment_sales_policy ON installment_sales
  FOR ALL USING (true) WITH CHECK (true);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE installment_sales;
