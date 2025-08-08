
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
  PlusCircle,
  Building,
  BarChart3,
  Calendar,
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
  // Estados para configurações de valor empresarial
  const [empresarialValueConfig, setEmpresarialValueConfig] = useState({
    currentBalance: 0,
    lastRegistrationDate: "",
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
    empresarialValue: false,
    cost: false,
    stock: false,
  });

  // Estados de status de salvamento
  const [saveStatus, setSaveStatus] = useState<{[key: string]: 'idle' | 'saving' | 'success' | 'error'}>({
    empresarialValue: 'idle',
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
      empresarialValue: true,
      cost: true,
      stock: true,
    });

    try {
      // Carregar configurações de valor empresarial
      const currentBalance = await dataManager.loadSystemSetting('empresarial_current_balance') || 0;
      const lastRegistrationDate = await dataManager.loadSystemSetting('empresarial_last_registration_date') || '';
      
      setEmpresarialValueConfig({
        currentBalance: parseFloat(currentBalance),
        lastRegistrationDate: lastRegistrationDate,
      });

      // Carregar configurações de custo
      const averageTireCost = await dataManager.loadAverageTireCost();
      setCostConfig(prev => ({
        ...prev,
        averageTireCost: averageTireCost,
      }));

      console.log('✅ [SettingsDashboard] Configurações carregadas:', {
        currentBalance,
        lastRegistrationDate,
        averageTireCost
      });

    } catch (error) {
      console.error('❌ [SettingsDashboard] Erro ao carregar configurações:', error);
    } finally {
      setLoadingStates({
        empresarialValue: false,
        cost: false,
        stock: false,
      });
    }
  };

  // Registrar novo balanço empresarial
  const registerEmpresarialBalance = async () => {
    setSaveStatus(prev => ({ ...prev, empresarialValue: 'saving' }));

    try {
      // Calcular o balanço atual baseado no fluxo de caixa
      const cashFlowEntries = await dataManager.getCashFlowEntries();
      
      const totalIncome = cashFlowEntries
        .filter(entry => entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const totalExpense = cashFlowEntries
        .filter(entry => entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);

      const currentBalance = totalIncome - totalExpense;
      const registrationDate = new Date().toISOString();

      // Salvar o balanço empresarial atual
      await dataManager.saveSystemSetting('empresarial_current_balance', currentBalance);
      await dataManager.saveSystemSetting('empresarial_last_registration_date', registrationDate);

      // Atualizar o estado local
      setEmpresarialValueConfig({
        currentBalance: currentBalance,
        lastRegistrationDate: registrationDate,
      });

      setSaveStatus(prev => ({ ...prev, empresarialValue: 'success' }));

      // Disparar evento para atualizar outros componentes
      const balanceEvent = new CustomEvent('empresarialBalanceUpdated', {
        detail: {
          balance: currentBalance,
          registrationDate: registrationDate,
          timestamp: Date.now(),
          source: 'SettingsDashboard'
        }
      });
      window.dispatchEvent(balanceEvent);

      console.log('✅ [SettingsDashboard] Balanço empresarial registrado com sucesso:', {
        currentBalance,
        registrationDate
      });
      
      // Reset status após 3 segundos
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, empresarialValue: 'idle' }));
      }, 3000);

    } catch (error) {
      console.error('❌ [SettingsDashboard] Erro ao registrar balanço empresarial:', error);
      setSaveStatus(prev => ({ ...prev, empresarialValue: 'error' }));
      
      // Reset status após 5 segundos
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, empresarialValue: 'idle' }));
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

      <Tabs defaultValue="empresarial-value" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-factory-800/50">
          <TabsTrigger value="empresarial-value" className="data-[state=active]:bg-neon-purple/20">
            <Building className="h-4 w-4 mr-2" />
            Valor Empresarial
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

        {/* Tab de Valor Empresarial */}
        <TabsContent value="empresarial-value">
          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardHeader>
              <CardTitle className="text-tire-200 flex items-center">
                <Building className="h-5 w-5 mr-2 text-neon-purple" />
                Valor Empresarial
                <SaveStatus status={saveStatus.empresarialValue} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card de Valor Empresarial Atual */}
                <Card className="bg-factory-700/50 border-neon-purple/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-neon-purple text-lg flex items-center">
                      <BarChart3 className="h-5 w-5 mr-2" />
                      Balanço Empresarial Atual
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${empresarialValueConfig.currentBalance >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                        {formatCurrency(empresarialValueConfig.currentBalance)}
                      </div>
                      {empresarialValueConfig.lastRegistrationDate && (
                        <div className="mt-2 flex items-center justify-center text-sm text-tire-300">
                          <Calendar className="h-4 w-4 mr-1" />
                          Último registro: {new Date(empresarialValueConfig.lastRegistrationDate).toLocaleString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Botão de Registro */}
                <Card className="bg-factory-700/50 border-neon-blue/30">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-neon-blue text-lg flex items-center">
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Registrar Balanço
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-center items-center space-y-4">
                    <p className="text-tire-300 text-center text-sm">
                      Registre o balanço empresarial atual baseado no fluxo de caixa.
                      Este valor será usado como base para cálculo do lucro empresarial.
                    </p>
                    <Button
                      onClick={registerEmpresarialBalance}
                      disabled={loadingStates.empresarialValue || saveStatus.empresarialValue === 'saving'}
                      className="bg-neon-purple hover:bg-neon-purple/80 w-full"
                      size="lg"
                    >
                      {saveStatus.empresarialValue === 'saving' ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlusCircle className="h-4 w-4 mr-2" />
                      )}
                      Registrar Balanço Atual
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="mt-6 p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/30">
                <h4 className="text-neon-purple font-medium mb-2">Como funciona o Valor Empresarial:</h4>
                <ul className="text-tire-300 text-sm space-y-1">
                  <li>• O balanço registrado serve como base para o cálculo do lucro empresarial</li>
                  <li>• Valores positivos ou negativos são aceitos</li>
                  <li>• A partir deste registro, todas as movimentações futuras serão calculadas como lucro/prejuízo</li>
                  <li>• Recomenda-se registrar o balanço periodicamente para manter a precisão</li>
                </ul>
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
