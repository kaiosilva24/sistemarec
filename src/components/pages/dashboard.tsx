import React, { useState, useEffect, useMemo } from "react";
import TopNavigation from "../dashboard/layout/TopNavigation";
import Sidebar from "../dashboard/layout/Sidebar";
import DashboardGrid from "../dashboard/DashboardGrid";
import TaskBoard from "../dashboard/TaskBoard";
import FinancialDashboard from "../financial/FinancialDashboard";
import RegistrationDashboard from "../registration/RegistrationDashboard";
import StockDashboard from "../stock/StockDashboard";
import ProductionDashboard from "../production/ProductionDashboard";
import SalesDashboard from "../sales/SalesDashboard";
import DataDiagnostic from "../debug/DataDiagnostic";
import StockCharts from "../stock/StockCharts";
import ProductionChart from "../stock/ProductionChart";
import PresumedProfitChart from "../stock/PresumedProfitChart";
import { useDataPersistence } from '../../hooks/useDataPersistence';
import { supabase } from '../../../supabase/supabase';
import PresumedProfitManager from "../financial/PresumedProfitManager";
import ResaleProductProfitManager from "../financial/ResaleProductProfitManager";
import TireCostManager from "../financial/TireCostManager";
import FinalProductsStock from "../stock/FinalProductsStock";
import ResaleProductsStock from "../stock/ResaleProductsStock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  BarChart3,
  Factory,
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  Calculator,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { dataManager } from '../../utils/dataManager';
import { autoSetupSupabase } from '../../utils/setupSupabaseTable';
import { ensureSystemDataExists } from '../../utils/initializeSupabaseData';
import { checkpointManager } from '../../utils/checkpointManager';
import {
  useCashFlow,
  useDefectiveTireSales,
  useProductionEntries,
  useMaterials,
  useProducts,
  useStockItems,
  useFixedCosts,
  useVariableCosts,
  useEmployees,
  useRecipes,
  useCostCalculationOptions,
  useWarrantyEntries,
  useResaleProducts,
} from "@/hooks/useDataPersistence";
// Imports de drag-and-drop removidos - não são mais necessários

// Seção de Métricas Principais removida completamente conforme solicitado

