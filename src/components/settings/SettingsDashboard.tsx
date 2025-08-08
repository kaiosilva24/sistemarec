
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

      console.log('✅ [SettingsDashboard] Configurações carregadas:', {
        tireProfitValue,
        resaleProfitValue,
        averageTireCost
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

      <Tabs defaultValue="empresarial-profit" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-factory-800/50">
          <TabsTrigger value="empresarial-profit" className="data-[state=active]:bg-neon-purple/20">
            <TrendingUp className="h-4 w-4 mr-2" />
            Lucro Empresarial
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

        {/* Tab de Lucro Empresarial */}
        <TabsContent value="empresarial-profit">
          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardHeader>
              <CardTitle className="text-tire-200 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-neon-purple" />
                Configuração de Lucro Empresarial
                <SaveStatus status={saveStatus.empresarialProfit} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Lucro por Pneu */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Lucro Médio por Pneu</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={empresarialProfitConfig.tireProfitPercentage}
                      onChange={(e) =>
                        setEmpresarialProfitConfig(prev => ({
                          ...prev,
                          tireProfitPercentage: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">R$</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Valor: {formatCurrency(empresarialProfitConfig.tireProfitPercentage)}
                  </p>
                </div>

                {/* Lucro de Produtos de Revenda */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Lucro Médio Produtos de Revenda</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={empresarialProfitConfig.resaleProfitPercentage}
                      onChange={(e) =>
                        setEmpresarialProfitConfig(prev => ({
                          ...prev,
                          resaleProfitPercentage: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">R$</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Valor: {formatCurrency(empresarialProfitConfig.resaleProfitPercentage)}
                  </p>
                </div>

                {/* Multiplicador de Custo de Produção */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Multiplicador de Custo de Produção</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={empresarialProfitConfig.productionCostMultiplier}
                      onChange={(e) =>
                        setEmpresarialProfitConfig(prev => ({
                          ...prev,
                          productionCostMultiplier: parseFloat(e.target.value) || 1
                        }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">×</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Fator: {empresarialProfitConfig.productionCostMultiplier.toFixed(2)}×
                  </p>
                </div>

                {/* Custo de Marketing */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Custo de Marketing</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={empresarialProfitConfig.marketingCostPercentage}
                      onChange={(e) =>
                        setEmpresarialProfitConfig(prev => ({
                          ...prev,
                          marketingCostPercentage: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">%</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Percentual: {formatPercentage(empresarialProfitConfig.marketingCostPercentage)}
                  </p>
                </div>

                {/* Custo Operacional */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Custo Operacional</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.1"
                      value={empresarialProfitConfig.operationalCostPercentage}
                      onChange={(e) =>
                        setEmpresarialProfitConfig(prev => ({
                          ...prev,
                          operationalCostPercentage: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">%</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Percentual: {formatPercentage(empresarialProfitConfig.operationalCostPercentage)}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={saveEmpresarialProfitConfig}
                  disabled={loadingStates.empresarialProfit || saveStatus.empresarialProfit === 'saving'}
                  className="bg-neon-purple hover:bg-neon-purple/80"
                >
                  {saveStatus.empresarialProfit === 'saving' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações de Lucro
                </Button>
              </div>
            </CardContent>
          </Card>
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
                {/* Custo Médio por Pneu */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Custo Médio por Pneu</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={costConfig.averageTireCost}
                      onChange={(e) =>
                        setCostConfig(prev => ({
                          ...prev,
                          averageTireCost: parseFloat(e.target.value) || 0
                        }))
                      }
                      className="bg-factory-700/50 border-tire-600/30 text-white"
                    />
                    <span className="text-tire-300 text-sm">R$</span>
                  </div>
                  <p className="text-tire-400 text-xs">
                    Valor: {formatCurrency(costConfig.averageTireCost)}
                  </p>
                </div>

                {/* Custo de Mão de Obra */}
                <div className="space-y-2">
                  <Label className="text-tire-300">Custo de Mão de Obra por Hora</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={costConfig.laborCostPerHour}
                      onChange={(e) =>
                        setCostConfig(prev => ({
                          ...prev,
                          laborCostPerHour: parseFloat(e.target.value) || 0
                        }))
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
                        setCostConfig(prev => ({
                          ...prev,
                          electricityCostPerKwh: parseFloat(e.target.value) || 0
                        }))
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
                        setCostConfig(prev => ({
                          ...prev,
                          maintenanceCostPercentage: parseFloat(e.target.value) || 0
                        }))
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
                        setStockConfig(prev => ({
                          ...prev,
                          minStockLevel: parseInt(e.target.value) || 0
                        }))
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
                        setStockConfig(prev => ({
                          ...prev,
                          maxStockLevel: parseInt(e.target.value) || 0
                        }))
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
                        setStockConfig(prev => ({
                          ...prev,
                          reorderPoint: parseInt(e.target.value) || 0
                        }))
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
                        setStockConfig(prev => ({
                          ...prev,
                          safetyStock: parseInt(e.target.value) || 0
                        }))
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
