import React, { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Input e Label removidos - não são mais necessários
// Dialog components removidos - não são mais necessários
import {
  RefreshCw,
  BarChart3,
  Factory,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
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
import { useMemo } from "react";
import { supabase } from "@/supabase/supabase";
// Imports de drag-and-drop removidos - não são mais necessários

// Seção de Métricas Principais removida completamente conforme solicitado

// Interface para métricas do sistema
interface MetricasSistema {
  id: string;
  categoria: string;
  nome_metrica: string;
  valor_numerico: number | null;
  valor_texto: string | null;
  valor_percentual: number | null;
  unidade: string | null;
  descricao: string | null;
  periodo_referencia: string;
  timestamp_atualizacao: string;
}

// Main Dashboard Component with Financial Metrics
const MainDashboard = ({ isLoading = false }: { isLoading?: boolean }) => {
  // Estados para métricas centralizadas
  const [metricasSistema, setMetricasSistema] = useState<MetricasSistema[]>([]);
  const [isMetricasLoading, setIsMetricasLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>("");
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
    warrantyEntriesLoading ||
    isMetricasLoading;

  // Função para buscar métricas do Supabase
  const fetchMetricas = async () => {
    try {
      setIsMetricasLoading(true);
      const { data, error } = await supabase
        .from('metricas_sistema')
        .select('*')
        .eq('ativo', true)
        .order('categoria', { ascending: true })
        .order('nome_metrica', { ascending: true });

      if (error) {
        console.error('❌ [Dashboard] Erro ao buscar métricas:', error);
        return;
      }

      setMetricasSistema(data || []);
      setLastSyncTime(new Date().toLocaleTimeString('pt-BR'));
      console.log('✅ [Dashboard] Métricas carregadas:', data?.length || 0, 'registros');
    } catch (error) {
      console.error('❌ [Dashboard] Erro na busca de métricas:', error);
    } finally {
      setIsMetricasLoading(false);
    }
  };

  // Função para atualizar métrica específica
  const updateMetrica = async (nomeMetrica: string, valorNumerico?: number, valorTexto?: string, valorPercentual?: number) => {
    try {
      const { error } = await supabase.rpc('atualizar_metrica', {
        nome_metrica_param: nomeMetrica,
        valor_numerico_param: valorNumerico || null,
        valor_texto_param: valorTexto || null,
        valor_percentual_param: valorPercentual || null
      });

      if (error) {
        console.error(`❌ [Dashboard] Erro ao atualizar métrica ${nomeMetrica}:`, error);
        return false;
      }

      console.log(`✅ [Dashboard] Métrica ${nomeMetrica} atualizada com sucesso`);
      return true;
    } catch (error) {
      console.error(`❌ [Dashboard] Erro na atualização da métrica ${nomeMetrica}:`, error);
      return false;
    }
  };

  // Função para sincronizar todas as métricas
  const syncAllMetrics = async () => {
    console.log('🔄 [Dashboard] Iniciando sincronização completa de métricas...');
    
    try {
      // Métricas Financeiras
      const totalIncome = cashFlowEntries.filter(entry => entry.type === 'income').reduce((sum, entry) => sum + entry.amount, 0);
      const totalExpense = cashFlowEntries.filter(entry => entry.type === 'expense').reduce((sum, entry) => sum + entry.amount, 0);
      const cashBalance = totalIncome - totalExpense;
      
      await updateMetrica('saldo_atual', cashBalance);
      await updateMetrica('total_entradas', totalIncome);
      await updateMetrica('total_saidas', totalExpense);

      // Métricas de Produção
      const totalProducao = productionEntries.reduce((sum, entry) => sum + entry.quantity_produced, 0);
      const totalPerdasProducao = productionEntries.reduce((sum, entry) => sum + (entry.production_loss || 0), 0);
      const diasProducao = new Set(productionEntries.map(entry => entry.production_date)).size;
      
      await updateMetrica('total_produzido', totalProducao);
      await updateMetrica('perdas_producao', totalPerdasProducao);
      await updateMetrica('dias_producao_ativa', diasProducao);

      // Métricas de Estoque
      const valorTotalMP = stockItems
        .filter(item => item.item_type === 'material')
        .reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      
      const valorTotalFinais = stockItems
        .filter(item => item.item_type === 'product')
        .reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);

      await updateMetrica('valor_total_materia_prima', valorTotalMP);
      await updateMetrica('valor_total_produtos_finais', valorTotalFinais);

      // Métricas de Vendas
      const vendasDefeituosos = defectiveTireSales.reduce((sum, sale) => sum + sale.sale_value, 0);
      const qtdDefeituosos = defectiveTireSales.reduce((sum, sale) => sum + sale.quantity, 0);
      const garantiasTotal = warrantyEntries.length;

      await updateMetrica('vendas_pneus_defeituosos', vendasDefeituosos);
      await updateMetrica('quantidade_defeituosos_vendidos', qtdDefeituosos);
      await updateMetrica('garantias_registradas', garantiasTotal);

      console.log('✅ [Dashboard] Sincronização completa de métricas finalizada');
      
      // Atualizar dados após sincronização
      await fetchMetricas();
      
    } catch (error) {
      console.error('❌ [Dashboard] Erro na sincronização de métricas:', error);
    }
  };

  // Hook para buscar métricas na inicialização
  useEffect(() => {
    fetchMetricas();
  }, []);

  // Hook para setup do Realtime
  useEffect(() => {
    console.log('🔄 [Dashboard] Configurando Realtime para métricas...');
    
    const channel = supabase
      .channel('metricas-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'metricas_sistema' 
        }, 
        (payload) => {
          console.log('📡 [Dashboard] Realtime - Mudança detectada:', payload);
          fetchMetricas();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 [Dashboard] Desconectando canal Realtime');
      supabase.removeChannel(channel);
    };
  }, []);

  // Hook para sincronização automática quando dados mudarem
  useEffect(() => {
    if (!isDataLoading && cashFlowEntries.length > 0) {
      const timeoutId = setTimeout(() => {
        syncAllMetrics();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [
    cashFlowEntries, 
    productionEntries, 
    stockItems, 
    defectiveTireSales, 
    warrantyEntries,
    isDataLoading
  ]);

  // Função para obter métrica por nome
  const getMetrica = (nomeMetrica: string): MetricasSistema | null => {
    return metricasSistema.find(m => m.nome_metrica === nomeMetrica) || null;
  };

  // Função para formatar valor da métrica
  const formatMetricValue = (metrica: MetricasSistema | null): string => {
    if (!metrica) return '0';
    
    if (metrica.valor_numerico !== null) {
      if (metrica.unidade === 'BRL') {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(metrica.valor_numerico);
      } else if (metrica.unidade === '%') {
        return `${metrica.valor_numerico.toFixed(1)}%`;
      } else {
        return `${metrica.valor_numerico.toLocaleString('pt-BR')} ${metrica.unidade || ''}`.trim();
      }
    }
    
    if (metrica.valor_percentual !== null) {
      return `${metrica.valor_percentual.toFixed(1)}%`;
    }
    
    return metrica.valor_texto || '0';
  };

  // Estados de métricas principais removidos

  // Funções de configuração e drag-and-drop removidas

  // Lógica de sincronização das métricas removida

  // Cálculos de métricas simplificados - apenas para debug
  const totalIncome = cashFlowEntries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpense = cashFlowEntries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const cashBalance = totalIncome - totalExpense;

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

  return (
    <div className="space-y-6">
      {/* Seção de Métricas Centralizadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Header com botão de sincronização */}
        <div className="col-span-full flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">📊 Métricas Centralizadas</h2>
            <p className="text-tire-300">
              Última sincronização: {lastSyncTime || 'Aguardando...'}
            </p>
          </div>
          <Button
            onClick={syncAllMetrics}
            disabled={isDataLoading}
            className="bg-gradient-to-r from-neon-blue to-neon-purple hover:from-neon-purple hover:to-neon-blue text-white rounded-full px-6 h-11 shadow-lg transition-all duration-300 flex items-center gap-2 neon-glow"
          >
            <RefreshCw className={`h-4 w-4 ${isDataLoading ? 'animate-spin' : ''}`} />
            Sincronizar Métricas
          </Button>
        </div>

        {/* Métricas Financeiras */}
        <Card className="bg-factory-800/50 border-tire-600/30 col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
              💰 Métricas Financeiras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-factory-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-tire-300 text-sm">Saldo Atual</p>
                    <p className={`text-2xl font-bold ${
                      (getMetrica('saldo_atual')?.valor_numerico || 0) >= 0 
                        ? 'text-neon-green' 
                        : 'text-red-400'
                    }`}>
                      {formatMetricValue(getMetrica('saldo_atual'))}
                    </p>
                  </div>
                  <div className="text-neon-green">
                    <span className="text-2xl">💎</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-factory-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-tire-300 text-sm">Total Entradas</p>
                    <p className="text-2xl font-bold text-neon-green">
                      {formatMetricValue(getMetrica('total_entradas'))}
                    </p>
                  </div>
                  <div className="text-neon-green">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-factory-700/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-tire-300 text-sm">Total Saídas</p>
                    <p className="text-2xl font-bold text-red-400">
                      {formatMetricValue(getMetrica('total_saidas'))}
                    </p>
                  </div>
                  <div className="text-red-400">
                    <TrendingUp className="h-8 w-8 rotate-180" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Produção */}
        <Card className="bg-factory-800/50 border-tire-600/30 col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
              🏭 Métricas de Produção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Total Produzido:</span>
                <span className="text-neon-blue font-bold">
                  {formatMetricValue(getMetrica('total_produzido'))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Perdas Produção:</span>
                <span className="text-red-400 font-bold">
                  {formatMetricValue(getMetrica('perdas_producao'))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Dias Produção:</span>
                <span className="text-neon-orange font-bold">
                  {formatMetricValue(getMetrica('dias_producao_ativa'))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Estoque */}
        <Card className="bg-factory-800/50 border-tire-600/30 col-span-full lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
              📦 Métricas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Valor Matéria-Prima:</span>
                <span className="text-neon-cyan font-bold">
                  {formatMetricValue(getMetrica('valor_total_materia_prima'))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Valor Produtos Finais:</span>
                <span className="text-neon-green font-bold">
                  {formatMetricValue(getMetrica('valor_total_produtos_finais'))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Valor Revenda:</span>
                <span className="text-neon-purple font-bold">
                  {formatMetricValue(getMetrica('valor_total_revenda'))}
                </span>
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
              <div className="bg-factory-900/30 rounded-lg p-1">
                <ProductionChart
                  productionEntries={productionEntries}
                  isLoading={isDataLoading}
                />
              </div>
            </TabsContent>

            <TabsContent value="profit" className="mt-6">
              <div className="bg-factory-900/30 rounded-lg p-1">
                <PresumedProfitChart
                  cashFlowEntries={cashFlowEntries}
                  materials={materials}
                  employees={employees}
                  fixedCosts={fixedCosts}
                  variableCosts={variableCosts}
                  stockItems={stockItems}
                  productionEntries={productionEntries}
                  products={products}
                  recipes={recipes}
                  defectiveTireSales={defectiveTireSales}
                  warrantyEntries={warrantyEntries}
                  isLoading={isDataLoading}
                />
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
        <CardContent>
          <StockCharts
            materials={materials}
            products={products}
            stockItems={stockItems}
            isLoading={isDataLoading}
          />
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

      {/* Seção de debug removida completamente */}
    </div>
  );
};

const Home = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [stockItems, setStockItems] = useState([]);
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

  // Load stock items for production module
  useEffect(() => {
    const savedStockItems = localStorage.getItem("tire-factory-stock-items");
    if (savedStockItems) {
      try {
        setStockItems(JSON.parse(savedStockItems));
      } catch (error) {
        console.error("Error loading stock items:", error);
      }
    }
  }, []);

  const handleStockUpdate = (
    itemId: string,
    itemType: "material" | "product",
    quantity: number,
    operation: "add" | "remove",
    unitPrice?: number,
  ) => {
    // Update stock items and save to localStorage
    const savedStockItems = localStorage.getItem("tire-factory-stock-items");
    let currentStockItems = [];
    if (savedStockItems) {
      try {
        currentStockItems = JSON.parse(savedStockItems);
      } catch (error) {
        console.error("Error loading stock items:", error);
      }
    }

    const existingStockIndex = currentStockItems.findIndex(
      (item: any) => item.item_id === itemId && item.item_type === itemType,
    );

    if (existingStockIndex >= 0) {
      // Update existing stock item
      const updatedStockItems = currentStockItems.map(
        (item: any, index: number) => {
          if (index === existingStockIndex) {
            if (operation === "remove") {
              const newQuantity = Math.max(0, item.quantity - quantity);
              return {
                ...item,
                quantity: newQuantity,
                total_value: newQuantity * item.unit_cost,
                last_updated: new Date().toISOString(),
              };
            }
          }
          return item;
        },
      );

      localStorage.setItem(
        "tire-factory-stock-items",
        JSON.stringify(updatedStockItems),
      );
      setStockItems(updatedStockItems);
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
                onStockUpdate={handleStockUpdate}
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