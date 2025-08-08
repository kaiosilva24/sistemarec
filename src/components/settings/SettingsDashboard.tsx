
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  TrendingUp,
  Save,
  RotateCcw,
  Calculator,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { dataManager } from '../../utils/dataManager';

interface EmpresarialProfitSettings {
  enabled: boolean;
  calculationMethod: "automatic" | "manual";
  manualPercentage: number;
  includeStockValues: boolean;
  includeCashFlow: boolean;
  includeTireProfit: boolean;
  includeResaleProfit: boolean;
  minimumProfitThreshold: number;
  autoUpdateInterval: number; // em minutos
}

interface SettingsDashboardProps {
  isLoading?: boolean;
  onRefresh?: () => void;
}

const SettingsDashboard = ({ isLoading = false, onRefresh }: SettingsDashboardProps) => {
  const { toast } = useToast();
  
  // Estados para configurações de lucro empresarial
  const [profitSettings, setProfitSettings] = useState<EmpresarialProfitSettings>({
    enabled: true,
    calculationMethod: "automatic",
    manualPercentage: 15.0,
    includeStockValues: true,
    includeCashFlow: true,
    includeTireProfit: true,
    includeResaleProfit: true,
    minimumProfitThreshold: 1000.0,
    autoUpdateInterval: 5,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Carregar configurações iniciais
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      console.log('⚙️ [Settings] Carregando configurações...');
      
      // Carregar configurações do Supabase
      const settings = await dataManager.loadEmpresarialProfitSettings();
      if (settings) {
        setProfitSettings(settings);
        console.log('✅ [Settings] Configurações carregadas com sucesso');
      }
    } catch (error) {
      console.error('❌ [Settings] Erro ao carregar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar configurações. Usando valores padrão.",
        variant: "destructive",
      });
    }
  };

  const handleSettingChange = (key: keyof EmpresarialProfitSettings, value: any) => {
    setProfitSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      console.log('💾 [Settings] Salvando configurações...', profitSettings);

      // Salvar no Supabase
      const success = await dataManager.saveEmpresarialProfitSettings(profitSettings);
      
      if (success) {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
        
        toast({
          title: "Configurações Salvas",
          description: "As configurações de lucro empresarial foram salvas com sucesso.",
        });

        // Disparar evento para atualizar outros componentes
        const settingsUpdatedEvent = new CustomEvent('empresarialProfitSettingsUpdated', {
          detail: {
            settings: profitSettings,
            timestamp: Date.now(),
            source: 'SettingsDashboard'
          }
        });
        window.dispatchEvent(settingsUpdatedEvent);

        console.log('✅ [Settings] Configurações salvas com sucesso');
      } else {
        throw new Error('Falha ao salvar configurações');
      }
    } catch (error) {
      console.error('❌ [Settings] Erro ao salvar configurações:', error);
      toast({
        title: "Erro ao Salvar",
        description: "Erro ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    const defaultSettings: EmpresarialProfitSettings = {
      enabled: true,
      calculationMethod: "automatic",
      manualPercentage: 15.0,
      includeStockValues: true,
      includeCashFlow: true,
      includeTireProfit: true,
      includeResaleProfit: true,
      minimumProfitThreshold: 1000.0,
      autoUpdateInterval: 5,
    };

    setProfitSettings(defaultSettings);
    setHasUnsavedChanges(true);

    toast({
      title: "Configurações Resetadas",
      description: "As configurações foram resetadas para os valores padrão.",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-purple flex items-center justify-center">
              <Settings className="h-4 w-4 text-white" />
            </div>
            Configurações do Sistema
          </h1>
          <p className="text-tire-300 mt-1">
            Gerencie as configurações do sistema de gestão empresarial
          </p>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}
          
          {lastSavedAt && !hasUnsavedChanges && (
            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle className="h-3 w-3 mr-1" />
              Salvo às {lastSavedAt.toLocaleTimeString('pt-BR')}
            </Badge>
          )}

          <Button
            onClick={resetToDefaults}
            variant="outline"
            className="border-tire-600/50 text-tire-300 hover:bg-factory-700/50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>

          <Button
            onClick={saveSettings}
            disabled={!hasUnsavedChanges || isSaving}
            className="bg-gradient-to-r from-neon-green to-green-600 hover:from-green-600 hover:to-neon-green text-white"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Configurações de Lucro Empresarial */}
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-purple to-neon-green flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            Configurações de Lucro Empresarial
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Geral */}
          <div className="flex items-center justify-between p-4 bg-factory-700/30 rounded-lg">
            <div>
              <Label className="text-white font-medium">
                Ativar Cálculo de Lucro Empresarial
              </Label>
              <p className="text-tire-400 text-sm mt-1">
                Ativa ou desativa o sistema de cálculo de lucro empresarial
              </p>
            </div>
            <Switch
              checked={profitSettings.enabled}
              onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
            />
          </div>

          <Separator className="border-tire-600/30" />

          {/* Método de Cálculo */}
          <div className="space-y-4">
            <Label className="text-white font-medium text-lg">
              Método de Cálculo
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  profitSettings.calculationMethod === 'automatic'
                    ? 'bg-neon-blue/20 border-neon-blue/50'
                    : 'bg-factory-700/30 border-tire-600/30 hover:bg-factory-700/50'
                }`}
                onClick={() => handleSettingChange('calculationMethod', 'automatic')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calculator className="h-5 w-5 text-neon-blue" />
                    <div>
                      <h3 className="text-white font-medium">Automático</h3>
                      <p className="text-tire-400 text-sm">
                        Calcula baseado nos dados reais do sistema
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-200 ${
                  profitSettings.calculationMethod === 'manual'
                    ? 'bg-neon-purple/20 border-neon-purple/50'
                    : 'bg-factory-700/30 border-tire-600/30 hover:bg-factory-700/50'
                }`}
                onClick={() => handleSettingChange('calculationMethod', 'manual')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-neon-purple" />
                    <div>
                      <h3 className="text-white font-medium">Manual</h3>
                      <p className="text-tire-400 text-sm">
                        Define uma porcentagem fixa de lucro
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Configuração Manual */}
            {profitSettings.calculationMethod === 'manual' && (
              <div className="bg-factory-700/30 p-4 rounded-lg">
                <Label className="text-white font-medium">
                  Porcentagem de Lucro Manual (%)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={profitSettings.manualPercentage}
                  onChange={(e) => handleSettingChange('manualPercentage', parseFloat(e.target.value) || 0)}
                  className="mt-2 bg-factory-600/50 border-tire-600/30 text-white"
                />
                <p className="text-tire-400 text-sm mt-2">
                  Esta porcentagem será aplicada sobre o valor total dos ativos empresariais
                </p>
              </div>
            )}
          </div>

          <Separator className="border-tire-600/30" />

          {/* Componentes do Cálculo */}
          <div className="space-y-4">
            <Label className="text-white font-medium text-lg">
              Componentes do Cálculo Automático
            </Label>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Valores de Estoque */}
              <div className="flex items-center justify-between p-3 bg-factory-700/30 rounded-lg">
                <div>
                  <Label className="text-white">Valores de Estoque</Label>
                  <p className="text-tire-400 text-xs">
                    Inclui matéria-prima, produtos finais e revenda
                  </p>
                </div>
                <Switch
                  checked={profitSettings.includeStockValues}
                  onCheckedChange={(checked) => handleSettingChange('includeStockValues', checked)}
                />
              </div>

              {/* Fluxo de Caixa */}
              <div className="flex items-center justify-between p-3 bg-factory-700/30 rounded-lg">
                <div>
                  <Label className="text-white">Saldo de Caixa</Label>
                  <p className="text-tire-400 text-xs">
                    Inclui o saldo atual do fluxo de caixa
                  </p>
                </div>
                <Switch
                  checked={profitSettings.includeCashFlow}
                  onCheckedChange={(checked) => handleSettingChange('includeCashFlow', checked)}
                />
              </div>

              {/* Lucro de Pneus */}
              <div className="flex items-center justify-between p-3 bg-factory-700/30 rounded-lg">
                <div>
                  <Label className="text-white">Lucro de Pneus</Label>
                  <p className="text-tire-400 text-xs">
                    Inclui lucro médio por pneu produzido
                  </p>
                </div>
                <Switch
                  checked={profitSettings.includeTireProfit}
                  onCheckedChange={(checked) => handleSettingChange('includeTireProfit', checked)}
                />
              </div>

              {/* Lucro de Revenda */}
              <div className="flex items-center justify-between p-3 bg-factory-700/30 rounded-lg">
                <div>
                  <Label className="text-white">Lucro de Revenda</Label>
                  <p className="text-tire-400 text-xs">
                    Inclui lucro médio de produtos de revenda
                  </p>
                </div>
                <Switch
                  checked={profitSettings.includeResaleProfit}
                  onCheckedChange={(checked) => handleSettingChange('includeResaleProfit', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="border-tire-600/30" />

          {/* Configurações Avançadas */}
          <div className="space-y-4">
            <Label className="text-white font-medium text-lg">
              Configurações Avançadas
            </Label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Threshold Mínimo */}
              <div className="space-y-2">
                <Label className="text-white">
                  Threshold Mínimo de Lucro ({formatCurrency(profitSettings.minimumProfitThreshold)})
                </Label>
                <Input
                  type="number"
                  step="100"
                  min="0"
                  value={profitSettings.minimumProfitThreshold}
                  onChange={(e) => handleSettingChange('minimumProfitThreshold', parseFloat(e.target.value) || 0)}
                  className="bg-factory-600/50 border-tire-600/30 text-white"
                />
                <p className="text-tire-400 text-xs">
                  Valor mínimo considerado para alertas de lucro baixo
                </p>
              </div>

              {/* Intervalo de Atualização */}
              <div className="space-y-2">
                <Label className="text-white">
                  Intervalo de Atualização ({profitSettings.autoUpdateInterval} minutos)
                </Label>
                <Input
                  type="number"
                  step="1"
                  min="1"
                  max="60"
                  value={profitSettings.autoUpdateInterval}
                  onChange={(e) => handleSettingChange('autoUpdateInterval', parseInt(e.target.value) || 5)}
                  className="bg-factory-600/50 border-tire-600/30 text-white"
                />
                <p className="text-tire-400 text-xs">
                  Frequência de recálculo automático (1-60 minutos)
                </p>
              </div>
            </div>
          </div>

          {/* Informações do Sistema */}
          <div className="bg-neon-blue/10 border border-neon-blue/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-neon-blue mt-0.5" />
              <div>
                <h4 className="text-neon-blue font-medium">Informações do Sistema</h4>
                <p className="text-tire-300 text-sm mt-1">
                  O lucro empresarial é calculado em tempo real baseado nos dados do sistema.
                  As configurações são sincronizadas automaticamente entre todas as seções do dashboard.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview do Cálculo */}
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg">
            Preview do Cálculo de Lucro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-factory-700/30 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-5 w-5 text-neon-green" />
              <span className="text-white font-medium">Método: </span>
              <Badge variant="secondary" className={
                profitSettings.calculationMethod === 'automatic'
                  ? "bg-neon-blue/20 text-neon-blue"
                  : "bg-neon-purple/20 text-neon-purple"
              }>
                {profitSettings.calculationMethod === 'automatic' ? 'Automático' : 'Manual'}
              </Badge>
            </div>
            
            <div className="text-tire-300 text-sm space-y-1">
              {profitSettings.calculationMethod === 'automatic' ? (
                <>
                  <p>• Baseado em dados reais do sistema</p>
                  <p>• Inclui: {[
                    profitSettings.includeStockValues && 'Valores de Estoque',
                    profitSettings.includeCashFlow && 'Saldo de Caixa',
                    profitSettings.includeTireProfit && 'Lucro de Pneus',
                    profitSettings.includeResaleProfit && 'Lucro de Revenda'
                  ].filter(Boolean).join(', ')}</p>
                  <p>• Atualização a cada {profitSettings.autoUpdateInterval} minutos</p>
                </>
              ) : (
                <>
                  <p>• Porcentagem fixa: {profitSettings.manualPercentage}%</p>
                  <p>• Aplicada sobre o valor total dos ativos</p>
                </>
              )}
              <p>• Threshold mínimo: {formatCurrency(profitSettings.minimumProfitThreshold)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsDashboard;
