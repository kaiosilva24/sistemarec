
-- Create accounts_receivable table
CREATE TABLE IF NOT EXISTS accounts_receivable (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL,
    customer_name TEXT NOT NULL,
    salesperson_id UUID NOT NULL,
    salesperson_name TEXT NOT NULL,
    product_type TEXT NOT NULL CHECK (product_type IN ('final', 'resale')),
    product_id UUID NOT NULL,
    product_name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    sale_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'cancelled')),
    received_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_customer_id ON accounts_receivable(customer_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_salesperson_id ON accounts_receivable(salesperson_id);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_status ON accounts_receivable(status);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_sale_date ON accounts_receivable(sale_date);
CREATE INDEX IF NOT EXISTS idx_accounts_receivable_created_at ON accounts_receivable(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE accounts_receivable ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON accounts_receivable
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON accounts_receivable TO authenticated;
GRANT ALL ON accounts_receivable TO service_role;
