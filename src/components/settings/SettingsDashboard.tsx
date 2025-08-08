
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
    cost: false,
    stock: false,
  });

  // Estados de status de salvamento
  const [saveStatus, setSaveStatus] = useState<{[key: string]: 'idle' | 'saving' | 'success' | 'error'}>({
    cost: 'idle',
    stock: 'idle',
  });

  // Estado para valor empresarial
  const [businessValue, setBusinessValue] = useState<number>(0);
  const [isLoadingBusinessValue, setIsLoadingBusinessValue] = useState(true);

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
    loadBusinessValue();
  }, []);

  // Carregar valor empresarial
  const loadBusinessValue = async () => {
    setIsLoadingBusinessValue(true);
    try {
      const value = await dataManager.loadBusinessValue();
      setBusinessValue(value);
    } catch (error) {
      console.error('❌ [SettingsDashboard] Erro ao carregar valor empresarial:', error);
    } finally {
      setIsLoadingBusinessValue(false);
    }
  };

  const loadInitialSettings = async () => {
    setLoadingStates({
      cost: true,
      stock: true,
    });

    try {
      // Carregar configurações de custo
      const averageTireCost = await dataManager.loadAverageTireCost();
      setCostConfig(prev => ({
        ...prev,
        averageTireCost: averageTireCost,
      }));

      console.log('✅ [SettingsDashboard] Configurações carregadas:', {
        averageTireCost
      });

    } catch (error) {
      console.error('❌ [SettingsDashboard] Erro ao carregar configurações:', error);
    } finally {
      setLoadingStates({
        cost: false,
        stock: false,
      });
    }
  };

  // Effect para sincronização em tempo real do valor empresarial
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const initializeBusinessValueSync = async () => {
      try {
        console.log('🔄 [SettingsDashboard] Inicializando sincronização em tempo real do valor empresarial...');

        // Carregar valor inicial do Supabase
        const initialValue = await dataManager.loadBusinessValue();
        console.log(`🔍 [SettingsDashboard] Valor inicial do valor empresarial: R$ ${initialValue.toFixed(2)}`);

        setBusinessValue(initialValue);
        setIsLoadingBusinessValue(false);

        console.log(`✅ [SettingsDashboard] Valor inicial carregado: R$ ${initialValue.toFixed(2)}`);

        // Configurar subscription em tempo real
        unsubscribe = dataManager.subscribeToBusinessValueChanges((newValue) => {
          console.log(`📡 [SettingsDashboard] Novo valor empresarial recebido via subscription: R$ ${newValue.toFixed(2)}`);
          setBusinessValue(newValue);
        });

        console.log('🔔 [SettingsDashboard] Subscription ativa para mudanças de valor empresarial em tempo real');

      } catch (error) {
        console.error('❌ [SettingsDashboard] Erro ao configurar sincronização do valor empresarial:', error);
        setIsLoadingBusinessValue(false);

        // Fallback para valor 0 em caso de erro
        setBusinessValue(0);
      }
    };

    // Listener para evento customizado de atualização do valor empresarial
    const handleBusinessValueUpdate = (event: CustomEvent) => {
      const { value, timestamp, source } = event.detail;
      console.log(`💰 [SettingsDashboard] Evento 'businessValueUpdated' recebido:`);
      console.log(`  - Valor Empresarial: R$ ${value.toFixed(2)}`);
      console.log(`  - Timestamp: ${new Date(timestamp).toLocaleString()}`);
      console.log(`  - Source: ${source}`);

      // Atualizar estado imediatamente
      setBusinessValue(value);
      setIsLoadingBusinessValue(false);
    };

    console.log('🎯 [SettingsDashboard] Registrando listener para evento businessValueUpdated');

    // Adicionar listener para o evento customizado
    window.addEventListener('businessValueUpdated', handleBusinessValueUpdate as EventListener);

    initializeBusinessValueSync();

    // Cleanup subscription e listener
    return () => {
      if (unsubscribe) {
        console.log('🔕 [SettingsDashboard] Cancelando subscription do valor empresarial');
        unsubscribe();
      }
      
      console.log('🚫 [SettingsDashboard] Removendo listener para evento businessValueUpdated');
      window.removeEventListener('businessValueUpdated', handleBusinessValueUpdate as EventListener);
    };
  }, []);

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

      <Tabs defaultValue="cost" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-factory-800/50">
          <TabsTrigger value="cost" className="data-[state=active]:bg-neon-blue/20">
            <Calculator className="h-4 w-4 mr-2" />
            Custos
          </TabsTrigger>
          <TabsTrigger value="stock" className="data-[state=active]:bg-neon-green/20">
            <Package className="h-4 w-4 mr-2" />
            Estoque
          </TabsTrigger>
          <TabsTrigger value="business" className="data-[state=active]:bg-neon-purple/20">
            <TrendingUp className="h-4 w-4 mr-2" />
            Lucro Empresarial
          </TabsTrigger>
        </TabsList>

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

        {/* Tab de Lucro Empresarial */}
        <TabsContent value="business">
          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardHeader>
              <CardTitle className="text-tire-200 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-neon-purple" />
                Valor Empresarial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <Card className="bg-factory-700/50 border-tire-600/30 hover:shadow-lg transition-all duration-200 w-full max-w-md">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-tire-300 text-sm font-medium">Valor Empresarial</p>
                        <p className="text-2xl font-bold text-tire-200">
                          {isLoadingBusinessValue ? (
                            <span className="animate-pulse">Carregando...</span>
                          ) : (
                            formatCurrency(businessValue)
                          )}
                        </p>
                        <p className="text-tire-400 text-xs mt-1">
                          Sincronizado em tempo real
                        </p>
                      </div>
                      <div className="p-3 rounded-full bg-neon-purple/20">
                        <DollarSign className="h-6 w-6 text-neon-purple" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-center text-tire-400 text-sm">
                <p>Este valor é sincronizado automaticamente com o dashboard principal.</p>
                <p>Qualquer alteração será refletida em tempo real.</p>
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
