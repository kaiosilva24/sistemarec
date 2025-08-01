
-- Criar tabela de métricas centralizadas do sistema
CREATE TABLE IF NOT EXISTS metricas_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria TEXT NOT NULL CHECK (categoria IN ('financeiro', 'producao', 'estoque', 'vendas', 'custos')),
  nome_metrica TEXT NOT NULL,
  valor_numerico DECIMAL(15,2),
  valor_texto TEXT,
  valor_percentual DECIMAL(5,2),
  unidade TEXT, -- 'BRL', 'unidades', '%', 'kg', etc.
  descricao TEXT,
  periodo_referencia TEXT, -- 'diario', 'mensal', 'anual', 'total'
  data_referencia DATE DEFAULT CURRENT_DATE,
  timestamp_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_metricas_categoria ON metricas_sistema(categoria);
CREATE INDEX IF NOT EXISTS idx_metricas_nome ON metricas_sistema(nome_metrica);
CREATE INDEX IF NOT EXISTS idx_metricas_ativo ON metricas_sistema(ativo);
CREATE INDEX IF NOT EXISTS idx_metricas_periodo ON metricas_sistema(periodo_referencia);
CREATE INDEX IF NOT EXISTS idx_metricas_data ON metricas_sistema(data_referencia);
CREATE INDEX IF NOT EXISTS idx_metricas_timestamp ON metricas_sistema(timestamp_atualizacao);

-- Função para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION update_metricas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.timestamp_atualizacao = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar timestamp
CREATE TRIGGER update_metricas_sistema_timestamp
    BEFORE UPDATE ON metricas_sistema
    FOR EACH ROW
    EXECUTE FUNCTION update_metricas_timestamp();

-- Habilitar Realtime para a tabela
ALTER PUBLICATION supabase_realtime ADD TABLE metricas_sistema;

-- Inserir métricas iniciais do sistema
INSERT INTO metricas_sistema (categoria, nome_metrica, valor_numerico, unidade, descricao, periodo_referencia) VALUES
-- Métricas Financeiras
('financeiro', 'saldo_atual', 0.00, 'BRL', 'Saldo atual do fluxo de caixa', 'total'),
('financeiro', 'total_entradas', 0.00, 'BRL', 'Total de entradas de caixa', 'total'),
('financeiro', 'total_saidas', 0.00, 'BRL', 'Total de saídas de caixa', 'total'),
('financeiro', 'media_diaria_entradas', 0.00, 'BRL', 'Média diária de entradas', 'diario'),
('financeiro', 'media_diaria_saidas', 0.00, 'BRL', 'Média diária de saídas', 'diario'),
('financeiro', 'projecao_30_dias', 0.00, 'BRL', 'Projeção de saldo para 30 dias', 'mensal'),

-- Métricas de Produção
('producao', 'total_produzido', 0.00, 'unidades', 'Total de pneus produzidos', 'total'),
('producao', 'producao_media_diaria', 0.00, 'unidades', 'Média de produção por dia', 'diario'),
('producao', 'eficiencia_media', 0.00, '%', 'Eficiência média de produção', 'total'),
('producao', 'perdas_producao', 0.00, 'unidades', 'Total de perdas na produção', 'total'),
('producao', 'perdas_material', 0.00, 'unidades', 'Total de perdas de material', 'total'),
('producao', 'dias_producao_ativa', 0.00, 'dias', 'Dias com produção ativa', 'total'),

-- Métricas de Estoque
('estoque', 'valor_total_materia_prima', 0.00, 'BRL', 'Valor total em estoque de matéria-prima', 'total'),
('estoque', 'valor_total_produtos_finais', 0.00, 'BRL', 'Valor total em estoque de produtos finais', 'total'),
('estoque', 'valor_total_revenda', 0.00, 'BRL', 'Valor total em estoque de revenda', 'total'),
('estoque', 'tipos_material_estoque', 0.00, 'tipos', 'Tipos de materiais em estoque', 'total'),
('estoque', 'alertas_estoque_baixo', 0.00, 'alertas', 'Número de alertas de estoque baixo', 'total'),
('estoque', 'quantidade_total_mp', 0.00, 'unidades', 'Quantidade total de matéria-prima', 'total'),

-- Métricas de Custos
('custos', 'custo_medio_pneu', 0.00, 'BRL', 'Custo médio por pneu produzido', 'total'),
('custos', 'lucro_medio_pneu', 0.00, 'BRL', 'Lucro médio por pneu', 'total'),
('custos', 'margem_lucro_media', 0.00, '%', 'Margem de lucro média', 'total'),
('custos', 'custo_total_fixo', 0.00, 'BRL', 'Total de custos fixos', 'mensal'),
('custos', 'custo_total_variavel', 0.00, 'BRL', 'Total de custos variáveis', 'mensal'),
('custos', 'lucro_total_produtos_finais', 0.00, 'BRL', 'Lucro total de produtos finais', 'total'),