// Main Dashboard Component with Financial Metrics
const MainDashboard = ({ isLoading = false }: { isLoading?: boolean }) => {
  // Load all necessary data using hooks
  const { cashFlowEntries, isLoading: cashFlowLoading } = useCashFlow();
  const { defectiveTireSales, isLoading: defectiveTireSalesLoading } =
    useDefectiveTireSales();
  const { productionEntries, isLoading: productionLoading } =
    useProductionEntries();
  const { materials, isLoading: materialsLoading } = useMaterials();
  const { products, isLoading: productsLoading } = useProducts();
  const { resaleProducts, isLoading: resaleProductsLoading } =
    useResaleProducts();
  const { stockItems, isLoading: stockItemsLoading } = useStockItems();
  const { fixedCosts, isLoading: fixedCostsLoading } = useFixedCosts();
  const { variableCosts, isLoading: variableCostsLoading } = useVariableCosts();
  const { employees, isLoading: employeesLoading } = useEmployees();
  const { recipes, isLoading: recipesLoading } = useRecipes();
  const { warrantyEntries, isLoading: warrantyEntriesLoading } =
    useWarrantyEntries();

  // Load cost calculation options from TireCostManager
  const {
    costOptions,
    isIncludingLaborCosts,
    isIncludingCashFlowExpenses,
    isIncludingProductionLosses,
    isIncludingDefectiveTireSales,
    isDividingByProduction,
  } = useCostCalculationOptions();

  // Estado para controlar inicialização dos gráficos
  const [chartsInitialized, setChartsInitialized] = useState(false);

  // Delay para inicialização dos gráficos (previne warnings do Recharts)
  useEffect(() => {
    const timer = setTimeout(() => {
      setChartsInitialized(true);
    }, 500); // 500ms delay para garantir que o DOM esteja pronto

    return () => clearTimeout(timer);
  }, []);

  const isDataLoading =
    isLoading ||
    cashFlowLoading ||
    defectiveTireSalesLoading ||
    productionLoading ||
    materialsLoading ||
    productsLoading ||
    resaleProductsLoading ||
    stockItemsLoading ||
    fixedCostsLoading ||
    variableCostsLoading ||
    employeesLoading ||
    recipesLoading ||
    warrantyEntriesLoading;

  // Combinar loading state com inicialização dos gráficos
  const isChartsLoading = isDataLoading || !chartsInitialized;

  // Estados de métricas principais removidos

  // Funções de configuração e drag-and-drop removidas

  // Lógica de sincronização das métricas removida

  // Cálculos de métricas - Saldo de Caixa
  const totalIncome = cashFlowEntries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpense = cashFlowEntries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const cashBalance = totalIncome - totalExpense;

  // Função para formatar valores em moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Cálculo da Receita Total (apenas vendas - igual ao dashboard de vendas)
  const totalRevenue = cashFlowEntries
    .filter((entry) => 
      entry.type === "income" && 
      entry.category === "venda"
    )
    .reduce((sum, entry) => sum + entry.amount, 0);

  // Contador de vendas
  const salesCount = cashFlowEntries.filter(entry => 
    entry.type === "income" && entry.category === "venda"
  ).length;

  // Cálculo do Saldo de Produtos de Revenda em Estoque
  const resaleProductStockValue = resaleProducts
    .reduce((total, product) => {
      // Tratar valores null/undefined adequadamente
      const stock = product.current_stock ?? 0;
      const price = product.purchase_price ?? 0;

      // Verificar se há estoque correspondente na tabela stock_items
      const stockItem = stockItems.find(item => 
        item.item_name === product.name || item.item_id === product.id
      );

      // Usar estoque da tabela stock_items se disponível
      const finalStock = stockItem ? (stockItem.quantity || 0) : stock;
      const finalPrice = price > 0 ? price : (stockItem?.unit_cost || 0);

      const stockValue = finalStock * finalPrice;

      return total + stockValue;
    }, 0);

  // Estado para custo médio por pneu
  const [averageTireCost, setAverageTireCost] = useState(101.09);
  const [isLoadingTireCost, setIsLoadingTireCost] = useState(true);

  // Debounce para evitar oscilações
  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(Date.now());
  const [pendingUpdate, setPendingUpdate] = useState<number | null>(null);

  // Estado para lucro médio por pneu
  const [averageTireProfit, setAverageTireProfit] = useState(0);
  const [isLoadingTireProfit, setIsLoadingTireProfit] = useState(true);

  // Estado para lucro médio dos produtos de revenda - inicializar com null para evitar oscilação
  const [averageResaleProfit, setAverageResaleProfit] = useState<number | null>(() => {
    // Tentar carregar valor inicial do localStorage imediatamente
    try {
      const localValue = localStorage.getItem('averageResaleProfit');
      if (localValue && localValue !== 'null' && localValue !== '0') {
        const parsed = parseFloat(localValue);
        if (!isNaN(parsed) && parsed > 0) {
          console.log(`⚡ [Dashboard] Valor inicial carregado do localStorage: R$ ${parsed.toFixed(2)}`);
          return parsed;
        }
      }
    } catch (error) {
      console.log('⚠️ [Dashboard] Erro ao carregar valor inicial do localStorage');
    }
    return null;
  });
  const [isLoadingResaleProfit, setIsLoadingResaleProfit] = useState(true);

  // Estado para saldo de produtos finais - sincronização em tempo real (apenas valor sincronizado)
  const [finalProductStockBalance, setFinalProductStockBalance] = useState<number | null>(null);
  const [isLoadingFinalProductStock, setIsLoadingFinalProductStock] = useState(true);

  // Estado para saldo de matéria-prima - sincronização em tempo real via Supabase
  const [rawMaterialStockBalance, setRawMaterialStockBalance] = useState<number | null>(null);
  const [isLoadingRawMaterialStock, setIsLoadingRawMaterialStock] = useState(true);

  // Estado para saldo de produtos de revenda - sincronização em tempo real
  const [resaleProductStockBalance, setResaleProductStockBalance] = useState<number | null>(null);
  const [isLoadingResaleProductStock, setIsLoadingResaleProductStock] = useState(true);

  // Estado para saldo de caixa - sincronização em tempo real via Supabase
  const [cashBalanceState, setCashBalanceState] = useState<number | null>(null);
  const [isLoadingCashBalance, setIsLoadingCashBalance] = useState(true);

  // Estado para quantidade unitária de matéria-prima - sincronização em tempo real
  const [rawMaterialUnitaryQuantity, setRawMaterialUnitaryQuantity] = useState(0);
  const [isLoadingRawMaterialUnitaryQuantity, setIsLoadingRawMaterialUnitaryQuantity] = useState(true);

  // Estado para Quantidade Total de Produtos Finais - sincronização em tempo real
  const [finalProductTotalQuantity, setFinalProductTotalQuantity] = useState<number | null>(null);
  const [isLoadingFinalProductTotalQuantity, setIsLoadingFinalProductTotalQuantity] = useState(true);


  // Estados para o sistema de checkpoint
  const [isCreatingCheckpoint, setIsCreatingCheckpoint] = useState(false);
  const [checkpointStatus, setCheckpointStatus] = useState<string | null>(null);

  // Função de debounce para evitar oscilações
  const updateResaleProfitWithDebounce = (newProfit: number, source: string) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimestamp;

    console.log(`🔄 [Dashboard] Tentativa de atualização de ${source}: R$ ${newProfit.toFixed(2)}`);
    console.log(`🕰️ [Dashboard] Tempo desde última atualização: ${timeSinceLastUpdate}ms`);

    // Se já há uma atualização pendente com o mesmo valor, ignorar
    if (pendingUpdate !== null && Math.abs(pendingUpdate - newProfit) < 0.01) {
      console.log(`⚠️ [Dashboard] Atualização ignorada - valor já pendente: R$ ${pendingUpdate.toFixed(2)}`);
      return;
    }

    // Se o valor atual já é o mesmo, ignorar
    if (averageResaleProfit !== null && Math.abs(averageResaleProfit - newProfit) < 0.01) {
      console.log(`✅ [Dashboard] Valor já atualizado: R$ ${averageResaleProfit.toFixed(2)}`);
      return;
    }

    // Rejeitar atualizações para R$ 0.00 quando há um valor válido anterior
    if (newProfit === 0 && averageResaleProfit !== null && averageResaleProfit > 0) {
      console.log(`⛔ [Dashboard] Rejeitando atualização para R$ 0.00 de ${source} - mantendo valor atual: R$ ${averageResaleProfit.toFixed(2)}`);
      return;
    }

    // Debounce de 300ms para evitar múltiplas atualizações
    if (timeSinceLastUpdate < 300) {
      console.log(`🔄 [Dashboard] Debounce ativo - agendando atualização em 300ms`);
      setPendingUpdate(newProfit);

      setTimeout(() => {
        console.log(`⏰ [Dashboard] Executando atualização agendada: R$ ${newProfit.toFixed(2)}`);
        setAverageResaleProfit(newProfit);
        setIsLoadingResaleProfit(false);
        setLastUpdateTimestamp(Date.now());
        setPendingUpdate(null);
      }, 300);
    } else {
      console.log(`⚡ [Dashboard] Atualização imediata: R$ ${newProfit.toFixed(2)}`);
      setAverageResaleProfit(newProfit);
      setIsLoadingResaleProfit(false);
      setLastUpdateTimestamp(now);
      setPendingUpdate(null);
    }
  };

  // Função para calcular lucro de revenda diretamente
  const calculateResaleProfitDirectly = async () => {
    try {
      console.log('📊 [Dashboard] Calculando lucro de revenda diretamente...');
      console.log(`📊 [Dashboard] Total de entradas no cashFlow: ${cashFlowEntries.length}`);

      // Filtrar vendas de produtos de revenda dos últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Debug: Mostrar as últimas 5 entradas
      const recentEntries = cashFlowEntries
        .filter(entry => entry.type === 'income' && entry.category === 'venda')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);

      console.log('🔍 [Dashboard] Últimas 5 vendas:');
      recentEntries.forEach((entry, index) => {
        console.log(`  ${index + 1}. ${entry.description?.substring(0, 80)}...`);
      });

      const resaleSales = cashFlowEntries.filter(entry => {
        if (entry.type !== 'income' || entry.category !== 'venda') return false;

        const entryDate = new Date(entry.created_at);
        if (entryDate < thirtyDaysAgo) return false;

        // Verificar se é produto de revenda (múltiplas formas)
        const description = entry.description || '';
        const isResale = description.includes('TIPO_PRODUTO: revenda') || 
                        description.includes('tipo_produto: revenda') ||
                        description.includes('revenda') ||
                        description.includes('REVENDA');

        console.log(`🔍 [Dashboard] Verificando entrada: ${description.substring(0, 50)}... | É revenda: ${isResale}`);

        return isResale;
      });

      console.log(`📊 [Dashboard] Vendas de revenda encontradas: ${resaleSales.length}`);

      if (resaleSales.length === 0) {
        console.log('⚠️ [Dashboard] Nenhuma venda de revenda encontrada');

        // Se cashFlowEntries está vazio, o problema é no carregamento dos dados
        if (cashFlowEntries.length === 0) {
          console.log('❌ [Dashboard] PROBLEMA: cashFlowEntries está vazio - hook useCashFlow() não está funcionando');
          return;
        }

        console.log('🔍 [Dashboard] cashFlowEntries tem dados, mas nenhuma venda de revenda encontrada');
        return;
      }

      let totalProfit = 0;
      let totalQuantity = 0;

      resaleSales.forEach(sale => {
        // Extrair informações do produto da descrição
        const productMatch = sale.description?.match(/Produto: ([^|]+)/);
        const quantityMatch = sale.description?.match(/Quantidade: (\d+)/);

        if (productMatch && quantityMatch) {
          const productName = productMatch[1].trim();
          const quantity = parseInt(quantityMatch[1]);

          // Buscar custo do produto no estoque
          const stockItem = stockItems.find(item => 
            item.item_name === productName && item.item_type === 'product'
          );

          if (stockItem) {
            const unitCost = stockItem.unit_cost || 0;
            const revenue = sale.amount;
            const totalCost = unitCost * quantity;
            const profit = revenue - totalCost;

            totalProfit += profit;
            totalQuantity += quantity;

            console.log(`💰 [Dashboard] Produto: ${productName}, Qtd: ${quantity}, Lucro: R$ ${profit.toFixed(2)}`);
          }
        }
      });

      const averageProfit = totalQuantity > 0 ? totalProfit / totalQuantity : 0;

      console.log(`📊 [Dashboard] Lucro médio calculado diretamente: R$ ${averageProfit.toFixed(2)}`);

      // Salvar no Supabase e localStorage
      const success = await dataManager.saveAverageResaleProfit(averageProfit);
      if (success) {
        console.log(`✅ [Dashboard] Lucro de revenda salvo com sucesso: R$ ${averageProfit.toFixed(2)}`);

        // Disparar evento de atualização
        const updateEvent = new CustomEvent('resaleProfitUpdated', {
          detail: {
            profit: averageProfit,
            timestamp: Date.now(),
            source: 'Dashboard-DirectCalculation'
          }
        });
        window.dispatchEvent(updateEvent);
      }
    } catch (error) {
      console.error('❌ [Dashboard] Erro ao calcular lucro de revenda diretamente:', error);
    }
  };

  // Verificação automática da tabela system_settings no Supabase
  useEffect(() => {
    const checkSupabaseSetup = async () => {
      try {
        console.log('🔍 [Dashboard] Verificando configuração do Supabase...');
        await autoSetupSupabase();

        // Inicializar dados essenciais após verificar a configuração
        console.log('🚀 [Dashboard] Inicializando dados essenciais do sistema...');
        await ensureSystemDataExists();

      } catch (error) {
        console.warn('⚠️ [Dashboard] Erro na verificação do Supabase:', error);
      }
    };

    checkSupabaseSetup();
  }, []);

  // Effect para sincronização em tempo real do custo médio por pneu
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeTireCostSync = async () => {
      try {
        console.log('🔄 [Dashboard] Inicializando sincronização em tempo real do custo médio por pneu...');

        // Carregar valor inicial do Supabase
        const initialCost = await dataManager.loadAverageTireCost();

        // Se o Supabase retornar o valor padrão (101.09), tentar localStorage
        let finalCost = initialCost;
        console.log(`🔍 [Dashboard] Valor inicial do Supabase: R$ ${initialCost.toFixed(2)}`);

        // Usar Math.abs para comparação de float mais robusta
        if (Math.abs(initialCost - 101.09) < 0.01) {
          console.log('⚠️ [Dashboard] Valor padrão detectado, tentando localStorage...');
          const localStorageCost = getTireCostFromLocalStorage();
          console.log(`🔍 [Dashboard] Valor do localStorage: R$ ${localStorageCost.toFixed(2)}`);

          if (Math.abs(localStorageCost - 101.09) >= 0.01) {
            finalCost = localStorageCost;
            console.log(`✅ [Dashboard] Valor do localStorage usado: R$ ${finalCost.toFixed(2)}`);
          } else {
            console.log('⚠️ [Dashboard] localStorage também tem valor padrão, mantendo Supabase');
          }
        } else {
          console.log('✅ [Dashboard] Valor do Supabase não é padrão, usando diretamente');
        }

        setAverageTireCost(finalCost);
        setIsLoadingTireCost(false);

        console.log(`✅ [Dashboard] Custo inicial carregado: R$ ${finalCost.toFixed(2)}`);

        // Configurar subscription em tempo real
        unsubscribe = dataManager.subscribeToTireCostChanges((newCost) => {
          console.log(`🔄 [Dashboard] Novo custo recebido via Supabase Realtime: R$ ${newCost.toFixed(2)}`);
          setAverageTireCost(newCost);
        });

        console.log('🔔 [Dashboard] Subscription ativa para mudanças em tempo real');

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar sincronização:', error);
        setIsLoadingTireCost(false);

        // Fallback para localStorage em caso de erro
        const fallbackCost = getTireCostFromLocalStorage();
        setAverageTireCost(fallbackCost);
      }
    };

    initializeTireCostSync();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        console.log('🔕 [Dashboard] Cancelando subscription do custo médio por pneu');
        unsubscribe();
      }
    };
  }, []);

  // Effect para sincronização em tempo real do lucro médio por pneu
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeTireProfitSync = async () => {
      try {
        console.log('🔄 [Dashboard] Inicializando sincronização em tempo real do lucro médio por pneu...');

        // Carregar valor inicial do Supabase
        const initialProfit = await dataManager.loadAverageTireProfit();
        console.log(`🔍 [Dashboard] Valor inicial do lucro do Supabase: R$ ${initialProfit.toFixed(2)}`);

        // Usar valor do Supabase exclusivamente
        console.log(`🎯 [Dashboard] Valor final escolhido: R$ ${initialProfit.toFixed(2)}`);

        setAverageTireProfit(initialProfit);
        setIsLoadingTireProfit(false);

        console.log(`✅ [Dashboard] Lucro inicial carregado: R$ ${initialProfit.toFixed(2)}`);

        // Configurar subscription em tempo real
        unsubscribe = dataManager.subscribeToTireProfitChanges((newProfit) => {
          console.log(`📡 [Dashboard] Novo lucro por pneu recebido via subscription: R$ ${newProfit.toFixed(2)}`);
          setAverageTireProfit(newProfit);
        });

        console.log('🔔 [Dashboard] Subscription ativa para mudanças de lucro em tempo real');

        // Forçar recálculo após 1 segundo para garantir sincronização
        setTimeout(() => {
          console.log('🎯 [Dashboard] Disparando recálculo forçado do lucro médio por pneu');
          const forceRecalcEvent = new CustomEvent('forceTireProfitRecalc');
          window.dispatchEvent(forceRecalcEvent);

          console.log('🎯 [Dashboard] Disparando recálculo forçado do lucro produtos revenda');
          const forceResaleRecalcEvent = new CustomEvent('forceResaleProfitRecalc');
          window.dispatchEvent(forceResaleRecalcEvent);

          console.log('🔄 [Dashboard] Eventos de recálculo disparados para produtos finais e revenda');
        }, 1000);

        // Listener para evento de nova entrada de cash flow
        const handleCashFlowEntryAdded = (event: CustomEvent) => {
          console.log('💰 [Dashboard] Evento cashFlowEntryAdded recebido:', event.detail);
          console.log('🔍 [Dashboard] Tipo de entrada:', event.detail?.type);
          console.log('🔍 [Dashboard] Categoria:', event.detail?.category);
          console.log('🔍 [Dashboard] Valor:', event.detail?.amount);

          // Forçar recálculo imediato
          setTimeout(() => {
            console.log('🔄 [Dashboard] Forçando recálculo após nova entrada de cash flow');

            const forceRecalcEvent = new CustomEvent('forceTireProfitRecalc');
            window.dispatchEvent(forceRecalcEvent);

            const forceResaleRecalcEvent = new CustomEvent('forceResaleProfitRecalc');
            window.dispatchEvent(forceResaleRecalcEvent);

            console.log('✅ [Dashboard] Eventos de recálculo disparados via cashFlowEntryAdded');
          }, 100); // Recálculo mais rápido para nova entrada

          // Forçar recálculo adicional para garantir
          setTimeout(() => {
            console.log('🔄 [Dashboard] Segundo recálculo forçado via cashFlowEntryAdded');
            const forceResaleRecalcEvent2 = new CustomEvent('forceResaleProfitRecalc');
            window.dispatchEvent(forceResaleRecalcEvent2);
          }, 500);
        };

        window.addEventListener('cashFlowEntryAdded', handleCashFlowEntryAdded as EventListener);

        // Listener direto do Supabase Realtime para cash_flow_entries
        const cashFlowChannel = supabase
          .channel('cash_flow_realtime')
          .on(
            'postgres_changes',
            {
              event: '*', // INSERT, UPDATE, DELETE
              schema: 'public',
              table: 'cash_flow_entries'
            },
            (payload) => {
              console.log('💰 [Dashboard] Mudança detectada na tabela cash_flow_entries:', payload);
              console.log('🔍 [Dashboard] Tipo de evento:', payload.eventType);
              console.log('🔍 [Dashboard] Dados da mudança:', payload.new || payload.old);

              // Forçar recálculo imediato quando há mudanças no cash flow
              setTimeout(async () => {
                console.log('🔄 [Dashboard] Forçando recálculo após mudança no cash flow (Supabase Realtime)');

                const forceRecalcEvent = new CustomEvent('forceTireProfitRecalc');
                window.dispatchEvent(forceRecalcEvent);

                // Calcular lucro de revenda diretamente
                await calculateResaleProfitDirectly();

                console.log('✅ [Dashboard] Eventos de recálculo disparados');
              }, 200); // Recálculo rápido para mudanças em tempo real

              // Forçar recálculo adicional para garantir
              setTimeout(() => {
                console.log('🔄 [Dashboard] Segundo recálculo forçado para garantir sincronização');
                const forceResaleRecalcEvent2 = new CustomEvent('forceResaleProfitRecalc');
                window.dispatchEvent(forceResaleRecalcEvent2);
              }, 1000);
            }
          )
          .subscribe();

        // Cleanup dos listeners
        return () => {
          window.removeEventListener('cashFlowEntryAdded', handleCashFlowEntryAdded as EventListener);
          supabase.removeChannel(cashFlowChannel);
        };

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar sincronização do lucro:', error);
        setIsLoadingTireProfit(false);

        // Fallback para localStorage em caso de erro
        const fallbackProfit = getTireProfitFromLocalStorage();
        setAverageTireProfit(fallbackProfit);
      }
    };

    initializeTireProfitSync();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        console.log('🔕 [Dashboard] Cancelando subscription do lucro médio por pneu');
        unsubscribe();
      }
    };
  }, []);

  // Effect para sincronização em tempo real do saldo de produtos finais
  useEffect(() => {
    console.log('🚀 [Dashboard] useEffect de saldo de produtos finais INICIADO!');
    let unsubscribe: (() => void) | null = null;

    const initializeFinalProductStockSync = async () => {
      try {
        console.log('🔄 [Dashboard] Inicializando sincronização em tempo real do saldo de produtos finais...');

        // Carregar valor inicial do Supabase
        const initialBalance = await dataManager.loadFinalProductStockBalance();
        console.log(`🔍 [Dashboard] Valor inicial do saldo do Supabase: R$ ${initialBalance.toFixed(2)}`);

        // Usar valor do Supabase exclusivamente
        console.log(`🎯 [Dashboard] Valor final escolhido: R$ ${initialBalance.toFixed(2)}`);

        setFinalProductStockBalance(initialBalance);
        setIsLoadingFinalProductStock(false);

        console.log(`✅ [Dashboard] Saldo inicial carregado: R$ ${initialBalance.toFixed(2)}`);

        // Configurar subscription em tempo real
        unsubscribe = dataManager.subscribeToFinalProductStockChanges((newBalance) => {
          console.log(`📡 [Dashboard] Novo saldo de produtos finais recebido via subscription: R$ ${newBalance.toFixed(2)}`);
          setFinalProductStockBalance(newBalance);
        });

        console.log('🔔 [Dashboard] Subscription ativa para mudanças de saldo em tempo real');

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar sincronização do saldo:', error);
        setIsLoadingFinalProductStock(false);

        // Fallback para valor 0 em caso de erro
        setFinalProductStockBalance(0);
      }
    };

    initializeFinalProductStockSync();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        console.log('🔕 [Dashboard] Cancelando subscription do saldo de produtos finais');
        unsubscribe();
      }
    };
  }, []);

  // Listener para evento customizado de atualização do lucro médio por pneu
  useEffect(() => {
    const handleTireProfitUpdate = (event: CustomEvent) => {
      const { profit, timestamp, source } = event.detail;
      console.log(`🔄 [Dashboard] Evento customizado recebido:`, {
        profit: `R$ ${profit.toFixed(2)}`,
        timestamp: new Date(timestamp).toLocaleTimeString('pt-BR'),
        source: source || 'unknown'
      });
      setAverageTireProfit(profit);
    };

    // Adicionar listener para o evento customizado
    window.addEventListener('tireProfitUpdated', handleTireProfitUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('tireProfitUpdated', handleTireProfitUpdate as EventListener);
    };
  }, []);

  // Listener para evento customizado de atualização do saldo de produtos finais
  useEffect(() => {
    const handleFinalProductStockUpdate = (event: CustomEvent) => {
      const { balance, timestamp, source } = event.detail;
      console.log(`🔄 [Dashboard] Evento customizado de saldo recebido:`, {
        balance: `R$ ${balance.toFixed(2)}`,
        timestamp: new Date(timestamp).toLocaleTimeString('pt-BR'),
        source: source || 'unknown'
      });
      setFinalProductStockBalance(balance);
      setIsLoadingFinalProductStock(false);
    };

    // Adicionar listener para o evento customizado
    window.addEventListener('finalProductStockUpdated', handleFinalProductStockUpdate as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('finalProductStockUpdated', handleFinalProductStockUpdate as EventListener);
    };
  }, []);

  // Criar hash dos cashFlowEntries para detectar mudanças mais precisamente
  const cashFlowHash = useMemo(() => {
    return JSON.stringify(cashFlowEntries.map(entry => ({
      id: entry.id,
      amount: entry.amount,
      type: entry.type,
      category: entry.category,
      transaction_date: entry.transaction_date
    })));
  }, [cashFlowEntries]);

  // Monitorar mudanças no cashFlowEntries e disparar recálculo forçado
  useEffect(() => {
    // Aguardar um pouco após mudanças no cashFlow para garantir que os dados foram atualizados
    const timeoutId = setTimeout(() => {
      console.log('🔄 [Dashboard] Mudanças detectadas no cashFlowEntries:', {
        totalEntries: cashFlowEntries.length,
        hashLength: cashFlowHash.length,
        timestamp: new Date().toISOString()
      });
      console.log('🔄 [Dashboard] Disparando recálculo forçado do lucro');

      // Disparar recálculo para produtos finais
      const forceRecalcEvent = new CustomEvent('forceTireProfitRecalc');
      window.dispatchEvent(forceRecalcEvent);

      // Disparar recálculo para produtos de revenda
      const forceResaleRecalcEvent = new CustomEvent('forceResaleProfitRecalc');
      window.dispatchEvent(forceResaleRecalcEvent);

      console.log('🔄 [Dashboard] Eventos de recálculo disparados para produtos finais e revenda');
    }, 500); // Aguardar 500ms para garantir que os dados foram processados

    return () => {
      clearTimeout(timeoutId);
    };
  }, [cashFlowHash]); // Monitorar mudanças no hash das entradas

  // Monitorar mudanças no stockItems apenas para logs (cálculo real feito pelo FinalProductsStock)
  useEffect(() => {
    if (!stockItemsLoading && stockItems.length >= 0) {
      const timeoutId = setTimeout(() => {
        console.log('📊 [Dashboard] Monitorando stockItems para sincronização...');
        console.log(`📦 [Dashboard] Total de stockItems: ${stockItems.length}`);

        // Filtrar apenas produtos finais para logs
        const productItems = stockItems.filter(item => item.item_type === 'product');
        console.log(`📦 [Dashboard] Produtos finais encontrados: ${productItems.length}`);

        // Calcular valor simples apenas para comparação nos logs
        const simpleCalculation = productItems.reduce((total, item) => {
          const itemValue = item.total_value || (item.quantity * item.unit_cost) || 0;
          return total + itemValue;
        }, 0);

        // Apenas log de comparação - não salvar nem atualizar estado
        if (finalProductStockBalance > 0 && Math.abs(finalProductStockBalance - simpleCalculation) > 0.01) {
          console.log(`⚠️ [Dashboard] Diferença detectada entre cálculo local e sincronizado:`);
          console.log(`  - Cálculo local: R$ ${simpleCalculation.toFixed(2)}`);
          console.log(`  - Estado sincronizado: R$ ${finalProductStockBalance.toFixed(2)}`);
          console.log(`  - Diferença: R$ ${Math.abs(finalProductStockBalance - simpleCalculation).toFixed(2)}`);
          console.log(`  - Produtos finais encontrados: ${productItems.length}`);
          console.log(`  - FinalProductsStock fará o cálculo correto automaticamente`);
        }
      }, 300);

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [stockItems, stockItemsLoading, finalProductStockBalance]);

  // Função de fallback para localStorage do lucro (compatibilidade)
  const getTireProfitFromLocalStorage = () => {
    // Tentar múltiplas chaves para compatibilidade
    const TIRE_PROFIT_KEYS = [
      "dashboard_averageProfitPerTire", // Chave atual do PresumedProfitManager
      "dashboard_tireProfitValue_unified", // Chave legada
      "presumedProfitManager_synchronizedProfitData" // Chave alternativa
    ];

    for (const key of TIRE_PROFIT_KEYS) {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const value = parsedData.value || parsedData.averageProfitPerTire || 0;
          const timestamp = parsedData.timestamp || 0;
          const isRecent = Date.now() - timestamp < 300000; // 5 minutos (mais tolerante)

          if (value > 0 && isRecent) {
            console.log(`✅ [Dashboard] Lucro encontrado na chave '${key}': R$ ${value.toFixed(2)}`);
            return value;
          }
        }
      } catch (error) {
        console.warn(`⚠️ [Dashboard] Erro ao ler chave de lucro '${key}':`, error);
        continue;
      }
    }

    console.warn('⚠️ [Dashboard] Nenhum valor válido de lucro encontrado no localStorage, usando padrão');
    return 0; // Valor padrão para lucro
  };

  // Função de fallback para localStorage (compatibilidade)
  const getTireCostFromLocalStorage = () => {
    // Tentar múltiplas chaves para compatibilidade
    const TIRE_COST_KEYS = [
      "dashboard_averageCostPerTire", // Chave atual do TireCostManager
      "dashboard_tireCostValue_unified", // Chave legada
      "tireCostManager_synchronizedCostData" // Chave alternativa
    ];

    for (const key of TIRE_COST_KEYS) {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          const value = parsedData.value || parsedData.averageCostPerTire || 0;
          const timestamp = parsedData.timestamp || 0;
          const isRecent = Date.now() - timestamp < 300000; // 5 minutos (mais tolerante)

          if (value > 0 && isRecent) {
            console.log(`✅ [Dashboard] Valor encontrado na chave '${key}': R$ ${value.toFixed(2)}`);
            return value;
          }
        }
      } catch (error) {
        console.warn(`⚠️ [Dashboard] Erro ao ler chave '${key}':`, error);
        continue;
      }
    }

    console.warn('⚠️ [Dashboard] Nenhum valor válido encontrado no localStorage, usando padrão');
    return 101.09; // Valor padrão
  };

  // Effect para sincronização em tempo real do lucro médio dos produtos de revenda
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeResaleProfitSync = async () => {
      try {
        console.log('🚀 [Dashboard] Inicializando sincronização do lucro médio dos produtos de revenda...');

        // Verificar se já temos um valor inicial carregado
        if (averageResaleProfit !== null) {
          console.log(`📊 [Dashboard] Valor já carregado na inicialização: R$ ${averageResaleProfit.toFixed(2)}`);
          setIsLoadingResaleProfit(false);
        } else {
          // Tentar carregar do localStorage se ainda não temos valor
          try {
            const localValue = localStorage.getItem('averageResaleProfit');
            if (localValue && localValue !== 'null' && localValue !== '0') {
              const parsed = parseFloat(localValue);
              if (!isNaN(parsed) && parsed > 0) {
                console.log(`⚡ [Dashboard] Valor carregado do localStorage na inicialização: R$ ${parsed.toFixed(2)}`);
                setAverageResaleProfit(parsed);
                setIsLoadingResaleProfit(false);
              }
            }
          } catch (localError) {
            console.log('⚠️ [Dashboard] Erro ao carregar do localStorage, continuando com Supabase');
          }
        }

        // Carregar valor definitivo do Supabase
        const supabaseProfit = await dataManager.loadAverageResaleProfit();
        console.log(`📊 [Dashboard] Lucro médio carregado do Supabase: R$ ${supabaseProfit.toFixed(2)}`);

        // Usar valor do Supabase como definitivo
        console.log(`🎯 [Dashboard] Valor final escolhido: R$ ${supabaseProfit.toFixed(2)}`);

        setAverageResaleProfit(supabaseProfit);
        setIsLoadingResaleProfit(false);

        // Forçar disparo de evento para garantir que o ResaleProductProfitManager recalcule
        setTimeout(() => {
          console.log('🔄 [Dashboard] Forçando recalculo do ResaleProductProfitManager...');
          const forceUpdateEvent = new CustomEvent('forceResaleProfitRecalc', {
            detail: { timestamp: Date.now() }
          });
          window.dispatchEvent(forceUpdateEvent);
        }, 1000);

        // Configurar subscription em tempo real
        unsubscribe = dataManager.subscribeToResaleProfitChanges((newProfit) => {
          updateResaleProfitWithDebounce(newProfit, 'Supabase Realtime');
        });

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar sincronização do lucro de revenda:', error);
        setIsLoadingResaleProfit(false);

        // Usar valor padrão em caso de erro
        console.log('🔄 [Dashboard] Usando valor padrão: R$ 23.61');
        setAverageResaleProfit(23.61);
        setIsLoadingResaleProfit(false);
      }
    };

    initializeResaleProfitSync();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        console.log('🔕 [Dashboard] Cancelando subscription do lucro médio de revenda');
        unsubscribe();
      }
    };
  }, [averageResaleProfit]);

  // Effect para sincronização em tempo real do saldo de produtos finais
  useEffect(() => {
    const initializeFinalProductStockSync = async () => {
      try {
        console.log('🚀 [Dashboard] Inicializando sincronização do saldo de produtos finais...');

        // Carregar valor do Supabase
        const supabaseBalance = await dataManager.loadFinalProductStockBalance();
        console.log(`💰 [Dashboard] Saldo carregado do Supabase: R$ ${supabaseBalance.toFixed(2)}`);

        // Usar valor do Supabase como inicial
        setFinalProductStockBalance(supabaseBalance);
        setIsLoadingFinalProductStock(false);

        console.log(`🎯 [Dashboard] Saldo inicial definido: R$ ${supabaseBalance.toFixed(2)}`);
      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar saldo de produtos finais:', error);
        setIsLoadingFinalProductStock(false);
      }
    };

    initializeFinalProductStockSync();
  }, []);

  // Effect para sincronização em tempo real do saldo de matéria-prima
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeRawMaterialStockSync = async () => {
      try {
        console.log('🚀 [Dashboard] Inicializando sincronização do saldo de matéria-prima...');

        // Carregar valor inicial do Supabase
        const initialBalance = await dataManager.loadRawMaterialStockBalance();
        console.log(`🔍 [Dashboard] Valor inicial do saldo do Supabase: R$ ${initialBalance.toFixed(2)}`);

        // Se valor for 0, calcular baseado nos stockItems
        if (initialBalance === 0 && stockItems.length > 0) {
          const calculatedBalance = stockItems
            .filter(item => item.item_type === 'material')
            .reduce((total, item) => total + (item.total_value || 0), 0);

          if (calculatedBalance > 0) {
            console.log(`📊 [Dashboard] Calculando saldo inicial: R$ ${calculatedBalance.toFixed(2)}`);
            await dataManager.saveRawMaterialStockBalance(calculatedBalance);
            setRawMaterialStockBalance(calculatedBalance);
          } else {
            setRawMaterialStockBalance(initialBalance);
          }
        } else {
          setRawMaterialStockBalance(initialBalance);
        }

        setIsLoadingRawMaterialStock(false);

        console.log(`✅ [Dashboard] Saldo de matéria-prima inicial carregado: R$ ${(rawMaterialStockBalance || initialBalance).toFixed(2)}`);

        // Configurar subscription em tempo real
        unsubscribe = dataManager.subscribeToRawMaterialStockChanges((newBalance) => {
          console.log(`📡 [Dashboard] Novo saldo de matéria-prima recebido via subscription: R$ ${newBalance.toFixed(2)}`);
          setRawMaterialStockBalance(newBalance);
        });

        console.log('🔔 [Dashboard] Subscription ativa para mudanças de saldo de matéria-prima em tempo real');

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar sincronização do saldo de matéria-prima:', error);
        setIsLoadingRawMaterialStock(false);

        // Fallback para cálculo local em caso de erro
        const fallbackBalance = stockItems
          .filter(item => item.item_type === 'material')
          .reduce((total, item) => total + (item.total_value || 0), 0);
        setRawMaterialStockBalance(fallbackBalance);
      }
    };

    initializeRawMaterialStockSync();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        console.log('🔕 [Dashboard] Cancelando subscription do saldo de matéria-prima');
        unsubscribe();
      }
    };
  }, [stockItems, stockItemsLoading]);

  // Listener para evento customizado de atualização do lucro médio dos produtos de revenda
  useEffect(() => {
    const handleResaleProfitUpdate = (event: CustomEvent) => {
      const { profit, timestamp, source } = event.detail;
      console.log(`📡 [Dashboard] Evento 'resaleProfitUpdated' recebido:`);
      console.log(`  - Lucro: R$ ${profit.toFixed(2)}`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);

      // Usar função de debounce para evitar oscilações
      updateResaleProfitWithDebounce(profit, source || 'Custom Event');
    };

    console.log('🎯 [Dashboard] Registrando listener para evento resaleProfitUpdated');

    // Adicionar listener para o evento customizado
    window.addEventListener('resaleProfitUpdated', handleResaleProfitUpdate as EventListener);

    // Cleanup
    return () => {
      console.log('🚫 [Dashboard] Removendo listener para evento resaleProfitUpdated');
      window.removeEventListener('resaleProfitUpdated', handleResaleProfitUpdate as EventListener);
    };
  }, []);

  // Listener para evento customizado de atualização do saldo de produtos finais
  useEffect(() => {
    const handleFinalProductStockUpdate = (event: CustomEvent) => {
      const { balance, timestamp, source } = event.detail;
      console.log(`💰 [Dashboard] Evento 'finalProductStockUpdated' recebido:`);
      console.log(`  - Saldo: R$ ${balance.toFixed(2)}`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);

      // Atualizar estado imediatamente (sem debounce pois é calculado)
      setFinalProductStockBalance(balance);
      setIsLoadingFinalProductStock(false);
    };

    console.log('🎯 [Dashboard] Registrando listener para evento finalProductStockUpdated');

    // Adicionar listener para o evento customizado
    window.addEventListener('finalProductStockUpdated', handleFinalProductStockUpdate as EventListener);

    // Cleanup
    return () => {
      console.log('🚫 [Dashboard] Removendo listener para evento finalProductStockUpdated');
      window.removeEventListener('finalProductStockUpdated', handleFinalProductStockUpdate as EventListener);
    };
  }, []);

  // Inicialização e sincronização do saldo de produtos finais
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeFinalProductStockSync = async () => {
      try {
        console.log('🚀 [Dashboard] Inicializando sincronização do saldo de produtos finais...');

        // Carregar valor inicial do Supabase
        const initialBalance = await dataManager.loadFinalProductStockBalance();
        console.log(`📊 [Dashboard] Valor inicial do saldo de produtos finais: R$ ${initialBalance.toFixed(2)}`);

        setFinalProductStockBalance(initialBalance);
        setIsLoadingFinalProductStock(false);

        // Configurar subscription em tempo real para mudanças no Supabase
        unsubscribe = dataManager.subscribeToFinalProductStockChanges((newBalance) => {
          console.log(`📡 [Dashboard] Novo saldo de produtos finais recebido via Supabase: R$ ${newBalance.toFixed(2)}`);
          setFinalProductStockBalance(newBalance);
        });

        console.log('🔔 [Dashboard] Subscription ativa para mudanças no saldo de produtos finais');

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar sincronização do saldo de produtos finais:', error);
        setIsLoadingFinalProductStock(false);

        // Fallback para localStorage em caso de erro
        try {
          const localValue = localStorage.getItem('finalProductStockBalance');
          if (localValue) {
            const parsed = JSON.parse(localValue);
            if (parsed.value && typeof parsed.value === 'number') {
              console.log(`🔄 [Dashboard] Usando valor do localStorage: R$ ${parsed.value.toFixed(2)}`);
              setFinalProductStockBalance(parsed.value);
            }
          }
        } catch (localError) {
          console.error('❌ [Dashboard] Erro ao carregar do localStorage:', localError);
        }
      }
    };

    initializeFinalProductStockSync();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        console.log('🔕 [Dashboard] Cancelando subscription do saldo de produtos finais');
        unsubscribe();
      }
    };
  }, []);

  // Effect para sincronização em tempo real da quantidade unitária de matéria-prima
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeRawMaterialUnitaryQuantitySync = async () => {
      try {
        console.log('🔄 [Dashboard] Inicializando sincronização da quantidade unitária de matéria-prima...');

        // Carregar valor inicial do Supabase
        const initialQuantity = await dataManager.loadRawMaterialUnitaryQuantity();
        console.log(`📦 [Dashboard] Valor inicial da quantidade unitária: ${initialQuantity}`);

        setRawMaterialUnitaryQuantity(initialQuantity);
        setIsLoadingRawMaterialUnitaryQuantity(false);

        // Configurar subscription em tempo real
        unsubscribe = dataManager.subscribeToRawMaterialUnitaryQuantityChanges((newQuantity) => {
          console.log(`📡 [Dashboard] Nova quantidade unitária recebida via subscription: ${newQuantity}`);
          setRawMaterialUnitaryQuantity(newQuantity);
        });

        console.log('🔔 [Dashboard] Subscription ativa para quantidade unitária de matéria-prima');

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar sincronização da quantidade unitária:', error);
        setIsLoadingRawMaterialUnitaryQuantity(false);
      }
    };

    initializeRawMaterialUnitaryQuantitySync();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        console.log('🔕 [Dashboard] Cancelando subscription da quantidade unitária de matéria-prima');
        unsubscribe();
      }
    };
  }, []);

  // Listener para evento customizado de atualização do saldo de matéria-prima
  useEffect(() => {
    const handleRawMaterialStockUpdate = (event: CustomEvent) => {
      const { balance, timestamp, source } = event.detail;
      console.log(`🏥 [Dashboard] Evento 'rawMaterialBalanceUpdated' recebido:`);
      console.log(`  - Saldo: R$ ${balance.toFixed(2)}`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);

      // Atualizar estado imediatamente
      setRawMaterialStockBalance(balance);
      setIsLoadingRawMaterialStock(false);
    };

    const handleRawMaterialUnitaryQuantityUpdate = (event: CustomEvent) => {
      const { quantity, timestamp, source } = event.detail;
      console.log(`📦 [Dashboard] Evento 'rawMaterialUnitaryQuantityUpdated' recebido:`);
      console.log(`  - Quantidade Unitária: ${quantity}`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);

      // Atualizar estado imediatamente
      setRawMaterialUnitaryQuantity(quantity);
      setIsLoadingRawMaterialUnitaryQuantity(false);
    };

    console.log('🎯 [Dashboard] Registrando listeners para eventos de matéria-prima');

    // Adicionar listeners para os eventos customizados
    window.addEventListener('rawMaterialBalanceUpdated', handleRawMaterialStockUpdate as EventListener);
    window.addEventListener('rawMaterialUnitaryQuantityUpdated', handleRawMaterialUnitaryQuantityUpdate as EventListener);

    // Cleanup
    return () => {
      console.log('🚫 [Dashboard] Removendo listeners para eventos de matéria-prima');
      window.removeEventListener('rawMaterialBalanceUpdated', handleRawMaterialStockUpdate as EventListener);
      window.removeEventListener('rawMaterialUnitaryQuantityUpdated', handleRawMaterialUnitaryQuantityUpdate as EventListener);
    };
  }, []);

  // Inicialização do saldo de produtos de revenda - usando valor sincronizado do ResaleProductsStock
  useEffect(() => {
    const initializeResaleStockBalance = async () => {
      try {
        console.log('🔄 [Dashboard] Inicializando saldo de produtos de revenda...');

        // PRIORIDADE 1: Tentar carregar do localStorage (sincronizado pelo ResaleProductsStock)
        const localStorageData = localStorage.getItem('resale_total_stock_value');
        if (localStorageData) {
          try {
            const parsed = JSON.parse(localStorageData);
            if (parsed.value !== undefined && parsed.value >= 0) {
              console.log(`💾 [Dashboard] Valor carregado do localStorage (ResaleProductsStock): R$ ${parsed.value.toFixed(2)}`);
              console.log(`📊 [Dashboard] Dados do localStorage:`, parsed);
              setResaleProductStockBalance(parsed.value);
              setIsLoadingResaleProductStock(false);
              return;
            }
          } catch (error) {
            console.log('⚠️ [Dashboard] Erro ao parsear localStorage, usando cálculo local');
          }
        }

        // PRIORIDADE 2: Fallback para cálculo local
        console.log('📊 [Dashboard] Usando cálculo local como fallback...');
        const localValue = resaleProductStockValue;
        console.log(`🔍 [Dashboard] Valor calculado localmente: R$ ${localValue.toFixed(2)}`);

        setResaleProductStockBalance(localValue);
        setIsLoadingResaleProductStock(false);

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar saldo de produtos de revenda:', error);
        setResaleProductStockBalance(0);
        setIsLoadingResaleProductStock(false);
      }
    };

    // Aguardar um pouco para garantir que os dados estejam carregados
    if (!resaleProductsLoading && !stockItemsLoading) {
      initializeResaleStockBalance();
    }
  }, [resaleProductsLoading, stockItemsLoading, resaleProductStockValue]);

  // Listener para evento customizado de atualização do saldo de produtos de revenda
  useEffect(() => {
    const handleResaleStockUpdate = (event: CustomEvent) => {
      const { totalValue, timestamp, source } = event.detail;
      console.log(`🛍️ [Dashboard] Evento 'resaleTotalStockUpdated' recebido:`);
      console.log(`  - Valor Total: R$ ${totalValue.toFixed(2)}`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);

      // Atualizar estado imediatamente
      setResaleProductStockBalance(totalValue);
      setIsLoadingResaleProductStock(false);
    };

    console.log('🎯 [Dashboard] Registrando listener para evento resaleTotalStockUpdated');

    // Adicionar listener para o evento customizado
    window.addEventListener('resaleTotalStockUpdated', handleResaleStockUpdate as EventListener);

    // Cleanup
    return () => {
      console.log('🚫 [Dashboard] Removendo listener para evento resaleTotalStockUpdated');
      window.removeEventListener('resaleTotalStockUpdated', handleResaleStockUpdate as EventListener);
    };
  }, []);

  // Effect para sincronização em tempo real do saldo de caixa
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeCashBalanceSync = async () => {
      try {
        console.log('🔄 [Dashboard] Inicializando sincronização em tempo real do saldo de caixa...');

        // Carregar valor inicial do Supabase
        const initialBalance = await dataManager.loadCashBalance();
        console.log(`🔍 [Dashboard] Valor inicial do saldo do Supabase: R$ ${initialBalance.toFixed(2)}`);

        setCashBalanceState(initialBalance);
        setIsLoadingCashBalance(false);

        console.log(`✅ [Dashboard] Saldo inicial carregado: R$ ${initialBalance.toFixed(2)}`);

        // Configurar subscription em tempo real
        unsubscribe = dataManager.subscribeToCashBalanceChanges((newBalance) => {
          console.log(`📡 [Dashboard] Novo saldo de caixa recebido via subscription: R$ ${newBalance.toFixed(2)}`);
          setCashBalanceState(newBalance);
        });

        console.log('🔔 [Dashboard] Subscription ativa para mudanças de saldo em tempo real');

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao inicializar sincronização do saldo de caixa:', error);
        setIsLoadingCashBalance(false);

        // Fallback para cálculo local em caso de erro
        const fallbackBalance = cashBalance;
        setCashBalanceState(fallbackBalance);
      }
    };

    initializeCashBalanceSync();

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        console.log('🔕 [Dashboard] Cancelando subscription do saldo de caixa');
        unsubscribe();
      }
    };
  }, []);

  // Listener para evento customizado de atualização do saldo de caixa
  useEffect(() => {
    const handleCashBalanceUpdate = (event: CustomEvent) => {
      const { balance, timestamp, source } = event.detail;
      console.log(`💰 [Dashboard] Evento 'cashBalanceUpdated' recebido:`);
      console.log(`  - Saldo: R$ ${balance.toFixed(2)}`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);

      // Atualizar estado imediatamente
      setCashBalanceState(balance);
      setIsLoadingCashBalance(false);
    };

    console.log('🎯 [Dashboard] Registrando listener para evento cashBalanceUpdated');

    // Adicionar listener para o evento customizado
    window.addEventListener('cashBalanceUpdated', handleCashBalanceUpdate as EventListener);

    // Cleanup
    return () => {
      console.log('🚫 [Dashboard] Removendo listener para evento cashBalanceUpdated');
      window.removeEventListener('cashBalanceUpdated', handleCashBalanceUpdate as EventListener);
    };
  }, []);

  // Sistema de sincronização em tempo real para dados de estoque
  useEffect(() => {
    console.log('🔔 [Dashboard] Iniciando subscription para mudanças no estoque...');

    const stockChannel = supabase
      .channel('stock_realtime')
      .on('postgres_changes', {
        event: '*', // INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'stock_items'
      }, (payload) => {
        console.log('📦 [Dashboard] Mudança detectada na tabela stock_items:', payload);

        // Recarregar dados de estoque após mudança
        setTimeout(() => {
          console.log('🔄 [Dashboard] Recarregando dados de estoque após mudança (Supabase Realtime)');

          // Disparar evento customizado para forçar recarga
          const stockUpdateEvent = new CustomEvent('stockItemsUpdated', {
            detail: {
              timestamp: Date.now(),
              source: 'Dashboard-SupabaseRealtime',
              payload
            }
          });
          window.dispatchEvent(stockUpdateEvent);
        }, 200); // Delay pequeno para garantir que a mudança foi persistida
      })
      .subscribe();

    // Cleanup
    return () => {
      console.log('🔕 [Dashboard] Cancelando subscription do estoque');
      stockChannel.unsubscribe();
    };
  }, []);

  // Listener para eventos de atualização de estoque de matéria-prima em tempo real
  useEffect(() => {
    const handleMaterialStockUpdate = async (event: CustomEvent) => {
      const { updateData, timestamp, source } = event.detail;
      console.log(`🏭 [Dashboard] Evento 'materialStockUpdated' recebido:`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);
      console.log(`  - Update Data:`, updateData);

      // Forçar recálculo imediato do saldo de matéria-prima
      setTimeout(() => {
        console.log('🔄 [Dashboard] Forçando recálculo do saldo de matéria-prima após atualização de estoque');

        // Recarregar dados de estoque para recalcular valores
        const forceReloadEvent = new CustomEvent('forceStockItemsReload');
        window.dispatchEvent(forceReloadEvent);

        // Disparar evento específico para recálculo de matéria-prima
        const forceRawMaterialEvent = new CustomEvent('forceRawMaterialBalanceRecalc', {
          detail: {
            timestamp: Date.now(),
            source: 'Dashboard-MaterialStockUpdate'
          }
        });
        window.dispatchEvent(forceRawMaterialEvent);
      }, 200); // Pequeno delay para garantir que a atualização do Supabase foi processada
    };

    const handleForceRawMaterialRecalc = async (event: CustomEvent) => {
      const { timestamp, source } = event.detail;
      console.log(`🔄 [Dashboard] Evento 'forceRawMaterialRecalc' recebido:`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);

      // Recarregar dados de estoque e recalcular saldo
      try {
        const updatedStockItems = await dataManager.loadStockItems();

        // Calcular novo saldo de matéria-prima
        const materialStockItems = updatedStockItems.filter(item => item.item_type === 'material');
        const newRawMaterialBalance = materialStockItems.reduce((total, item) => {
          return total + (item.total_value || 0);
        }, 0);

        console.log(`💰 [Dashboard] Novo saldo de matéria-prima calculado: R$ ${newRawMaterialBalance.toFixed(2)}`);

        // Salvar no Supabase e disparar evento de atualização
        await dataManager.saveRawMaterialStockBalance(newRawMaterialBalance);

        // Disparar evento para atualizar o card no dashboard
        const updateEvent = new CustomEvent('rawMaterialBalanceUpdated', {
          detail: {
            balance: newRawMaterialBalance,
            timestamp: Date.now(),
            source: 'Dashboard-ForceRecalc'
          }
        });
        window.dispatchEvent(updateEvent);

      } catch (error) {
        console.error('❌ [Dashboard] Erro ao recalcular saldo de matéria-prima:', error);
      }
    };

    console.log('🎯 [Dashboard] Registrando listeners para eventos de matéria-prima');

    // Adicionar listeners para os eventos customizados
    window.addEventListener('materialStockUpdated', handleMaterialStockUpdate as EventListener);
    window.addEventListener('forceRawMaterialRecalc', handleForceRawMaterialRecalc as EventListener);

    // Cleanup
    return () => {
      console.log('🚫 [Dashboard] Removendo listeners para eventos de matéria-prima');
      window.removeEventListener('materialStockUpdated', handleMaterialStockUpdate as EventListener);
      window.removeEventListener('forceRawMaterialRecalc', handleForceRawMaterialRecalc as EventListener);
    };
  }, []);

  // Listener para evento customizado de atualização de estoque
  useEffect(() => {
    const handleStockUpdate = async (event: CustomEvent) => {
      const { timestamp, source } = event.detail;
      console.log(`📦 [Dashboard] Evento 'stockItemsUpdated' recebido:`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);

      // Recarregar dados de estoque
      try {
        console.log('🔄 [Dashboard] Recarregando dados de estoque...');
        const updatedStockItems = await dataManager.loadStockItems();

        // Atualizar estado local (isso vai recalcular automaticamente os valores dos cards)
        // Como estamos usando o hook useStockItems, precisamos forçar uma atualização
        // Vamos disparar um evento para o hook
        const forceReloadEvent = new CustomEvent('forceStockItemsReload', {
          detail: { updatedStockItems }
        });
        window.dispatchEvent(forceReloadEvent);

        console.log(`✅ [Dashboard] Dados de estoque recarregados: ${updatedStockItems.length} itens`);
      } catch (error) {
        console.error('❌ [Dashboard] Erro ao recarregar dados de estoque:', error);
      }
    };

    console.log('🎯 [Dashboard] Registrando listener para evento stockItemsUpdated');

    // Adicionar listener para o evento customizado
    window.addEventListener('stockItemsUpdated', handleStockUpdate as EventListener);

    // Cleanup
    return () => {
      console.log('🚫 [Dashboard] Removendo listener para evento stockItemsUpdated');
      window.removeEventListener('stockItemsUpdated', handleStockUpdate as EventListener);
    };
  }, []);

  // Monitorar mudanças no stockItems e calcular saldo de matéria-prima automaticamente
  useEffect(() => {
    if (!stockItemsLoading && stockItems.length >= 0) {
      const timeoutId = setTimeout(async () => {
        console.log('🔍 [Dashboard] Calculando saldo de matéria-prima automaticamente...');
        console.log(`📊 [Dashboard] Total de stockItems: ${stockItems.length}`);

        // Filtrar apenas matéria-prima
        const materialItems = stockItems.filter(item => item.item_type === 'material');
        console.log(`🏭 [Dashboard] Matérias-primas encontradas: ${materialItems.length}`);

        // Calcular quantidade total de matéria-prima unitária (unidade "un")
        const unitaryMaterialQuantity = materialItems.reduce((total, item) => {
          // Buscar o material para pegar sua unidade
          const material = materials.find(m => m.id === item.item_id);
          const itemUnit = material?.unit || item.unit || '';

          if (itemUnit === 'un' && item.quantity > 0) {
            console.log(`📦 [Dashboard] Material unitário encontrado: ${item.item_name} - Qtd: ${item.quantity}`);
            return total + (item.quantity || 0);
          }
          return total;
        }, 0);

        // Atualizar quantidade unitária de matéria-prima
        setRawMaterialUnitaryQuantity(unitaryMaterialQuantity);
        setIsLoadingRawMaterialUnitaryQuantity(false);

        console.log(`📦 [Dashboard] Quantidade unitária de matéria-prima: ${unitaryMaterialQuantity}`);

        // Calcular valor total das matérias-primas
        let newBalance = 0;
        materialItems.forEach(item => {
          const itemValue = item.total_value || 0;
          newBalance += itemValue;

          if (itemValue > 0) {
            console.log(`  - ${item.item_name}: R$ ${itemValue.toFixed(2)} (qtd: ${item.quantity}, custo: ${item.unit_cost})`);
          }
        });

        console.log(`💰 [Dashboard] Saldo calculado: R$ ${newBalance.toFixed(2)}`);
        console.log(`💰 [Dashboard] Saldo atual no estado: R$ ${(rawMaterialStockBalance || 0).toFixed(2)}`);

        // Só atualizar se houver diferença significativa
        if (rawMaterialStockBalance === null || Math.abs((rawMaterialStockBalance || 0) - newBalance) > 0.01) {
          console.log(`🔄 [Dashboard] Atualizando saldo de matéria-prima: R$ ${newBalance.toFixed(2)}`);

          // Salvar no Supabase
          const success = await dataManager.saveRawMaterialStockBalance(newBalance);
          if (success) {
            console.log(`✅ [Dashboard] Saldo salvo com sucesso no Supabase: R$ ${newBalance.toFixed(2)}`);

            // Disparar evento de atualização
            const updateEvent = new CustomEvent('rawMaterialBalanceUpdated', {
              detail: {
                balance: newBalance,
                timestamp: Date.now(),
                source: 'Dashboard-StockItemsMonitor'
              }
            });
            window.dispatchEvent(updateEvent);
          }

          // Atualizar estado local
          setRawMaterialStockBalance(newBalance);
        } else {
          console.log(`✅ [Dashboard] Saldo já atualizado, não há necessidade de alterar`);
        }

        // Salvar quantidade unitária de matéria-prima no Supabase também
        try {
          const success = await dataManager.saveRawMaterialUnitaryQuantity(unitaryMaterialQuantity);
          if (success) {
            console.log(`✅ [Dashboard] Quantidade unitária de matéria-prima salva no Supabase: ${unitaryMaterialQuantity}`);
            console.log(`📦 [Dashboard] Card "Matéria Prima Unitária" sincronizado com valor: ${unitaryMaterialQuantity}`);

            // Disparar evento de atualização para quantidade unitária
            const quantityUpdateEvent = new CustomEvent('rawMaterialUnitaryQuantityUpdated', {
              detail: {
                quantity: unitaryMaterialQuantity,
                timestamp: Date.now(),
                source: 'Dashboard-StockItemsMonitor'
              }
            });
            window.dispatchEvent(quantityUpdateEvent);
          }
        } catch (error) {
          console.warn('⚠️ [Dashboard] Erro ao salvar quantidade unitária de matéria-prima:', error);
        }
      }, 300); // Aguardar 300ms para garantir que os dados foram processados

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [stockItems, stockItemsLoading, rawMaterialStockBalance, materials, materialsLoading]);

  // Log de comparação entre cálculo local e valor sincronizado
  useEffect(() => {
    if (resaleProductStockBalance !== null && !isLoadingResaleProductStock) {
      const difference = Math.abs(resaleProductStockValue - resaleProductStockBalance);
      if (difference > 0.01) {
        console.log('⚠️ [Dashboard] Diferença detectada no saldo de produtos de revenda:');
        console.log(`  - Cálculo local: R$ ${resaleProductStockValue.toFixed(2)}`);
        console.log(`  - Valor sincronizado: R$ ${resaleProductStockBalance.toFixed(2)}`);
        console.log(`  - Diferença: R$ ${difference.toFixed(2)}`);
        console.log(`  - ResaleProductsStock fará o cálculo correto automaticamente`);
      } else {
        console.log('✅ [Dashboard] Valores de produtos de revenda sincronizados corretamente:');
        console.log(`  - Valor: R$ ${resaleProductStockBalance.toFixed(2)}`);
      }
    }
  }, [resaleProductStockValue, resaleProductStockBalance, isLoadingResaleProductStock]);

  // Monitorar mudanças no cashFlowEntries e calcular saldo de caixa automaticamente
  useEffect(() => {
    if (!cashFlowLoading && cashFlowEntries.length >= 0) {
      const timeoutId = setTimeout(async () => {
        console.log('🔍 [Dashboard] Calculando saldo de caixa automaticamente...');
        console.log(`📊 [Dashboard] Total de entradas no cashFlow: ${cashFlowEntries.length}`);

        // Calcular saldo baseado nas entradas de fluxo de caixa
        let newBalance = 0;
        let totalIncome = 0;
        let totalExpense = 0;

        cashFlowEntries.forEach(entry => {
          if (entry.type === 'income') {
            totalIncome += entry.amount;
            newBalance += entry.amount;
          } else if (entry.type === 'expense') {
            totalExpense += entry.amount;
            newBalance -= entry.amount;
          }
        });

        console.log(`💰 [Dashboard] Receitas: R$ ${totalIncome.toFixed(2)}`);
        console.log(`💸 [Dashboard] Despesas: R$ ${totalExpense.toFixed(2)}`);
        console.log(`💰 [Dashboard] Saldo calculado: R$ ${newBalance.toFixed(2)}`);
        console.log(`💰 [Dashboard] Saldo atual no estado: R$ ${(cashBalanceState || 0).toFixed(2)}`);

        // Só atualizar se houver diferença significativa
        if (cashBalanceState === null || Math.abs((cashBalanceState || 0) - newBalance) > 0.01) {
          console.log(`🔄 [Dashboard] Atualizando saldo de caixa: R$ ${newBalance.toFixed(2)}`);

          // Salvar no Supabase
          const success = await dataManager.saveCashBalance(newBalance);
          if (success) {
            console.log(`✅ [Dashboard] Saldo salvo com sucesso no Supabase: R$ ${newBalance.toFixed(2)}`);

            // Disparar evento de atualização
            const updateEvent = new CustomEvent('cashBalanceUpdated', {
              detail: {
                balance: newBalance,
                timestamp: Date.now(),
                source: 'Dashboard-CashFlowMonitor'
              }
            });
            window.dispatchEvent(updateEvent);
          }

          // Atualizar estado local
          setCashBalanceState(newBalance);
        } else {
          console.log(`✅ [Dashboard] Saldo já atualizado, não há necessidade de alterar`);
        }
      }, 300); // Aguardar 300ms para garantir que os dados foram processados

      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [cashFlowEntries, cashFlowLoading, cashBalanceState]);

  // Monitoramento de mudanças no estoque para sincronização entre componentes
  useEffect(() => {
    if (!stockItems.length || stockItemsLoading) return;

    console.log('📊 [Dashboard] Monitorando mudanças no estoque para sincronização:', {
      totalStockItems: stockItems.length,
      finalProducts: stockItems.filter(item => item.item_type === 'product').length,
      materials: stockItems.filter(item => item.item_type === 'material').length
    });

    // Debounce para evitar múltiplos disparos
    const timeoutId = setTimeout(() => {
      // Disparar evento para forçar sincronização entre StockCharts e FinalProductsStock
      const stockSyncEvent = new CustomEvent('dashboardStockUpdated', {
        detail: {
          stockItems: stockItems.filter(item => item.item_type === 'product'),
          timestamp: Date.now(),
          source: 'Dashboard-StockMonitor'
        }
      });

      window.dispatchEvent(stockSyncEvent);
      console.log('📡 [Dashboard] Evento de sincronização de estoque disparado');

      // Forçar recalculação no FinalProductsStock após mudanças no estoque
      setTimeout(() => {
        const forceRecalcEvent = new CustomEvent('forceStockRecalculation', {
          detail: {
            source: 'Dashboard-StockChange',
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(forceRecalcEvent);
        console.log('🔄 [Dashboard] Forçando recalculação após mudança no estoque');
      }, 300);

    }, 1000); // Debounce de 1 segundo

    return () => clearTimeout(timeoutId);
  }, [stockItems, stockItemsLoading]);

  // Listeners para eventos de checkpoint - restauração de dados
  useEffect(() => {
    const handleResaleProductStockRestore = (event: CustomEvent) => {
      const { balance, source } = event.detail;
      console.log(`🔄 [Dashboard] Evento 'resaleProductStockUpdated' de checkpoint recebido:`);
      console.log(`  - Saldo: R$ ${balance.toFixed(2)}`);
      console.log(`  - Source: ${source}`);

      // Atualizar estado imediatamente
      setResaleProductStockBalance(balance);
      setIsLoadingResaleProductStock(false);
    };

    const handleRawMaterialStockRestore = (event: CustomEvent) => {
      const { balance, source } = event.detail;
      console.log(`🔄 [Dashboard] Evento 'rawMaterialStockUpdated' de checkpoint recebido:`);
      console.log(`  - Saldo: R$ ${balance.toFixed(2)}`);
      console.log(`  - Source: ${source}`);

      // Atualizar estado imediatamente
      setRawMaterialStockBalance(balance);
      setIsLoadingRawMaterialStock(false);
    };

    const handleCashBalanceRestore = (event: CustomEvent) => {
      const { balance, source } = event.detail;
      console.log(`🔄 [Dashboard] Evento 'cashBalanceUpdated' de checkpoint recebido:`);
      console.log(`  - Saldo: R$ ${balance.toFixed(2)}`);
      console.log(`  - Source: ${source}`);

      // Atualizar estado imediatamente
      setCashBalanceState(balance);
      setIsLoadingCashBalance(false);
    };

    const handleSystemRestore = (event: CustomEvent) => {
      const { timestamp, source, version } = event.detail;
      console.log(`🔄 [Dashboard] Sistema restaurado de checkpoint:`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString('pt-BR')}`);
      console.log(`  - Source: ${source}`);
      console.log(`  - Version: ${version}`);
    };

    console.log('🎯 [Dashboard] Registrando listeners para eventos de checkpoint');

    // Adicionar listeners para os eventos de checkpoint
    window.addEventListener('resaleProductStockUpdated', handleResaleProductStockRestore as EventListener);
    window.addEventListener('rawMaterialStockUpdated', handleRawMaterialStockRestore as EventListener);
    window.addEventListener('cashBalanceUpdated', handleCashBalanceRestore as EventListener);
    window.addEventListener('systemRestored', handleSystemRestore as EventListener);

    // Cleanup
    return () => {
      console.log('🚫 [Dashboard] Removendo listeners para eventos de checkpoint');
      window.removeEventListener('resaleProductStockUpdated', handleResaleProductStockRestore as EventListener);
      window.removeEventListener('rawMaterialStockUpdated', handleRawMaterialStockRestore as EventListener);
      window.removeEventListener('cashBalanceUpdated', handleCashBalanceRestore as EventListener);
      window.removeEventListener('systemRestored', handleSystemRestore as EventListener);
    };
  }, []);

  // Definições de métricas e cores removidas

  if (isDataLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(12)].map((_, index) => (
            <Card
              key={index}
              className="bg-factory-800/50 border-tire-600/30 animate-pulse"
            >
              <CardContent className="p-6">
                <div className="h-4 bg-factory-700/50 rounded mb-2"></div>
                <div className="h-8 bg-factory-700/50 rounded mb-2"></div>
                <div className="h-3 bg-factory-700/50 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-96 bg-factory-800/50 border-tire-600/30 rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  // Função para criar checkpoint incluindo todos os saldos
  const handleCreateCheckpoint = async () => {
    try {
      setIsCreatingCheckpoint(true);
      setCheckpointStatus('creating');

      console.log('💾 [Dashboard] Iniciando criação de checkpoint...');

      // Criar checkpoint usando o checkpointManager com informações de todos os saldos
      const checkpointDescription = [
        `Saldo Caixa: ${formatCurrency(cashBalanceState || 0)}`,
        `Saldo Produtos Finais: ${formatCurrency(finalProductStockBalance || 0)}`,
        `Saldo Matéria-Prima: ${formatCurrency(rawMaterialStockBalance || 0)}`,
        `Saldo Produtos Revenda: ${formatCurrency(resaleProductStockBalance || 0)}`
      ].join(' | ');

      const success = await checkpointManager.createCheckpoint(
        `Dashboard - ${checkpointDescription}`
      );

      if (success) {
        console.log('✅ [Dashboard] Checkpoint criado com sucesso');
        setCheckpointStatus('success');

        // Resetar status após 3 segundos
        setTimeout(() => {
          setCheckpointStatus(null);
        }, 3000);
      } else {
        throw new Error('Falha ao criar checkpoint');
      }
    } catch (error) {
      console.error('❌ [Dashboard] Erro ao criar checkpoint:', error);
      setCheckpointStatus('error');

      // Resetar status após 3 segundos
      setTimeout(() => {
        setCheckpointStatus(null);
      }, 3000);
    } finally {
      setIsCreatingCheckpoint(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Cards de Saldo e Receita */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-tire-300">Sistema de Gestão Financeira</p>
        </div>
        <div className="flex gap-6">
          {/* Card Saldo Caixa - Maior */}
          <Card className="bg-factory-900/30 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  (cashBalanceState !== null ? cashBalanceState : cashBalance) >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'
                }`}>
                  <DollarSign className={`h-6 w-6 ${
                    (cashBalanceState !== null ? cashBalanceState : cashBalance) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`} />
                </div>
                <div>
                  <p className="text-tire-300 text-sm font-medium">Saldo Caixa</p>
                  <p className={`text-2xl font-bold ${
                    (cashBalanceState !== null ? cashBalanceState : cashBalance) >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isLoadingCashBalance || cashBalanceState === null ? (
                      <span className="animate-pulse">Carregando...</span>
                    ) : (
                      formatCurrency(cashBalanceState)
                    )}
                  </p>
                  <p className="text-xs text-tire-400 mt-1">
                    {cashFlowEntries.length} movimentações
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Receita Total - Maior */}
          <Card className="bg-factory-900/30 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${
                  totalRevenue > 0 ? 'bg-green-500/20' : 'bg-gray-500/20'
                }`}>
                  <TrendingUp className={`h-6 w-6 ${
                    totalRevenue > 0 ? 'text-green-400' : 'text-gray-400'
                  }`} />
                </div>
                <div>
                  <p className="text-tire-300 text-sm font-medium">Receita Total</p>
                  <p className={`text-2xl font-bold ${
                    totalRevenue > 0 ? 'text-green-400' : 'text-tire-200'
                  }`}>
                    {formatCurrency(totalRevenue)}
                  </p>
                  <p className="text-xs text-tire-400 mt-1">
                    {salesCount} vendas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção de Cards de Métricas - Layout 3x3 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Primeira linha */}
          {/* Card 1 - Saldo Matéria-Prima */}
          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm font-medium">Saldo Matéria-Prima</p>
                  <p className="text-2xl font-bold text-tire-200">
                    {isLoadingRawMaterialStock || rawMaterialStockBalance === null ? (
                      <span className="animate-pulse">Carregando...</span>
                    ) : (
                      formatCurrency(rawMaterialStockBalance)
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-blue-500/20">
                  <Factory className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2 - Saldo Produtos Finais */}
          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm font-medium">Saldo Produtos Finais</p>
                  <p className="text-2xl font-bold text-tire-200">
                    {isLoadingFinalProductStock || finalProductStockBalance === null ? (
                      <span className="animate-pulse">Carregando...</span>
                    ) : (
                      formatCurrency(finalProductStockBalance)
                    )}
                  </p>

                </div>
                <div className="p-2 rounded-full bg-purple-500/20">
                  <Package className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3 - Saldo Produtos Revenda */}
          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm font-medium">Saldo Produtos Revenda</p>
                  <p className="text-2xl font-bold text-tire-200">
                    {isLoadingResaleProductStock || resaleProductStockBalance === null ? (
                      <span className="animate-pulse">Carregando...</span>
                    ) : (
                      formatCurrency(resaleProductStockBalance)
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-yellow-500/20">
                  <ShoppingBag className="h-5 w-5 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segunda linha */}
          {/* Card 4 - Custo Médio por Pneu */}
          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm font-medium">Custo Médio por Pneu</p>
                  <p className="text-2xl font-bold text-tire-200">
                    {formatCurrency(averageTireCost)}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-orange-500/20">
                  <Calculator className="h-5 w-5 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 5 - Lucro Médio por Pneu */}
          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm font-medium">Lucro Médio por Pneu</p>
                  <p className="text-2xl font-bold text-green-400">
                    {isLoadingTireProfit ? (
                      <span className="animate-pulse">Carregando...</span>
                    ) : (
                      formatCurrency(averageTireProfit)
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 6 - Lucro Médio Produtos Revenda */}
          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm font-medium">Lucro Médio Produtos Revenda</p>
                  <p className="text-2xl font-bold text-green-400">
                    {isLoadingResaleProfit || averageResaleProfit === null ? (
                      <span className="animate-pulse">Carregando...</span>
                    ) : (
                      formatCurrency(averageResaleProfit)
                    )}
                  </p>
                </div>
                <div className="p-2 rounded-full bg-green-500/20">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terceira linha */}
          {/* Card 7 - Matéria Prima Unitária */}
          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm">Matéria Prima Unitária</p>
                  <p className="text-2xl font-bold text-neon-orange">
                    {isLoadingRawMaterialUnitaryQuantity ? (
                      <span className="animate-pulse">Carregando...</span>
                    ) : (
                      rawMaterialUnitaryQuantity
                    )}
                  </p>
                  <p className="text-xs text-tire-400 mt-1">
                    {rawMaterialUnitaryQuantity === 1 ? '1 tipo em estoque' : `${rawMaterialUnitaryQuantity > 0 ? 'tipos' : '0 tipos'} em estoque`}
                  </p>
                </div>
                <div className="text-neon-orange">
                  <span className="text-2xl">📦</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards 8 e 9 - Placeholder para futuras métricas */}
          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200 opacity-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm font-medium">Métrica Futura</p>
                  <p className="text-2xl font-bold text-tire-400">--</p>
                  <p className="text-xs text-tire-400 mt-1">Em desenvolvimento</p>
                </div>
                <div className="p-2 rounded-full bg-gray-500/20">
                  <span className="text-lg">⏳</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200 opacity-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm font-medium">Métrica Futura</p>
                  <p className="text-2xl font-bold text-tire-400">--</p>
                  <p className="text-xs text-tire-400 mt-1">Em desenvolvimento</p>
                </div>
                <div className="p-2 rounded-full bg-gray-500/20">
                  <span className="text-lg">⏳</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quarta linha - Card adicional */}
        </div>

        {/* Quarta linha - Card adicional */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 10 - Quantidade Total Produtos Finais */}
          <Card className="bg-factory-800/50 border-tire-600/30 hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm">Qtd. Total Produtos Finais</p>
                  <p className="text-2xl font-bold text-neon-green">
                    {isLoadingFinalProductTotalQuantity ? (
                      <span className="animate-pulse">Carregando...</span>
                    ) : (
                      finalProductTotalQuantity
                    )}
                  </p>
                  <p className="text-xs text-tire-400 mt-1">
                    {finalProductTotalQuantity === 1 ? '1 unidade total' : `${finalProductTotalQuantity} unidades totais`}
                  </p>
                </div>
                <div className="text-neon-green">
                  <span className="text-2xl">🏭</span>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

      {/* Combined Charts Section - Production and Profit in Tabs */}
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Análise de Produção e Lucro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="production" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-factory-700/50 border-tire-600/30">
              <TabsTrigger
                value="production"
                className="data-[state=active]:bg-neon-green/20 data-[state=active]:text-neon-green text-tire-300 hover:text-white flex items-center gap-2"
              >
                <Factory className="h-4 w-4" />
                Gráfico de Produção
              </TabsTrigger>
              <TabsTrigger
                value="profit"
                className="data-[state=active]:bg-neon-purple/20 data-[state=active]:text-neon-purple text-tire-300 hover:text-white flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Gráfico de Lucro Presumido
              </TabsTrigger>
            </TabsList>

            <TabsContent value="production" className="mt-6">
              <div className="bg-factory-900/30 rounded-lg p-4 min-h-[400px] w-full">
                {isChartsLoading || !productionEntries ? (
                  <div className="flex items-center justify-center h-[350px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[350px]">
                    <ProductionChart
                      productionEntries={productionEntries || []}
                      isLoading={false}
                    />
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="profit" className="mt-6">
              <div className="bg-factory-900/30 rounded-lg p-4 min-h-[400px] w-full">
                {isChartsLoading || !cashFlowEntries || !materials || !products ? (
                  <div className="flex items-center justify-center h-[350px]">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple"></div>
                  </div>
                ) : (
                  <div className="w-full h-full min-h-[350px]">
                    <PresumedProfitChart
                      cashFlowEntries={cashFlowEntries || []}
                      materials={materials || []}
                      employees={employees || []}
                      fixedCosts={fixedCosts || []}
                      variableCosts={variableCosts || []}
                      stockItems={stockItems || []}
                      productionEntries={productionEntries || []}
                      products={products || []}
                      recipes={recipes || []}
                      defectiveTireSales={defectiveTireSales || []}
                      warrantyEntries={warrantyEntries || []}
                      isLoading={false}
                    />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Stock Charts Section */}
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Gráficos de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="min-h-[400px] w-full">
          <div className="min-h-[350px] w-full">
            {isChartsLoading || !materials || !products || !stockItems ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue"></div>
              </div>
            ) : (
              <div className="w-full h-full min-h-[350px]">
                <StockCharts
                  materials={materials || []}
                  products={products || []}
                  stockItems={stockItems || []}
                  isLoading={false}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Additional Summary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg">
              Resumo Financeiro Simplificado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Total de Entradas:</span>
                <span className="text-neon-green font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalIncome)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Total de Saídas:</span>
                <span className="text-red-400 font-bold">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalExpense)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-tire-600/30">
                <span className="text-white font-medium">Saldo Atual:</span>
                <span
                  className={`font-bold text-lg ${
                    cashBalance >= 0
                      ? "text-neon-green"
                      : "text-red-400"
                  }`}
                >
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(cashBalance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg">
              Resumo de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Total Produzido:</span>
                <span className="text-neon-blue font-bold">
                  {productionEntries.reduce(
                    (sum, entry) => sum + entry.quantity_produced,
                    0,
                  )} unidades
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Entradas de Produção:</span>
                <span className="text-neon-green font-bold">
                  {productionEntries.length} registros
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-tire-600/30">
                <span className="text-white font-medium">
                  Média por Entrada:
                </span>
                <span className="text-neon-orange font-bold">
                  {productionEntries.length > 0
                    ? (
                        productionEntries.reduce(
                          (sum, entry) => sum + entry.quantity_produced,
                          0,
                        ) / productionEntries.length
                      ).toFixed(1)
                    : 0}{" "}
                  unidades
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PresumedProfitManager sempre ativo para cálculos em tempo real */}
      <div className="hidden">
        <PresumedProfitManager
          isLoading={
            isDataLoading ||
            materialsLoading ||
            employeesLoading ||
            fixedCostsLoading ||
            variableCostsLoading ||
            stockItemsLoading ||
            productionLoading ||
            productsLoading ||
            cashFlowLoading ||
            recipesLoading ||
            defectiveTireSalesLoading ||
            warrantyEntriesLoading
          }
          materials={materials}
          employees={employees}
          fixedCosts={fixedCosts}
          variableCosts={variableCosts}
          stockItems={stockItems}
          productionEntries={productionEntries}
          products={products}
          cashFlowEntries={cashFlowEntries}
          recipes={recipes}
          defectiveTireSales={defectiveTireSales}
          warrantyEntries={warrantyEntries}
          hideCharts={true}
        />
      </div>

      {/* ResaleProductProfitManager sempre ativo para cálculos em tempo real */}
      <div className="hidden">
        {(() => {
          const isLoadingValue = cashFlowLoading || stockItemsLoading || resaleProductsLoading;
          console.log('🔧 [Dashboard] Renderizando ResaleProductProfitManager:', {
            isLoading: isLoadingValue,
            cashFlowLoading,
            stockItemsLoading,
            resaleProductsLoading,
            cashFlowEntries: cashFlowEntries.length,
            stockItems: stockItems.length
          });
          return (
            <ResaleProductProfitManager
              isLoading={isLoadingValue}
              cashFlowEntries={cashFlowEntries}
              stockItems={stockItems}
              hideCharts={true}
            />
          );
        })()}
      </div>

      {/* FinalProductsStock sempre ativo para cálculos e sincronização em tempo real */}
      <div className="hidden">
        {(() => {
          const isLoadingValue = stockItemsLoading || materialsLoading || recipesLoading;
          console.log('🔧 [Dashboard] Renderizando FinalProductsStock:', {
            isLoading: isLoadingValue,
            stockItemsLoading,
            materialsLoading,
            recipesLoading,
            stockItems: stockItems.length,
            materials: materials.length,
            recipes: recipes.length
          });
          return (
            <FinalProductsStock
              isLoading={isLoadingValue}
            />
          );
        })()}
      </div>

      {/* TireCostManager sempre ativo para cálculos de custo por pneu em tempo real */}
      <div className="hidden">
        {(() => {
          const isLoadingValue = 
            materialsLoading ||
            employeesLoading ||
            fixedCostsLoading ||
            variableCostsLoading ||
            stockItemsLoading ||
            productionLoading ||
            productsLoading ||
            cashFlowLoading ||
            recipesLoading ||
            defectiveTireSalesLoading ||
            warrantyEntriesLoading;
          console.log('🔧 [Dashboard] Renderizando TireCostManager:', {
            isLoading: isLoadingValue,
            materials: materials.length,
            employees: employees.length,
            stockItems: stockItems.length,
            products: products.length,
            recipes: recipes.length
          });
          return (
            <TireCostManager
              isLoading={isLoadingValue}
              materials={materials}
              employees={employees}
              fixedCosts={fixedCosts}
              variableCosts={variableCosts}
              stockItems={stockItems}
              productionEntries={productionEntries}
              products={products}
              cashFlowEntries={cashFlowEntries}
              recipes={recipes}
              defectiveTireSales={defectiveTireSales}
              warrantyEntries={warrantyEntries}
            />
          );
        })()
      }
      </div>

      {/* ResaleProductsStock sempre ativo para sincronização em tempo real */}
      <div className="hidden">
        {(() => {
          const isLoadingValue = resaleProductsLoading || stockItemsLoading;
          console.log('🔧 [Dashboard] Renderizando ResaleProductsStock:', {
            isLoading: isLoadingValue,
            resaleProductsLoading,
            stockItemsLoading,
            resaleProducts: resaleProducts.length,
            stockItems: stockItems.length
          });
          return (
            <ResaleProductsStock
              isLoading={isLoadingValue}
            />
          );
        })()
      }
      </div>
    </div>
  );
};

const Home = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const { stockItems, updateStockItem, loadStockItems } = useStockItems(); // ✅ Usando Supabase em vez de localStorage
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  // Function to trigger loading state for demonstration
  const handleRefresh = () => {
    setLoading(true);
    // Reset loading after 2 seconds
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  const handleSidebarClick = (label: string) => {
    const sectionMap: { [key: string]: string } = {
      Dashboard: "dashboard",
      Financeiro: "financial",
      Estoque: "inventory",
      Produção: "production",
      Cadastros: "registrations",
      Vendas: "sales",
    };
    setActiveSection(sectionMap[label] || "dashboard");
  };

  // Process URL hash to set active section
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    console.log(`🔗 [Dashboard] Hash da URL detectado: "${hash}"`);

    if (hash && hash !== activeSection) {
      console.log(`🔄 [Dashboard] Mudando seção ativa de "${activeSection}" para "${hash}"`);
      setActiveSection(hash);
    }
  }, []);

  // Listen for stockItemsUpdated event to reload stock items
  useEffect(() => {
    const handleStockItemsUpdated = async () => {
      console.log('🔄 [Home] Evento stockItemsUpdated recebido, recarregando itens de estoque...');
      await loadStockItems();
    };

    window.addEventListener('stockItemsUpdated', handleStockItemsUpdated as EventListener);
    // Also listen for the generic reload event from MainDashboard
    window.addEventListener('forceStockItemsReload', handleStockItemsUpdated as EventListener);

    return () => {
      window.removeEventListener('stockItemsUpdated', handleStockItemsUpdated as EventListener);
      window.removeEventListener('forceStockItemsReload', handleStockItemsUpdated as EventListener);
    };
  }, [loadStockItems]);


  // ✅ Function updateStock now uses Supabase via hook useStockItems
  const updateStock = async (
    itemId: string,
    itemType: "material" | "product",
    quantity: number,
    operation: "add" | "remove",
    unitPrice?: number,
    itemName?: string
  ): Promise<void> => {
    console.log(`🔄 [Home] Atualizando estoque via Supabase:`, {
      itemId,
      itemType,
      quantity,
      operation,
      unitPrice,
      itemName,
    });

    // Encontrar o item de estoque existente
    const existingStock = stockItems.find(
      (item) => item.item_id === itemId && item.item_type === itemType,
    );

    if (existingStock) {
      // Preparar dados para atualização
      let updateData: any = {
        last_updated: new Date().toISOString(),
      };

      if (operation === "add") {
        const newQuantity = existingStock.quantity + quantity;
        let newUnitCost = existingStock.unit_cost;

        // Calcular custo médio ponderado se adicionando com preço
        if (unitPrice && unitPrice > 0) {
          const currentTotalValue = existingStock.quantity * existingStock.unit_cost;
          const newTotalValue = quantity * unitPrice;
          newUnitCost = (currentTotalValue + newTotalValue) / newQuantity;
        }

        updateData = {
          ...updateData,
          quantity: newQuantity,
          unit_cost: newUnitCost,
          total_value: newQuantity * newUnitCost,
        };
      } else if (operation === "remove") {
        const newQuantity = Math.max(0, existingStock.quantity - quantity);
        updateData = {
          ...updateData,
          quantity: newQuantity,
          total_value: newQuantity * existingStock.unit_cost,
        };
      }

      // Atualizar via hook do Supabase
      try {
        await updateStockItem(existingStock.id, updateData);
        console.log(`✅ [Home] Estoque atualizado com sucesso via Supabase`);

        // Disparar evento para notificar outros componentes
        const stockUpdateEvent = new CustomEvent('stockItemsUpdated', {
          detail: {
            timestamp: Date.now(),
            source: 'Home-UpdateStock',
            updateType: operation,
            itemId: itemId,
            itemType: itemType
          }
        });
        window.dispatchEvent(stockUpdateEvent);

      } catch (error) {
        console.error(`❌ [Home] Erro ao atualizar estoque via Supabase:`, error);
      }
    } else {
      console.warn(`⚠️ [Home] Item de estoque não encontrado:`, { itemId, itemType });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-factory-900 via-factory-800 to-tire-900 factory-grid">
      <TopNavigation />
      <div className="flex h-[calc(100vh-64px)] mt-16">
        <Sidebar
          onItemClick={handleSidebarClick}
          activeItem={
            activeSection === "dashboard"
              ? "Dashboard"
              : activeSection === "financial"
                ? "Financeiro"
                : activeSection === "inventory"
                  ? "Estoque"
                  : activeSection === "production"
                    ? "Produção"
                    : activeSection === "sales"
                      ? "Vendas"
                      : "Cadastros"
          }
        />
        <main className="flex-1 overflow-auto">
          {/* Header Section */}
          <div className="container mx-auto px-6 pt-6 pb-4">
            <div className="flex justify-between items-center mb-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center neon-glow">
                    <span className="text-white font-bold text-lg">R</span>
                  </div>
                  {t("dashboard.title", "Remold Tire Factory")}
                </h1>
                <p className="text-tire-300 text-lg">
                  {t(
                    "dashboard.subtitle",
                    "Sistema de Gestão Financeira e Produção",
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <DataDiagnostic
                  isOpen={isDiagnosticOpen}
                  onOpenChange={setIsDiagnosticOpen}
                />
                <Button
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-neon-blue to-tire-500 hover:from-tire-600 hover:to-neon-blue text-white rounded-full px-6 h-11 shadow-lg transition-all duration-300 flex items-center gap-2 neon-glow pulse-glow"
                >
                  <RefreshCw
                    className={`h-5 w-5 ${loading ? "animate-spin" : ""}`}
                  />
                  {loading ? t("common.loading") : t("common.refresh")}
                </Button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              "container mx-auto p-6 space-y-8",
              "transition-all duration-300 ease-in-out",
            )}
          >
            {activeSection === "dashboard" && (
              <MainDashboard isLoading={loading} />
            )}
            {activeSection === "financial" && (
              <FinancialDashboard
                isLoading={loading}
                onRefresh={handleRefresh}
              />
            )}
            {activeSection === "registrations" && (
              <RegistrationDashboard
                isLoading={loading}
                onRefresh={handleRefresh}
              />
            )}
            {activeSection === "inventory" && (
              <StockDashboard isLoading={loading} onRefresh={handleRefresh} />
            )}
            {activeSection === "production" && (
              <ProductionDashboard
                isLoading={loading}
                onRefresh={handleRefresh}
                onStockUpdate={updateStock}
              />
            )}
            {activeSection === "sales" && (
              <SalesDashboard isLoading={loading} onRefresh={handleRefresh} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;