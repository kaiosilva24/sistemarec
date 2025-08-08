import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../../supabase/supabase'
import { DashboardMetrics, MetricHistory } from '../types/metrics'
import { dataManager } from '../utils/dataManager'

// Hook para métricas principais do dashboard
export const useDashboardMetrics = () => {
  const queryClient = useQueryClient();

  // Forçar limpeza inicial do cache para garantir dados frescos
  React.useEffect(() => {
    console.log('🧽 [useDashboardMetrics] Limpeza inicial do cache...');
    
    // Limpar localStorage na inicialização
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('dashboard_tireProfitValue')) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ [useDashboardMetrics] Removido localStorage inicial: ${key}`);
    });
  }, []);

  const query = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async (): Promise<DashboardMetrics> => {
      console.log('🔄 [useMetrics] INICIANDO sincronização completa de métricas...');
      
      try {
        // 🎯 BUSCAR VALORES REAIS DO SUPABASE PRIMEIRO
        const [
          saldoCaixa,
          valorTotalEstoque,
          valorProdutosFinais,
          valorMateriaPrima,
          valorProdutosRevenda,
          lucroResaleProducts
        ] = await Promise.all([
          dataManager.loadCashBalance(),
          dataManager.loadTotalStockValue(),
          dataManager.loadFinalProductStockBalance(),
          dataManager.loadRawMaterialStockBalance(),
          dataManager.loadResaleTotalStockValue(),
          dataManager.loadAverageResaleProfit()
        ]);

        console.log('📊 [useMetrics] Valores REAIS carregados do Supabase:');
        console.log(`  - Saldo Caixa: R$ ${saldoCaixa.toFixed(2)}`);
        console.log(`  - Total Estoque (calculado): R$ ${valorTotalEstoque.toFixed(2)}`);
        console.log(`  - Produtos Finais: R$ ${valorProdutosFinais.toFixed(2)}`);
        console.log(`  - Matéria Prima: R$ ${valorMateriaPrima.toFixed(2)}`);
        console.log(`  - Produtos Revenda: R$ ${valorProdutosRevenda.toFixed(2)}`);
        console.log(`  - Lucro Revenda: R$ ${lucroResaleProducts.toFixed(2)}`);

        // ✅ RECALCULAR VALOR TOTAL DO ESTOQUE (soma de todos os componentes)
        const totalEstoqueRecalculado = valorProdutosFinais + valorMateriaPrima + valorProdutosRevenda;
        console.log(`🧮 [useMetrics] Total Estoque RECALCULADO: R$ ${totalEstoqueRecalculado.toFixed(2)}`);
        console.log(`  = Produtos Finais (R$ ${valorProdutosFinais.toFixed(2)}) + Matéria Prima (R$ ${valorMateriaPrima.toFixed(2)}) + Produtos Revenda (R$ ${valorProdutosRevenda.toFixed(2)})`);

        // 💼 CALCULAR VALOR EMPRESARIAL TOTAL
        const valorEmpresarial = saldoCaixa + totalEstoqueRecalculado;
        console.log(`🏢 [useMetrics] VALOR EMPRESARIAL TOTAL: R$ ${valorEmpresarial.toFixed(2)}`);
        console.log(`  = Saldo Caixa (R$ ${saldoCaixa.toFixed(2)}) + Total Estoque (R$ ${totalEstoqueRecalculado.toFixed(2)})`);

        // Salvar valor empresarial no dataManager para sincronização
        await dataManager.saveBusinessValue(valorEmpresarial);

        // 📊 Retornar métricas sincronizadas
        const finalMetrics: DashboardMetrics = {
          saldoCaixa: saldoCaixa,
          totalEstoque: totalEstoqueRecalculado,
          vendasDia: 2850.00,         // Mock - implementar depois
          vendasMes: 45670.80,        // Mock - implementar depois
          contasReceber: 12500.00,    // Mock - implementar depois
          contasPagar: 8750.30,       // Mock - implementar depois
          produtosBaixoEstoque: 15,   // Mock - implementar depois
          clientesAtivos: 342,        // Mock - implementar depois
          ticketMedio: 125.50,        // Mock - implementar depois
          margemLucro: 35.2,          // Mock - implementar depois
          lucroResaleProducts: lucroResaleProducts,
          valorTotalProdutosRevenda: valorProdutosRevenda,
          valorEmpresarial: valorEmpresarial  // Adicionar valor empresarial
        };

        console.log('✅ [useMetrics] Métricas SINCRONIZADAS com sucesso:', {
          saldoCaixa: `R$ ${finalMetrics.saldoCaixa.toFixed(2)}`,
          totalEstoque: `R$ ${finalMetrics.totalEstoque.toFixed(2)}`,
          valorEmpresarial: `R$ ${finalMetrics.valorEmpresarial!.toFixed(2)}`,
          lucroResaleProducts: `R$ ${finalMetrics.lucroResaleProducts.toFixed(2)}`,
          valorProdutosRevenda: `R$ ${finalMetrics.valorTotalProdutosRevenda.toFixed(2)}`
        });

        // Disparar evento de sincronização bem-sucedida
        const syncEvent = new CustomEvent('metricsFullySynced', {
          detail: {
            metrics: finalMetrics,
            timestamp: Date.now(),
            source: 'useMetrics-Complete-Sync'
          }
        });
        window.dispatchEvent(syncEvent);

        return finalMetrics;
        
      } catch (error) {
        console.error('❌ [useMetrics] ERRO na sincronização completa:', error);
        
        // Em caso de erro, usar valores de fallback mínimos
        const fallbackMetrics: DashboardMetrics = {
          saldoCaixa: 0,
          totalEstoque: 0,
          vendasDia: 0,
          vendasMes: 0,
          contasReceber: 0,
          contasPagar: 0,
          produtosBaixoEstoque: 0,
          clientesAtivos: 0,
          ticketMedio: 0,
          margemLucro: 0,
          lucroResaleProducts: 0,
          valorTotalProdutosRevenda: 0,
          valorEmpresarial: 0
        };
        
        return fallbackMetrics;
      }
    },
    refetchInterval: 3000, // Sincronizar a cada 3 segundos
    staleTime: 0, // Sempre buscar dados frescos
    gcTime: 0, // Não manter cache
  })

  // Configurar realtime subscription e listener para eventos customizados
  useEffect(() => {
    console.log(' [useMetrics] localStorage DESABILITADO - usando APENAS Supabase');
    
    // Listener para evento customizado de atualização de estoque
    const handleStockUpdate = (event: CustomEvent) => {
      console.log('🔄 [useDashboardMetrics] Evento stockItemsUpdated recebido');
      console.log('🔄 [useDashboardMetrics] Forçando refetch direto do Supabase...');
      query.refetch();
    };

    // Registrar listener para evento customizado
    window.addEventListener('stockItemsUpdated', handleStockUpdate as EventListener);
    console.log(' [useDashboardMetrics] Listener para stockItemsUpdated registrado');

    const channel = supabase
      .channel('dashboard-metrics')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public',
          table: 'vendas' // Ajuste conforme suas tabelas
        }, 
        () => {
          // Invalidar cache quando houver mudanças
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public',
          table: 'estoque' 
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] })
        }
      )
      .subscribe()

    return () => {
      // Remover listener customizado
      window.removeEventListener('stockItemsUpdated', handleStockUpdate as EventListener);
      console.log('🔇 [useDashboardMetrics] Listener para stockItemsUpdated removido');
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

// Hook para histórico de métricas (para gráficos)
export const useMetricHistory = (metricType: string, days: number = 30) => {
  return useQuery({
    queryKey: ['metric-history', metricType, days],
    queryFn: async (): Promise<MetricHistory[]> => {
      // Implementar query para buscar histórico
      // Mock data por enquanto
      const mockData: MetricHistory[] = []
      const today = new Date()
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        mockData.push({
          date: date.toISOString().split('T')[0],
          value: Math.random() * 10000 + 5000,
          metric_type: metricType
        })
      }
      
      return mockData
    },
  })
}

// Hook para métricas específicas com realtime
export const useRealtimeMetric = (metricName: string) => {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['metric', metricName],
    queryFn: async () => {
      // Implementar query específica para a métrica
      return Math.random() * 10000
    },
  })

  useEffect(() => {
    const channel = supabase
      .channel(`metric-${metricName}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public',
          table: 'metrics' // Ajuste conforme sua estrutura
        }, 
        () => {
          queryClient.invalidateQueries({ queryKey: ['metric', metricName] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [metricName, queryClient])

  return query
}