-- Métricas de Vendas
('vendas', 'vendas_pneus_defeituosos', 0.00, 'BRL', 'Vendas de pneus defeituosos', 'total'),
('vendas', 'quantidade_defeituosos_vendidos', 0.00, 'unidades', 'Quantidade de pneus defeituosos vendidos', 'total'),
('vendas', 'garantias_registradas', 0.00, 'unidades', 'Total de garantias registradas', 'total'),
('vendas', 'receita_total_vendas', 0.00, 'BRL', 'Receita total de vendas', 'total');

-- Função para buscar métricas por categoria
CREATE OR REPLACE FUNCTION get_metricas_por_categoria(categoria_filtro TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  categoria TEXT,
  nome_metrica TEXT,
  valor_numerico DECIMAL(15,2),
  valor_texto TEXT,
  valor_percentual DECIMAL(5,2),
  unidade TEXT,
  descricao TEXT,
  periodo_referencia TEXT,
  data_referencia DATE,
  timestamp_atualizacao TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF categoria_filtro IS NULL THEN
    RETURN QUERY
    SELECT m.id, m.categoria, m.nome_metrica, m.valor_numerico, m.valor_texto, 
           m.valor_percentual, m.unidade, m.descricao, m.periodo_referencia,
           m.data_referencia, m.timestamp_atualizacao
    FROM metricas_sistema m
    WHERE m.ativo = TRUE
    ORDER BY m.categoria, m.nome_metrica;
  ELSE
    RETURN QUERY
    SELECT m.id, m.categoria, m.nome_metrica, m.valor_numerico, m.valor_texto, 
           m.valor_percentual, m.unidade, m.descricao, m.periodo_referencia,
           m.data_referencia, m.timestamp_atualizacao
    FROM metricas_sistema m
    WHERE m.ativo = TRUE AND m.categoria = categoria_filtro
    ORDER BY m.nome_metrica;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar uma métrica específica
CREATE OR REPLACE FUNCTION atualizar_metrica(
  nome_metrica_param TEXT,
  valor_numerico_param DECIMAL(15,2) DEFAULT NULL,
  valor_texto_param TEXT DEFAULT NULL,
  valor_percentual_param DECIMAL(5,2) DEFAULT NULL,
  categoria_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE metricas_sistema 
  SET 
    valor_numerico = COALESCE(valor_numerico_param, valor_numerico),
    valor_texto = COALESCE(valor_texto_param, valor_texto),
    valor_percentual = COALESCE(valor_percentual_param, valor_percentual),
    timestamp_atualizacao = NOW(),
    updated_at = NOW()
  WHERE nome_metrica = nome_metrica_param
    AND (categoria_param IS NULL OR categoria = categoria_param)
    AND ativo = TRUE;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- View para dashboard principal com todas as métricas
CREATE OR REPLACE VIEW dashboard_metrics AS
SELECT 
  categoria,
  nome_metrica,
  CASE 
    WHEN valor_numerico IS NOT NULL THEN valor_numerico::TEXT || ' ' || COALESCE(unidade, '')
    WHEN valor_percentual IS NOT NULL THEN valor_percentual::TEXT || '%'
    ELSE valor_texto
  END as valor_formatado,
  valor_numerico,
  valor_percentual,
  unidade,
  descricao,
  periodo_referencia,
  timestamp_atualizacao,
  EXTRACT(EPOCH FROM (NOW() - timestamp_atualizacao))/60 as minutos_desde_atualizacao
FROM metricas_sistema 
WHERE ativo = TRUE
ORDER BY categoria, nome_metrica;

-- Conceder permissões
GRANT ALL ON metricas_sistema TO authenticated;
GRANT ALL ON metricas_sistema TO anon;
GRANT EXECUTE ON FUNCTION get_metricas_por_categoria TO authenticated;
GRANT EXECUTE ON FUNCTION get_metricas_por_categoria TO anon;
GRANT EXECUTE ON FUNCTION atualizar_metrica TO authenticated;
GRANT SELECT ON dashboard_metrics TO authenticated;
GRANT SELECT ON dashboard_metrics TO anon;

-- Comentários para documentação
COMMENT ON TABLE metricas_sistema IS 'Tabela centralizada de métricas do sistema com atualizações em tempo real';
COMMENT ON COLUMN metricas_sistema.categoria IS 'Categoria da métrica: financeiro, producao, estoque, vendas, custos';
COMMENT ON COLUMN metricas_sistema.nome_metrica IS 'Nome único identificador da métrica';
COMMENT ON COLUMN metricas_sistema.valor_numerico IS 'Valor numérico da métrica (para valores monetários, quantidades, etc.)';
COMMENT ON COLUMN metricas_sistema.valor_percentual IS 'Valor percentual da métrica (0-100)';
COMMENT ON COLUMN metricas_sistema.timestamp_atualizacao IS 'Timestamp da última atualização da métrica';
