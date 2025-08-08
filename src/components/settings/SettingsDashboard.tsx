import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  DollarSign,
  Calculator,
  Save,
  RefreshCw,
  Package,
  Factory,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Building2,
  FileText,
} from "lucide-react";
import { dataManager } from "../../utils/dataManager";

interface SettingsDashboardProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

const SettingsDashboard = ({
  onRefresh = () => {},
  isLoading = false,
}: SettingsDashboardProps) => {
  // Estados para configurações de lucro empresarial
  const [empresarialProfitConfig, setEmpresarialProfitConfig] = useState({
    tireProfitPercentage: 78.77,
    resaleProfitPercentage: 23.61,
    productionCostMultiplier: 1.15,
    marketingCostPercentage: 2.5,
    operationalCostPercentage: 5.0,
  });

  // Estados para configurações de custo
  const [costConfig, setCostConfig] = useState({
    averageTireCost: 101.09,
    laborCostPerHour: 25.00,
    electricityCostPerKwh: 0.68,
    maintenanceCostPercentage: 3.2,
  });

  // Estados para configurações de estoque
  const [stockConfig, setStockConfig] = useState({
    minStockLevel: 10,
    maxStockLevel: 1000,
    reorderPoint: 20,
    safetyStock: 15,
  });

  // Estados de loading para cada seção
  const [loadingStates, setLoadingStates] = useState({
    empresarialProfit: false,
    cost: false,
    stock: false,
  });

  // Estados de status de salvamento
  const [saveStatus, setSaveStatus] = useState<{[key: string]: 'idle' | 'saving' | 'success' | 'error'}>({
    empresarialProfit: 'idle',
    cost: 'idle',
    stock: 'idle',
  });

  // Estados para valor empresarial
  const [empresarialValue, setEmpresarialValue] = useState<number>(0);
  const [isGeneratingBalance, setIsGeneratingBalance] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Carregar configurações iniciais
  useEffect(() => {
    loadInitialSettings();
  }, []);

  const loadInitialSettings = async () => {
    setLoadingStates({
      empresarialProfit: true,
      cost: true,
      stock: true,
    });

    try {
      // Carregar configurações de lucro empresarial
      const tireProfitValue = await dataManager.loadAverageTireProfit();
      const resaleProfitValue = await dataManager.loadAverageResaleProfit();

      setEmpresarialProfitConfig(prev => ({
        ...prev,
        tireProfitPercentage: tireProfitValue,
        resaleProfitPercentage: resaleProfitValue,
      }));

      // Carregar configurações de custo
      const averageTireCost = await dataManager.loadAverageTireCost();
      setCostConfig(prev => ({
        ...prev,
        averageTireCost: averageTireCost,
      }));

      // Carregar configurações de estoque (ainda não implementado o carregamento individual)
      // await dataManager.loadStockSettings();

      // Carregar valor empresarial
      const empresarialResult = await dataManager.loadSystemSetting("empresarial_value", "0");
      setEmpresarialValue(Number(empresarialResult) || 0);


      console.log('✅ [SettingsDashboard] Configurações carregadas:', {
        tireProfitValue,
        resaleProfitValue,
        averageTireCost,
        empresarialValue: Number(empresarialResult) || 0
      });

    } catch (error) {
      console.error('❌ [SettingsDashboard] Erro ao carregar configurações:', error);
    } finally {
      setLoadingStates({
        empresarialProfit: false,
        cost: false,
        stock: false,
      });
    }
  };

  // Salvar configurações de lucro empresarial
  const saveEmpresarialProfitConfig = async () => {
    setSaveStatus(prev => ({ ...prev, empresarialProfit: 'saving' }));

    try {
      // Salvar lucro médio por pneu
      await dataManager.saveAverageTireProfit(empresarialProfitConfig.tireProfitPercentage);

      // Salvar lucro médio de produtos de revenda
      await dataManager.saveAverageResaleProfit(empresarialProfitConfig.resaleProfitPercentage);

      // Salvar outras configurações no Supabase
      const configData = {
        production_cost_multiplier: empresarialProfitConfig.productionCostMultiplier,
        marketing_cost_percentage: empresarialProfitConfig.marketingCostPercentage,
        operational_cost_percentage: empresarialProfitConfig.operationalCostPercentage,
      };

      // Salvar cada configuração individualmente
      for (const [key, value] of Object.entries(configData)) {
        await dataManager.saveSystemSetting(key, value);
      }

      setSaveStatus(prev => ({ ...prev, empresarialProfit: 'success' }));

      // Disparar eventos para atualizar outros componentes
      const tireProfitEvent = new CustomEvent('tireProfitUpdated', {
        detail: {
          profit: empresarialProfitConfig.tireProfitPercentage,
          timestamp: Date.now(),
          source: 'SettingsDashboard'
        }
      });
      window.dispatchEvent(tireProfitEvent);

      const resaleProfitEvent = new CustomEvent('resaleProfitUpdated', {
        detail: {
          profit: empresarialProfitConfig.resaleProfitPercentage,
          timestamp: Date.now(),
          source: 'SettingsDashboard'
        }
      });
      window.dispatchEvent(resaleProfitEvent);

      console.log('✅ [SettingsDashboard] Configurações de lucro empresarial salvas com sucesso');

      // Reset status após 3 segundos
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, empresarialProfit: 'idle' }));
      }, 3000);

    } catch (error) {
      console.error('❌ [SettingsDashboard] Erro ao salvar configurações de lucro:', error);
      setSaveStatus(prev => ({ ...prev, empresarialProfit: 'error' }));

      // Reset status após 5 segundos
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, empresarialProfit: 'idle' }));
      }, 5000);
    }
  };

  // Salvar configurações de custo
  const saveCostConfig = async () => {
    setSaveStatus(prev => ({ ...prev, cost: 'saving' }));

    try {
      // Salvar custo médio por pneu
      await dataManager.saveAverageTireCost(costConfig.averageTireCost);

      // Salvar outras configurações de custo
      const configData = {
        labor_cost_per_hour: costConfig.laborCostPerHour,
        electricity_cost_per_kwh: costConfig.electricityCostPerKwh,
        maintenance_cost_percentage: costConfig.maintenanceCostPercentage,
      };

      for (const [key, value] of Object.entries(configData)) {
        await dataManager.saveSystemSetting(key, value);
      }

      setSaveStatus(prev => ({ ...prev, cost: 'success' }));

      console.log('✅ [SettingsDashboard] Configurações de custo salvas com sucesso');

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, cost: 'idle' }));
      }, 3000);

    } catch (error) {
      console.error('❌ [SettingsDashboard] Erro ao salvar configurações de custo:', error);
      setSaveStatus(prev => ({ ...prev, cost: 'error' }));

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, cost: 'idle' }));
      }, 5000);
    }
  };

  // Salvar configurações de estoque
  const saveStockConfig = async () => {
    setSaveStatus(prev => ({ ...prev, stock: 'saving' }));

    try {
      const configData = {
        min_stock_level: stockConfig.minStockLevel,
        max_stock_level: stockConfig.maxStockLevel,
        reorder_point: stockConfig.reorderPoint,
        safety_stock: stockConfig.safetyStock,
      };

      for (const [key, value] of Object.entries(configData)) {
        await dataManager.saveSystemSetting(key, value);
      }

      setSaveStatus(prev => ({ ...prev, stock: 'success' }));

      console.log('✅ [SettingsDashboard] Configurações de estoque salvas com sucesso');

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, stock: 'idle' }));
      }, 3000);

    } catch (error) {
      console.error('❌ [SettingsDashboard] Erro ao salvar configurações de estoque:', error);
      setSaveStatus(prev => ({ ...prev, stock: 'error' }));

      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, stock: 'idle' }));
      }, 5000);
    }
  };

  // Componente de status de salvamento
  const SaveStatus = ({ status }: { status: string }) => {
    switch (status) {
      case 'saving':
        return (
          <Badge variant="secondary" className="ml-2">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Salvando...
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="default" className="ml-2 bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Salvo!
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="ml-2">
            <AlertCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      default:
        return null;
    }
  };

  // Função para salvar todas as configurações, incluindo o valor empresarial
  const saveSettings = async () => {
    try {
      setSaveStatus(prev => ({ ...prev, empresarialProfit: 'saving', cost: 'saving', stock: 'saving' }));

      // Salvar todas as configurações
      const results = await Promise.all([
        dataManager.saveAverageTireCost(costConfig.averageTireCost),
        dataManager.saveAverageTireProfit(empresarialProfitConfig.tireProfitPercentage),
        dataManager.saveAverageResaleProfit(empresarialProfitConfig.resaleProfitPercentage),
        dataManager.saveSystemSetting("production_cost_multiplier", empresarialProfitConfig.productionCostMultiplier.toString()),
        dataManager.saveSystemSetting("marketing_cost_percentage", empresarialProfitConfig.marketingCostPercentage.toString()),
        dataManager.saveSystemSetting("operational_cost_percentage", empresarialProfitConfig.operationalCostPercentage.toString()),
        dataManager.saveSystemSetting("labor_cost_per_hour", costConfig.laborCostPerHour.toString()),
        dataManager.saveSystemSetting("electricity_cost_per_kwh", costConfig.electricityCostPerKwh.toString()),
        dataManager.saveSystemSetting("maintenance_cost_percentage", costConfig.maintenanceCostPercentage.toString()),
        dataManager.saveSystemSetting("min_stock_level", stockConfig.minStockLevel.toString()),
        dataManager.saveSystemSetting("max_stock_level", stockConfig.maxStockLevel.toString()),
        dataManager.saveSystemSetting("reorder_point", stockConfig.reorderPoint.toString()),
        dataManager.saveSystemSetting("safety_stock", stockConfig.safetyStock.toString()),
        dataManager.saveSystemSetting("empresarial_value", empresarialValue.toString()),
      ]);

      const allSuccess = results.every(result => result === true);

      if (allSuccess) {
        setLastUpdated(new Date().toLocaleString("pt-BR"));
        setSaveStatus({
          empresarialProfit: 'success',
          cost: 'success',
          stock: 'success',
        });
        console.log("✅ [SettingsDashboard] Todas as configurações salvas com sucesso");
        setTimeout(() => {
          setSaveStatus({
            empresarialProfit: 'idle',
            cost: 'idle',
            stock: 'idle',
          });
        }, 3000);
      } else {
        console.error("❌ [SettingsDashboard] Algumas configurações falharam ao salvar");
        setSaveStatus({
          empresarialProfit: 'error',
          cost: 'error',
          stock: 'error',
        });
        setTimeout(() => {
          setSaveStatus({
            empresarialProfit: 'idle',
            cost: 'idle',
            stock: 'idle',
          });
        }, 5000);
      }
    } catch (error) {
      console.error("❌ [SettingsDashboard] Erro ao salvar configurações:", error);
      setSaveStatus({
        empresarialProfit: 'error',
        cost: 'error',
        stock: 'error',
      });
      setTimeout(() => {
        setSaveStatus({
          empresarialProfit: 'idle',
          cost: 'idle',
          stock: 'idle',
        });
      }, 5000);
    }
  };

  // Função para gerar registro de balanço empresarial
  const generateEmpresarialBalance = async () => {
    try {
      setIsGeneratingBalance(true);

      console.log("💼 [SettingsDashboard] Gerando registro de balanço empresarial...");

      // Calcular o balanço atual baseado no valor empresarial
      const balanceEntry = {
        type: "entrada" as const,
        category: "balanco_empresarial" as const,
        reference_name: "Registro de Balanço Empresarial",
        amount: empresarialValue,
        description: `Registro automático de balanço empresarial. Valor base: R$ ${empresarialValue.toFixed(2)}`,
        transaction_date: new Date().toISOString(),
      };

      // Salvar entrada no cash flow
      const result = await dataManager.saveCashFlowEntry(balanceEntry);

      if (result) {
        console.log("✅ [SettingsDashboard] Balanço empresarial registrado com sucesso:", result);

        // Atualizar o timestamp de última atualização
        setLastUpdated(new Date().toLocaleString("pt-BR"));

        // Disparar evento personalizado para notificar outras partes do sistema
        const event = new CustomEvent('empresarialBalanceGenerated', {
          detail: {
            entry: result,
            empresarialValue: empresarialValue,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(event);
      } else {
        console.error("❌ [SettingsDashboard] Falha ao registrar balanço empresarial");
      }

    } catch (error) {
      console.error("❌ [SettingsDashboard] Erro ao gerar balanço empresarial:", error);
    } finally {
      setIsGeneratingBalance(false);
    }
  };


  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue flex items-center justify-center">
            <Settings className="h-4 w-4 text-white" />
          </div>
          Configurações do Sistema
        </h2>
        <p className="text-tire-300 mt-2">
          Gerencie todas as configurações do sistema de gestão empresarial
        </p>
      </div>

      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-factory-800/50">
          <TabsTrigger value="financial" className="data-[state=active]:bg-neon-purple/20">
            <DollarSign className="h-4 w-4 mr-2" />
            Financeiro
          </TabsTrigger>
          <TabsTrigger value="cost" className="data-[state=active]:bg-neon-blue/20">
            <Calculator className="h-4 w-4 mr-2" />
            Custos
          </TabsTrigger>
          <TabsTrigger value="stock" className="data-[state=active]:bg-neon-green/20">
            <Package className="h-4 w-4 mr-2" />
            Estoque
          </TabsTrigger>
        </TabsList>

        {/* Tab Financeiro (Lucro e Valor Empresarial) */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Custo Médio por Pneu */}
            <Card className="bg-factory-700/50 border-factory-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-factory-100">
                  Custo Médio por Pneu
                </CardTitle>
                <DollarSign className="h-4 w-4 text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tire-cost" className="text-factory-200">
                      Valor (R$)
                    </Label>
                    <Input
                      id="tire-cost"
                      type="number"
                      step="0.01"
                      value={costConfig.averageTireCost}
                      onChange={(e) =>
                        setCostConfig(prev => ({ ...prev, averageTireCost: Number(e.target.value) || 0 }))
                      }
                      className="bg-factory-800 border-factory-600 text-factory-100"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="text-2xl font-bold text-factory-100">
                    {formatCurrency(costConfig.averageTireCost)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Base de cálculo de custos
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Lucro Médio por Pneu */}
            <Card className="bg-factory-700/50 border-factory-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-factory-100">
                  Lucro Médio por Pneu
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tire-profit" className="text-factory-200">
                      Valor (%)
                    </Label>
                    <Input
                      id="tire-profit"
                      type="number"
                      step="0.01"
                      value={empresarialProfitConfig.tireProfitPercentage}
                      onChange={(e) =>
                        setEmpresarialProfitConfig(prev => ({ ...prev, tireProfitPercentage: Number(e.target.value) || 0 }))
                      }
                      className="bg-factory-800 border-factory-600 text-factory-100"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    {formatPercentage(empresarialProfitConfig.tireProfitPercentage)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Margem de lucro
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Lucro Médio Produtos Revenda */}
            <Card className="bg-factory-700/50 border-factory-600">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-factory-100">
                  Lucro Médio Revenda
                </CardTitle>
                <Package className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resale-profit" className="text-factory-200">
                      Valor (%)
                    </Label>
                    <Input
                      id="resale-profit"
                      type="number"
                      step="0.01"
                      value={empresarialProfitConfig.resaleProfitPercentage}
                      onChange={(e) =>
                        setEmpresarialProfitConfig(prev => ({ ...prev, resaleProfitPercentage: Number(e.target.value) || 0 }))
                      }
                      className="bg-factory-800 border-factory-600 text-factory-100"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="text-2xl font-bold text-blue-400">
                    {formatPercentage(empresarialProfitConfig.resaleProfitPercentage)}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Produtos de revenda
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Card de Valor Empresarial - Destacado */}
          <div className="mt-8">
            <Card className="bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500/50 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-bold text-blue-100 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-400" />
                  Valor Empresarial
                </CardTitle>
                <Badge variant="outline" className="text-blue-200 border-blue-400">
                  Base para Lucro Empresarial
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="empresarial-value" className="text-blue-200 font-medium">
                        Valor Base (R$)
                      </Label>
                      <Input
                        id="empresarial-value"
                        type="number"
                        step="0.01"
                        value={empresarialValue}
                        onChange={(e) => setEmpresarialValue(Number(e.target.value))}
                        className="bg-blue-900/30 border-blue-600 text-blue-100 text-lg font-semibold"
                        disabled={isLoading}
                        placeholder="Digite o valor empresarial"
                      />
                    </div>
                    <div className="text-3xl font-bold text-blue-300">
                      {formatCurrency(empresarialValue)}
                    </div>
                    <p className="text-sm text-blue-200/80">
                      Este valor será usado como base para calcular o lucro empresarial.
                      Valores positivos ou negativos são aceitos.
                    </p>
                  </div>

                  <div className="flex flex-col justify-center space-y-4">
                    <Button
                      onClick={generateEmpresarialBalance}
                      disabled={isGeneratingBalance || empresarialValue === 0}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center gap-2"
                      size="lg"
                    >
                      {isGeneratingBalance ? (
                        <>
                          <RefreshCw className="h-5 w-5 animate-spin" />
                          Gerando Registro...
                        </>
                      ) : (
                        <>
                          <FileText className="h-5 w-5" />
                          Gerar Registro de Balanço
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-blue-200/70 text-center">
                      Clique para registrar o balanço empresarial atual
                      e definir a base para o cálculo de lucros futuros.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Custos */}
        <TabsContent value="cost">
          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardHeader>
              <CardTitle className="text-tire-200 flex items-center">
                <Calculator className="h-5 w-5 mr-2 text-neon-blue" />
                Configuração de Custos
                <SaveStatus status={saveStatus.cost} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Custo Médio por Pneu já está no tab 'financial' */}

                {/* Custo de Mão de Obra */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Custo de Mão de Obra por Hora</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={costConfig.laborCostPerHour}
                      onChange={(e) =>
                        setCostConfig(prev => ({ ...prev, laborCostPerHour: parseFloat(e.target.value) || 0 }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">R$/h</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Valor: {formatCurrency(costConfig.laborCostPerHour)}/hora
                  </p>
                </div>

                {/* Custo de Eletricidade */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Custo de Eletricidade por kWh</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.001"
                      value={costConfig.electricityCostPerKwh}
                      onChange={(e) =>
                        setCostConfig(prev => ({ ...prev, electricityCostPerKwh: parseFloat(e.target.value) || 0 }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">R$/kWh</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Valor: {formatCurrency(costConfig.electricityCostPerKwh)}/kWh
                  </p>
                </div>

                {/* Custo de Manutenção */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Custo de Manutenção</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={costConfig.maintenanceCostPercentage}
                      onChange={(e) =>
                        setCostConfig(prev => ({ ...prev, maintenanceCostPercentage: parseFloat(e.target.value) || 0 }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">%</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Percentual: {formatPercentage(costConfig.maintenanceCostPercentage)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveCostConfig}
                  disabled={loadingStates.cost || saveStatus.cost === 'saving'}
                  className="bg-neon-blue hover:bg-neon-blue/80"
                >
                  {saveStatus.cost === 'saving' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações de Custos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Estoque */}
        <TabsContent value="stock">
          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardHeader>
              <CardTitle className="text-tire-200 flex items-center">
                <Package className="h-5 w-5 mr-2 text-neon-green" />
                Configuração de Estoque
                <SaveStatus status={saveStatus.stock} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nível Mínimo de Estoque */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Nível Mínimo de Estoque</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={stockConfig.minStockLevel}
                      onChange={(e) =>
                        setStockConfig(prev => ({ ...prev, minStockLevel: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">unidades</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Alerta quando estoque for menor que {stockConfig.minStockLevel} unidades
                  </p>
                </div>

                {/* Nível Máximo de Estoque */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Nível Máximo de Estoque</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={stockConfig.maxStockLevel}
                      onChange={(e) =>
                        setStockConfig(prev => ({ ...prev, maxStockLevel: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">unidades</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Limite máximo de {stockConfig.maxStockLevel} unidades por item
                  </p>
                </div>

                {/* Ponto de Reposição */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Ponto de Reposição</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={stockConfig.reorderPoint}
                      onChange={(e) =>
                        setStockConfig(prev => ({ ...prev, reorderPoint: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">unidades</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Realizar pedido quando estoque atingir {stockConfig.reorderPoint} unidades
                  </p>
                </div>

                {/* Estoque de Segurança */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Estoque de Segurança</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      value={stockConfig.safetyStock}
                      onChange={(e) =>
                        setStockConfig(prev => ({ ...prev, safetyStock: parseInt(e.target.value) || 0 }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">unidades</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Manter {stockConfig.safetyStock} unidades como reserva de segurança
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveStockConfig}
                  disabled={loadingStates.stock || saveStatus.stock === 'saving'}
                  className="bg-neon-green hover:bg-neon-green/80"
                >
                  {saveStatus.stock === 'saving' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações de Estoque
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ações Globais */}
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 flex items-center">
            <Factory className="h-5 w-5 mr-2 text-neon-orange" />
            Ações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={loadInitialSettings}
              variant="outline"
              className="border-tire-600/30 text-tire-200 hover:bg-factory-700/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Configurações
            </Button>

            <Button
              onClick={saveSettings}
              disabled={isLoading || saveStatus.empresarialProfit === 'saving' || saveStatus.cost === 'saving' || saveStatus.stock === 'saving'}
              className="bg-neon-purple hover:bg-neon-purple/80 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Todas as Configurações
            </Button>

            <Button
              onClick={onRefresh}
              variant="outline"
              className="border-tire-600/30 text-tire-200 hover:bg-factory-700/50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsDashboard;