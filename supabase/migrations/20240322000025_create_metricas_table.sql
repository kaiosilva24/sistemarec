
-- Create metricas table for realtime synchronization
CREATE TABLE IF NOT EXISTS metricas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  descricao TEXT,
  categoria TEXT DEFAULT 'geral',
  unidade TEXT DEFAULT 'currency',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_metricas_nome ON metricas(nome);
CREATE INDEX IF NOT EXISTS idx_metricas_categoria ON metricas(categoria);
CREATE INDEX IF NOT EXISTS idx_metricas_updated_at ON metricas(updated_at DESC);

-- Insert initial metrics
INSERT INTO metricas (nome, valor, descricao, categoria, unidade) VALUES
('lucro_medio', 0.00, 'Lucro Médio por Pneu', 'financeiro', 'currency'),
('lucro_medio_produto_final', 69.078, 'Lucro Médio por Produto Final', 'financeiro', 'currency'),
('lucro_medio_pneu', 69.078, 'Lucro Médio/Pneu (Métricas)', 'financeiro', 'currency'),
('custo_medio', 0.00, 'Custo Médio por Pneu', 'financeiro', 'currency'),
('margem_lucro', 0.00, 'Margem de Lucro (%)', 'financeiro', 'percentage'),
('saldo_caixa', 0.00, 'Saldo de Caixa', 'financeiro', 'currency')
ON CONFLICT (nome) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_metricas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_metricas_updated_at ON metricas;
CREATE TRIGGER update_metricas_updated_at
    BEFORE UPDATE ON metricas
    FOR EACH ROW
    EXECUTE FUNCTION update_metricas_updated_at();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE metricas;
