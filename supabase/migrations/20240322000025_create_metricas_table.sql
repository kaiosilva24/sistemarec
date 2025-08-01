
-- Criar tabela de métricas para dados do dashboard
CREATE TABLE IF NOT EXISTS metricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  valor DECIMAL(15,3) NOT NULL,
  descricao TEXT,
  categoria TEXT DEFAULT 'geral',
  unidade TEXT DEFAULT 'BRL',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir métricas iniciais
INSERT INTO metricas (nome, valor, descricao, categoria, unidade) VALUES
('custo_medio_pneu', 85.55, 'Custo médio por pneu calculado dinamicamente', 'custos', 'BRL'),
('lucro_medio_pneu', 61.62, 'Lucro médio por pneu', 'lucros', 'BRL'),
('lucro_produto_final', 61.62, 'Lucro médio por produto final', 'lucros', 'BRL'),
('lucro_total_produtos_finais', 2832.20, 'Lucro total de produtos finais', 'lucros', 'BRL'),
('porcentagem_lucro', 42.5, 'Porcentagem de lucro sobre vendas', 'lucros', '%')
ON CONFLICT (nome) DO UPDATE SET
  valor = EXCLUDED.valor,
  updated_at = NOW();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_metricas_nome ON metricas(nome);
CREATE INDEX IF NOT EXISTS idx_metricas_categoria ON metricas(categoria);
CREATE INDEX IF NOT EXISTS idx_metricas_updated_at ON metricas(updated_at);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_metricas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS trigger_update_metricas_updated_at ON metricas;
CREATE TRIGGER trigger_update_metricas_updated_at
    BEFORE UPDATE ON metricas
    FOR EACH ROW
    EXECUTE FUNCTION update_metricas_updated_at();

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE metricas;

-- Comentários na tabela
COMMENT ON TABLE metricas IS 'Tabela para armazenar métricas do dashboard com sincronização em tempo real';
COMMENT ON COLUMN metricas.nome IS 'Nome único da métrica (ex: lucro_medio_pneu)';
COMMENT ON COLUMN metricas.valor IS 'Valor numérico da métrica com alta precisão';
COMMENT ON COLUMN metricas.categoria IS 'Categoria da métrica (custos, lucros, vendas, etc)';
COMMENT ON COLUMN metricas.unidade IS 'Unidade de medida (BRL, %, unidades, etc)';
