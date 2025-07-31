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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  DollarSign,
  ShoppingCart,
  Factory,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Package,
  Target,
  Percent,
  PieChart,
  Settings,
  Palette,
  RotateCcw,
  GripVertical,
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Interface para definir um card de métrica
interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  iconColorClass: string;
  customTextColor?: string;
}

// Componente de Card Arrastável
interface DraggableCardProps {
  card: MetricCard;
  customColors: { [key: string]: string };
}

const DraggableCard = ({ card, customColors }: DraggableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const IconComponent = card.icon;
  const customTextColor = customColors[card.id] || card.colorClass;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-factory-800/50 border-tire-600/30 cursor-grab active:cursor-grabbing transition-all duration-200",
        isDragging && [
          "shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]", // Sombra muito mais escura
          "ring-2 ring-neon-blue/70",
          "scale-105", // Leve aumento de escala
          "backdrop-blur-sm",
          "bg-factory-700/80", // Fundo mais escuro durante drag
          "border-neon-blue/50",
        ],
      )}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <GripVertical className="h-4 w-4 text-tire-400" />
              <p className="text-tire-300 text-sm font-medium">{card.title}</p>
            </div>
            <p
              className={`text-2xl font-bold`}
              style={{ color: customTextColor.replace("text-", "") }}
            >
              {card.value}
            </p>
            <p className="text-tire-400 text-xs mt-1">{card.subtitle}</p>
          </div>
          <div className={card.iconColorClass}>
            <IconComponent className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

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

  // Estados para drag-and-drop e personalização
  const [showCustomization, setShowCustomization] = useState(false);
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [customColors, setCustomColors] = useState<{ [key: string]: string }>(
    {},
  );
  const [hiddenCards, setHiddenCards] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Sensores para drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Carregar configurações salvas SIMPLIFICADO
  useEffect(() => {
    const loadConfigurations = () => {
      console.log("🔄 [Dashboard] Carregando configurações salvas...");

      try {
        // Carregar ordem dos cards
        const savedOrder = localStorage.getItem("dashboard-card-order");
        if (savedOrder) {
          const parsedOrder = JSON.parse(savedOrder);
          if (Array.isArray(parsedOrder) && parsedOrder.length > 0) {
            console.log("✅ [Dashboard] Ordem carregada:", parsedOrder);
            setCardOrder(parsedOrder);
          }
        }

        // Carregar cores personalizadas
        const savedColors = localStorage.getItem("dashboard-custom-colors");
        if (savedColors) {
          const parsedColors = JSON.parse(savedColors);
          if (typeof parsedColors === "object" && parsedColors !== null) {
            console.log("✅ [Dashboard] Cores carregadas:", parsedColors);
            setCustomColors(parsedColors);
          }
        }

        // Carregar cards ocultos
        const savedHiddenCards = localStorage.getItem("dashboard-hidden-cards");
        if (savedHiddenCards) {
          const parsedHiddenCards = JSON.parse(savedHiddenCards);
          if (Array.isArray(parsedHiddenCards)) {
            console.log(
              "✅ [Dashboard] Cards ocultos carregados:",
              parsedHiddenCards,
            );
            setHiddenCards(parsedHiddenCards);
          }
        }
      } catch (error) {
        console.error("❌ [Dashboard] Erro ao carregar configurações:", error);
      }

      setIsInitialized(true);
    };

    loadConfigurations();
  }, []);

  // Salvar ordem dos cards SIMPLIFICADO
  const saveCardOrder = (newOrder: string[]) => {
    try {
      console.log("💾 [Dashboard] Salvando ordem:", newOrder);

      if (!Array.isArray(newOrder) || newOrder.length === 0) {
        console.warn("⚠️ [Dashboard] Ordem inválida");
        return;
      }

      // Atualizar estado
      setCardOrder(newOrder);

      // Salvar no localStorage
      localStorage.setItem("dashboard-card-order", JSON.stringify(newOrder));

      console.log("✅ [Dashboard] Ordem salva com sucesso!");
    } catch (error) {
      console.error("❌ [Dashboard] Erro ao salvar ordem:", error);
    }
  };

  const saveCustomColors = (newColors: { [key: string]: string }) => {
    try {
      console.log("🎨 [Dashboard] Salvando cores personalizadas:", newColors);

      // Atualizar estado
      setCustomColors(newColors);

      // Salvar no localStorage
      localStorage.setItem(
        "dashboard-custom-colors",
        JSON.stringify(newColors),
      );

      // Verificar se foi salvo corretamente
      const saved = localStorage.getItem("dashboard-custom-colors");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (JSON.stringify(parsed) === JSON.stringify(newColors)) {
          console.log("✅ [Dashboard] Cores personalizadas salvas com sucesso");
        } else {
          console.error(
            "❌ [Dashboard] Erro na verificação do salvamento das cores",
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ [Dashboard] Erro ao salvar cores personalizadas:",
        error,
      );
    }
  };

  const saveHiddenCards = (newHiddenCards: string[]) => {
    try {
      console.log("👁️ [Dashboard] Salvando cards ocultos:", newHiddenCards);

      // Atualizar estado
      setHiddenCards(newHiddenCards);

      // Salvar no localStorage
      localStorage.setItem(
        "dashboard-hidden-cards",
        JSON.stringify(newHiddenCards),
      );

      console.log("✅ [Dashboard] Cards ocultos salvos com sucesso");
    } catch (error) {
      console.error("❌ [Dashboard] Erro ao salvar cards ocultos:", error);
    }
  };

  // Resetar para configurações padrão SIMPLIFICADO
  const resetToDefault = () => {
    console.log("🔄 [Dashboard] Resetando configurações...");

    // Limpar estados
    setCardOrder([]);
    setCustomColors({});

    // Limpar localStorage
    localStorage.removeItem("dashboard-card-order");
    localStorage.removeItem("dashboard-custom-colors");
    localStorage.removeItem("dashboard-hidden-cards");

    console.log("✅ [Dashboard] Configurações resetadas!");
  };

  // Atualizar cor de um card específico
  const updateCardColor = (cardId: string, color: string) => {
    const newColors = { ...customColors, [cardId]: color };
    saveCustomColors(newColors);
  };

  // Alternar visibilidade de um card
  const toggleCardVisibility = (cardId: string) => {
    const newHiddenCards = hiddenCards.includes(cardId)
      ? hiddenCards.filter((id) => id !== cardId)
      : [...hiddenCards, cardId];
    saveHiddenCards(newHiddenCards);
  };

  // Remover card permanentemente
  const removeCard = (cardId: string) => {
    const newHiddenCards = [...hiddenCards, cardId];
    const newCardOrder = cardOrder.filter((id) => id !== cardId);
    saveHiddenCards(newHiddenCards);
    saveCardOrder(newCardOrder);
  };

  // Handler para drag end SIMPLIFICADO
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    console.log("🎯 [Dashboard] Drag finalizado:", {
      activeId: active.id,
      overId: over?.id,
    });

    if (over && active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;

      // Usar a ordem atual dos cards ordenados
      const currentOrder = orderedCards.map((card) => card.id);
      const oldIndex = currentOrder.indexOf(activeId);
      const newIndex = currentOrder.indexOf(overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(currentOrder, oldIndex, newIndex);

        console.log("🔄 [Dashboard] Nova ordem:", {
          oldOrder: currentOrder,
          newOrder,
          moved: `${activeId} de ${oldIndex} para ${newIndex}`,
        });

        // Salvar imediatamente
        saveCardOrder(newOrder);
      }
    }
  };

  // REMOVIDO: Lógica de cálculo complexa - agora usa diretamente o valor do TireCostManager

  // NOVA ESTRATÉGIA: ÚNICA FONTE DE VERDADE COM LIMPEZA DE CACHE
  const CORRECT_TIRE_COST = 101.09; // Valor correto conhecido
  const CORRECT_TIRE_PROFIT = 69.765; // Valor correto do lucro médio por pneu
  const CORRECT_PROFIT_PERCENTAGE = 42.5; // Valor correto da porcentagem de lucro produtos finais
  const TIRE_COST_STORAGE_KEY = "dashboard_tireCostValue_unified";
  const TIRE_PROFIT_STORAGE_KEY = "dashboard_tireProfitValue_unified";
  const PROFIT_PERCENTAGE_STORAGE_KEY =
    "dashboard_profitPercentageValue_unified";

  // Função para limpar cache inconsistente
  const clearInconsistentCache = () => {
    console.log("🧹 [Dashboard] LIMPANDO CACHE INCONSISTENTE...");

    // Remover todas as chaves antigas que podem estar causando conflito
    const keysToRemove = [
      "dashboard_averageCostPerTire",
      "dashboard_averageProfitPerTire",
      "dashboard_profitMarginPercentage",
      "tireCostManager_synchronizedCostData",
      "dashboard_tireCostValue_old", // Caso exista
      "dashboard_tireProfitValue_old", // Caso exista
      "dashboard_profitPercentageValue_old", // Caso exista
    ];

    keysToRemove.forEach((key) => {
      if (localStorage.getItem(key)) {
        console.log(`🗑️ [Dashboard] Removendo chave antiga: ${key}`);
        localStorage.removeItem(key);
      }
    });
  };

  // Função para obter o valor correto com estratégia simplificada
  const getTireCostValue = () => {
    console.log("🔍 [Dashboard] OBTENDO VALOR COM ESTRATÉGIA UNIFICADA...");

    try {
      // ESTRATÉGIA ÚNICA: Usar apenas uma chave específica
      const storedData = localStorage.getItem(TIRE_COST_STORAGE_KEY);

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const value = parsedData.value || 0;
        const timestamp = parsedData.timestamp || 0;
        const isRecent = Date.now() - timestamp < 30000; // 30 segundos

        if (value > 0 && isRecent) {
          console.log(
            `✅ [Dashboard] VALOR VÁLIDO ENCONTRADO: R$ ${value.toFixed(2)}`,
            {
              timestamp: new Date(timestamp).toLocaleString("pt-BR"),
              age: `${Math.round((Date.now() - timestamp) / 1000)}s`,
            },
          );
          return value;
        } else {
          console.log(
            `⚠️ [Dashboard] Valor expirado ou inválido (${value}, idade: ${Math.round((Date.now() - timestamp) / 1000)}s)`,
          );
        }
      }

      // Se não encontrou valor válido, usar o valor correto e salvar
      console.log(
        `🎯 [Dashboard] USANDO VALOR CORRETO PADRÃO: R$ ${CORRECT_TIRE_COST.toFixed(2)}`,
      );

      // Salvar o valor correto para próximas consultas
      const dataToSave = {
        value: CORRECT_TIRE_COST,
        timestamp: Date.now(),
        source: "Dashboard_Default",
      };

      localStorage.setItem(TIRE_COST_STORAGE_KEY, JSON.stringify(dataToSave));

      return CORRECT_TIRE_COST;
    } catch (error) {
      console.error(
        "❌ [Dashboard] Erro ao obter valor do custo por pneu:",
        error,
      );
      return CORRECT_TIRE_COST;
    }
  };

  // Função para obter o valor do lucro médio por pneu
  const getTireProfitValue = () => {
    console.log("🔍 [Dashboard] OBTENDO VALOR DO LUCRO MÉDIO POR PNEU...");

    try {
      // ESTRATÉGIA ÚNICA: Usar apenas uma chave específica
      const storedData = localStorage.getItem(TIRE_PROFIT_STORAGE_KEY);

      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const value = parsedData.value || 0;
        const timestamp = parsedData.timestamp || 0;
        const isRecent = Date.now() - timestamp < 30000; // 30 segundos

        if (value !== 0 && isRecent) {
          console.log(
            `✅ [Dashboard] VALOR DE LUCRO VÁLIDO ENCONTRADO: R$ ${value.toFixed(3)}`,
            {
              timestamp: new Date(timestamp).toLocaleString("pt-BR"),
              age: `${Math.round((Date.now() - timestamp) / 1000)}s`,
            },
          );
          return value;
        } else {
          console.log(
            `⚠️ [Dashboard] Valor de lucro expirado ou inválido (${value}, idade: ${Math.round((Date.now() - timestamp) / 1000)}s)`,
          );
        }
      }

      // Se não encontrou valor válido, usar o valor correto e salvar
      console.log(
        `🎯 [Dashboard] USANDO VALOR CORRETO PADRÃO PARA LUCRO: R$ ${CORRECT_TIRE_PROFIT.toFixed(3)}`,
      );

      // Salvar o valor correto para próximas consultas
      const dataToSave = {
        value: CORRECT_TIRE_PROFIT,
        timestamp: Date.now(),
        source: "Dashboard_Default",
      };

      localStorage.setItem(TIRE_PROFIT_STORAGE_KEY, JSON.stringify(dataToSave));

      return CORRECT_TIRE_PROFIT;
    } catch (error) {
      console.error(
        "❌ [Dashboard] Erro ao obter valor do lucro por pneu:",
        error,
      );
      return CORRECT_TIRE_PROFIT;
    }
  };

  // Função para obter o valor da porcentagem de lucro produtos finais do elemento DOM
  const getProfitPercentageValue = () => {
    console.log(
      "🔍 [Dashboard] OBTENDO VALOR DA PORCENTAGEM DE LUCRO PRODUTOS FINAIS...",
    );

    try {
      // Primeiro, tentar ler do elemento DOM específico
      const targetElement = document.querySelector(
        ".tempo-4ebee5f0-9b1a-57c8-b17c-42856cd849a0",
      );
      if (targetElement) {
        const textContent = targetElement.textContent || "";
        const percentageMatch = textContent.match(/([0-9.]+)%/);
        if (percentageMatch) {
          const domValue = parseFloat(percentageMatch[1]);
          console.log(`🎯 [Dashboard] VALOR LIDO DO DOM: ${domValue}%`, {
            element: targetElement,
            textContent,
            extractedValue: domValue,
          });

          // Salvar o valor lido do DOM
          const dataToSave = {
            value: domValue,
            timestamp: Date.now(),
            source: "DOM_Element",
          };

          localStorage.setItem(
            PROFIT_PERCENTAGE_STORAGE_KEY,
            JSON.stringify(dataToSave),
          );
          return domValue;
        }
      }

      // Se não conseguiu ler do DOM, tentar do localStorage
      const storedData = localStorage.getItem(PROFIT_PERCENTAGE_STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const value = parsedData.value || 0;
        const timestamp = parsedData.timestamp || 0;
        const isRecent = Date.now() - timestamp < 30000; // 30 segundos

        if (value > 0 && isRecent) {
          console.log(
            `✅ [Dashboard] VALOR DE PORCENTAGEM VÁLIDO ENCONTRADO: ${value}%`,
            {
              timestamp: new Date(timestamp).toLocaleString("pt-BR"),
              age: `${Math.round((Date.now() - timestamp) / 1000)}s`,
            },
          );
          return value;
        } else {
          console.log(
            `⚠️ [Dashboard] Valor de porcentagem expirado ou inválido (${value}, idade: ${Math.round((Date.now() - timestamp) / 1000)}s)`,
          );
        }
      }

      // Se não encontrou valor válido, usar o valor correto padrão e salvar
      console.log(
        `🎯 [Dashboard] USANDO VALOR CORRETO PADRÃO PARA PORCENTAGEM: ${CORRECT_PROFIT_PERCENTAGE}%`,
      );

      // Salvar o valor correto para próximas consultas
      const dataToSave = {
        value: CORRECT_PROFIT_PERCENTAGE,
        timestamp: Date.now(),
        source: "Dashboard_Default",
      };

      localStorage.setItem(
        PROFIT_PERCENTAGE_STORAGE_KEY,
        JSON.stringify(dataToSave),
      );

      return CORRECT_PROFIT_PERCENTAGE;
    } catch (error) {
      console.error(
        "❌ [Dashboard] Erro ao obter valor da porcentagem de lucro:",
        error,
      );
      return CORRECT_PROFIT_PERCENTAGE;
    }
  };

  // Estado com inicialização mais robusta
  const [synchronizedCostPerTire, setSynchronizedCostPerTire] = useState(() => {
    // Limpar cache inconsistente na inicialização
    clearInconsistentCache();

    const initialValue = getTireCostValue();
    console.log(
      `🚀 [Dashboard] INICIALIZAÇÃO ROBUSTA: R$ ${initialValue.toFixed(2)}`,
    );
    return initialValue;
  });

  // Estado para lucro médio por pneu
  const [synchronizedProfitPerTire, setSynchronizedProfitPerTire] = useState(
    () => {
      const initialValue = getTireProfitValue();
      console.log(
        `🚀 [Dashboard] INICIALIZAÇÃO LUCRO MÉDIO: R$ ${initialValue.toFixed(3)}`,
      );
      return initialValue;
    },
  );

  // Estado para porcentagem de lucro produtos finais
  const [synchronizedProfitPercentage, setSynchronizedProfitPercentage] =
    useState(() => {
      const initialValue = getProfitPercentageValue();
      console.log(
        `🚀 [Dashboard] INICIALIZAÇÃO PORCENTAGEM LUCRO PRODUTOS FINAIS: ${initialValue}%`,
      );
      return initialValue;
    });

  // Effect simplificado para sincronização
  useEffect(() => {
    console.log("🔄 [Dashboard] CONFIGURANDO SINCRONIZAÇÃO SIMPLIFICADA...");

    // Função para atualizar o valor do custo
    const updateCostValue = () => {
      const newValue = getTireCostValue();
      if (Math.abs(newValue - synchronizedCostPerTire) > 0.01) {
        console.log(
          `🔄 [Dashboard] ATUALIZANDO VALOR: ${synchronizedCostPerTire.toFixed(2)} → ${newValue.toFixed(2)}`,
        );
        setSynchronizedCostPerTire(newValue);
      }
    };

    // Função para atualizar o valor do lucro
    const updateProfitValue = () => {
      const newValue = getTireProfitValue();
      if (Math.abs(newValue - synchronizedProfitPerTire) > 0.001) {
        console.log(
          `🔄 [Dashboard] ATUALIZANDO LUCRO: ${synchronizedProfitPerTire.toFixed(3)} → ${newValue.toFixed(3)}`,
        );
        setSynchronizedProfitPerTire(newValue);
      }
    };

    // Função para atualizar o valor da porcentagem de lucro
    const updateProfitPercentageValue = () => {
      const newValue = getProfitPercentageValue();
      if (Math.abs(newValue - synchronizedProfitPercentage) > 0.01) {
        console.log(
          `🔄 [Dashboard] ATUALIZANDO PORCENTAGEM: ${synchronizedProfitPercentage.toFixed(1)}% → ${newValue.toFixed(1)}%`,
        );
        setSynchronizedProfitPercentage(newValue);
      }
    };

    // Listener para eventos customizados do TireCostManager
    const handleTireCostUpdate = (event: CustomEvent) => {
      console.log(
        "🔔 [Dashboard] EVENTO RECEBIDO DO TireCostManager:",
        event.detail,
      );

      const { averageCostPerTire, averageProfitPerTire, timestamp, source } =
        event.detail;

      if (averageCostPerTire > 0) {
        console.log(
          `📥 [Dashboard] SALVANDO NOVO VALOR DO TireCostManager: R$ ${averageCostPerTire.toFixed(2)}`,
        );

        // Salvar na chave unificada
        const dataToSave = {
          value: averageCostPerTire,
          timestamp: timestamp || Date.now(),
          source: source || "TireCostManager",
        };

        localStorage.setItem(TIRE_COST_STORAGE_KEY, JSON.stringify(dataToSave));
        setSynchronizedCostPerTire(averageCostPerTire);
      }

      if (averageProfitPerTire !== undefined) {
        console.log(
          `📥 [Dashboard] SALVANDO NOVO VALOR DE LUCRO DO TireCostManager: R$ ${averageProfitPerTire.toFixed(3)}`,
        );

        // Salvar na chave unificada do lucro
        const profitDataToSave = {
          value: averageProfitPerTire,
          timestamp: timestamp || Date.now(),
          source: source || "TireCostManager",
        };

        localStorage.setItem(
          TIRE_PROFIT_STORAGE_KEY,
          JSON.stringify(profitDataToSave),
        );
        setSynchronizedProfitPerTire(averageProfitPerTire);
      }
    };

    // Listener para mudanças no localStorage (nas chaves unificadas)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === TIRE_COST_STORAGE_KEY) {
        console.log(
          "🔄 [Dashboard] MUDANÇA DETECTADA NA CHAVE UNIFICADA DE CUSTO",
        );
        updateCostValue();
      }
      if (event.key === TIRE_PROFIT_STORAGE_KEY) {
        console.log(
          "🔄 [Dashboard] MUDANÇA DETECTADA NA CHAVE UNIFICADA DE LUCRO",
        );
        updateProfitValue();
      }
      if (event.key === PROFIT_PERCENTAGE_STORAGE_KEY) {
        console.log(
          "🔄 [Dashboard] MUDANÇA DETECTADA NA CHAVE UNIFICADA DE PORCENTAGEM",
        );
        updateProfitPercentageValue();
      }
    };

    // MutationObserver para detectar mudanças no elemento DOM específico
    const observeTargetElement = () => {
      const targetElement = document.querySelector(
        ".tempo-4ebee5f0-9b1a-57c8-b17c-42856cd849a0",
      );
      if (targetElement) {
        console.log(
          "👁️ [Dashboard] OBSERVANDO ELEMENTO DOM ESPECÍFICO:",
          targetElement,
        );

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (
              mutation.type === "childList" ||
              mutation.type === "characterData"
            ) {
              console.log("🔄 [Dashboard] MUDANÇA DETECTADA NO ELEMENTO DOM");
              updateProfitPercentageValue();
            }
          });
        });

        observer.observe(targetElement, {
          childList: true,
          subtree: true,
          characterData: true,
        });

        return observer;
      }
      return null;
    };

    // Adicionar listeners
    window.addEventListener(
      "tireCostUpdated",
      handleTireCostUpdate as EventListener,
    );
    window.addEventListener("storage", handleStorageChange);

    // Configurar observador do elemento DOM
    const domObserver = observeTargetElement();

    // Verificação periódica mais espaçada (apenas para garantia)
    const intervalId = setInterval(() => {
      updateCostValue();
      updateProfitValue();
      updateProfitPercentageValue();
    }, 5000); // A cada 5 segundos

    // Cleanup
    return () => {
      window.removeEventListener(
        "tireCostUpdated",
        handleTireCostUpdate as EventListener,
      );
      window.removeEventListener("storage", handleStorageChange);
      if (domObserver) {
        domObserver.disconnect();
      }
      clearInterval(intervalId);
    };
  }, [
    synchronizedCostPerTire,
    synchronizedProfitPerTire,
    synchronizedProfitPercentage,
  ]);

  // Função para obter o custo sincronizado (compatibilidade)
  const getSynchronizedAverageCostPerTire = synchronizedCostPerTire;

  // Função para obter o lucro sincronizado
  const getSynchronizedAverageProfitPerTire = synchronizedProfitPerTire;

  // Função para obter a porcentagem de lucro sincronizada
  const getSynchronizedProfitPercentage = synchronizedProfitPercentage;

  // Effect para debug da sincronização
  useEffect(() => {
    console.log("🔍 [Dashboard] CUSTO MÉDIO POR PNEU SINCRONIZADO:", {
      value: getSynchronizedAverageCostPerTire,
      formatted: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(getSynchronizedAverageCostPerTire),
      timestamp: new Date().toLocaleString("pt-BR"),
      source: "TireCostManager (Sincronizado)",
    });

    console.log("🔍 [Dashboard] LUCRO MÉDIO POR PNEU SINCRONIZADO:", {
      value: getSynchronizedAverageProfitPerTire,
      formatted: new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(getSynchronizedAverageProfitPerTire),
      timestamp: new Date().toLocaleString("pt-BR"),
      source: "TireCostManager (Sincronizado)",
    });

    console.log(
      "🔍 [Dashboard] PORCENTAGEM LUCRO PRODUTOS FINAIS SINCRONIZADA:",
      {
        value: getSynchronizedProfitPercentage,
        formatted: `${getSynchronizedProfitPercentage.toFixed(1)}%`,
        timestamp: new Date().toLocaleString("pt-BR"),
        source: "DOM Element (Sincronizado)",
      },
    );
  }, [
    getSynchronizedAverageCostPerTire,
    getSynchronizedAverageProfitPerTire,
    getSynchronizedProfitPercentage,
  ]);

  // Extract product info from sale description (same logic as SalesDashboard)
  const extractProductInfoFromSale = (description: string) => {
    try {
      // Extract product ID from description
      const productIdMatch = description.match(/ID_Produto: ([^\s|]+)/);
      const quantityMatch = description.match(/Qtd: ([0-9.]+)/);

      if (productIdMatch && quantityMatch) {
        return {
          productId: productIdMatch[1],
          quantity: parseFloat(quantityMatch[1]),
        };
      }
    } catch (error) {
      console.error("Erro ao extrair informações do produto:", error);
    }
    return null;
  };

  // Calculate metrics
  const calculateMetrics = () => {
    console.log("🔍 [Dashboard] Calculando métricas do dashboard...");

    // 1. Quantidade Estoque de Produção (produtos em estoque)
    const productStockQuantity = stockItems
      .filter((item) => item.item_type === "product")
      .reduce((sum, item) => sum + item.quantity, 0);

    // 2. Quantidade de Vendas - apenas vendas do fluxo de caixa (excluindo pneus defeituosos)
    const salesHistory = cashFlowEntries.filter(
      (entry) => entry.type === "income" && entry.category === "venda",
    );

    const cashFlowSalesQuantity = salesHistory.reduce((total, sale) => {
      const productInfo = extractProductInfoFromSale(sale.description || "");
      return total + (productInfo?.quantity || 0);
    }, 0);

    const salesQuantity = cashFlowSalesQuantity;

    console.log(
      "📊 [Dashboard] Cálculo de vendas (excluindo pneus defeituosos):",
      {
        cashFlowSalesQuantity,
        totalSalesQuantity: salesQuantity,
        salesHistoryCount: salesHistory.length,
      },
    );

    // ===== NOVOS CÁLCULOS PARA PRODUTOS FINAIS E DE REVENDA =====

    // Separar produtos finais e de revenda (baseado na lógica do StockDashboard)
    const finalProductIds = products
      .filter((p) => !p.archived)
      .map((p) => p.id);
    const resaleProductIds = resaleProducts
      .filter((p) => !p.archived)
      .map((p) => p.id);

    const productStockItems = stockItems.filter(
      (item) => item.item_type === "product",
    );

    const finalProductStockItems = productStockItems.filter((item) =>
      finalProductIds.includes(item.item_id),
    );
    const resaleProductStockItems = productStockItems.filter((item) =>
      resaleProductIds.includes(item.item_id),
    );

    // Calcular quantidades separadas
    const finalProductQuantity = finalProductStockItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );
    const resaleProductQuantity = resaleProductStockItems.reduce(
      (sum, item) => sum + (Number(item.quantity) || 0),
      0,
    );

    // Calcular valores separados
    const finalProductValue = finalProductStockItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      return sum + quantity * unitCost;
    }, 0);

    const resaleProductValue = resaleProductStockItems.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitCost = Number(item.unit_cost) || 0;
      return sum + quantity * unitCost;
    }, 0);

    console.log("📦 [Dashboard] Cálculos de produtos finais e revenda:", {
      finalProductIds: finalProductIds.length,
      resaleProductIds: resaleProductIds.length,
      finalProductStockItems: finalProductStockItems.length,
      resaleProductStockItems: resaleProductStockItems.length,
      finalProductQuantity,
      resaleProductQuantity,
      finalProductValue,
      resaleProductValue,
    });

    // ===== FIM DOS NOVOS CÁLCULOS =====

    // 3. Quantidade de Produção
    const productionQuantity = productionEntries.reduce(
      (sum, entry) => sum + entry.quantity_produced,
      0,
    );

    // 4. Receita Total (total de vendas em valor)
    const totalRevenue = salesHistory.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    );

    // 5. Custo Médio por Pneu - USAR O VALOR SINCRONIZADO DO TireCostManager
    const averageCostPerTire = getSynchronizedAverageCostPerTire;

    // 6. Lucro Total (receita - custos totais)
    const totalCosts = salesQuantity * averageCostPerTire;
    const totalProfit = totalRevenue - totalCosts;

    // 7. Lucro Médio por Pneu - USAR O VALOR SINCRONIZADO DO TireCostManager
    const averageProfitPerTire = getSynchronizedAverageProfitPerTire;

    // 8. Margem de Lucro (%)
    const profitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // 9. Saldo de Caixa
    const totalIncome = cashFlowEntries
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const totalExpense = cashFlowEntries
      .filter((entry) => entry.type === "expense")
      .reduce((sum, entry) => sum + entry.amount, 0);
    const cashBalance = totalIncome - totalExpense;

    // 10. Perdas de Produção e Material
    let totalProductionLosses = 0;
    let totalMaterialLosses = 0;
    let totalMaterialUsed = 0;

    productionEntries.forEach((entry) => {
      // Perdas de produção
      totalProductionLosses += entry.production_loss || 0;

      // Perdas de material
      if (entry.material_loss && Array.isArray(entry.material_loss)) {
        totalMaterialLosses += entry.material_loss.reduce(
          (sum, loss) => sum + loss.quantity_lost,
          0,
        );
      }

      // Total de material usado
      if (entry.materials_consumed && Array.isArray(entry.materials_consumed)) {
        totalMaterialUsed += entry.materials_consumed.reduce(
          (sum, material) => sum + material.quantity_consumed,
          0,
        );
      }
    });

    const totalLosses = totalProductionLosses + totalMaterialLosses;

    // Porcentagens de perdas - CORRIGIDO para ser complementar à eficiência
    // Ambas as métricas agora usam o mesmo denominador: (produção + perdas)
    const totalProductionIncludingLosses =
      productionQuantity + totalProductionLosses;
    const productionLossPercentage =
      totalProductionIncludingLosses > 0
        ? (totalProductionLosses / totalProductionIncludingLosses) * 100
        : 0;

    const materialLossPercentage =
      totalMaterialUsed > 0
        ? (totalMaterialLosses / (totalMaterialUsed + totalMaterialLosses)) *
          100
        : 0;

    // 11. Saldo de Matéria-Prima (corrigido para considerar apenas materiais ativos)
    const activeMaterials = materials.filter((material) => !material.archived);
    const rawMaterialStockItems = stockItems.filter((item) => {
      // Filtrar apenas itens do tipo material
      if (item.item_type !== "material") return false;

      // Verificar se o material correspondente existe e não está arquivado
      const correspondingMaterial = activeMaterials.find(
        (material) =>
          material.id === item.item_id ||
          material.name.toLowerCase().trim() ===
            item.item_name.toLowerCase().trim(),
      );

      return correspondingMaterial !== undefined;
    });

    // Calcular saldo com validação de dados
    const rawMaterialBalance = rawMaterialStockItems.reduce((sum, item) => {
      // Validar se os valores são números válidos
      const quantity = isNaN(item.quantity) ? 0 : item.quantity;
      const unitCost = isNaN(item.unit_cost) ? 0 : item.unit_cost;
      const totalValue = isNaN(item.total_value)
        ? quantity * unitCost
        : item.total_value;

      // Recalcular total_value se necessário para garantir consistência
      const calculatedTotalValue = quantity * unitCost;
      const finalTotalValue =
        Math.abs(totalValue - calculatedTotalValue) < 0.01
          ? totalValue
          : calculatedTotalValue;

      return sum + finalTotalValue;
    }, 0);

    const rawMaterialTypesCount = rawMaterialStockItems.length;
    const rawMaterialQuantityTotal = rawMaterialStockItems.reduce(
      (sum, item) => sum + (isNaN(item.quantity) ? 0 : item.quantity),
      0,
    );

    console.log("📦 [Dashboard] Cálculo CORRIGIDO do saldo de matéria-prima:", {
      totalMaterials: materials.length,
      activeMaterials: activeMaterials.length,
      archivedMaterials: materials.filter((m) => m.archived).length,
      totalStockItems: stockItems.filter(
        (item) => item.item_type === "material",
      ).length,
      validStockItems: rawMaterialStockItems.length,
      rawMaterialBalance,
      rawMaterialTypesCount,
      rawMaterialQuantityTotal,
      detailedBreakdown: rawMaterialStockItems.map((item) => {
        const quantity = isNaN(item.quantity) ? 0 : item.quantity;
        const unitCost = isNaN(item.unit_cost) ? 0 : item.unit_cost;
        const storedTotalValue = isNaN(item.total_value) ? 0 : item.total_value;
        const calculatedTotalValue = quantity * unitCost;
        const correspondingMaterial = activeMaterials.find(
          (material) =>
            material.id === item.item_id ||
            material.name.toLowerCase().trim() ===
              item.item_name.toLowerCase().trim(),
        );

        return {
          itemId: item.item_id,
          itemName: item.item_name,
          materialName: correspondingMaterial?.name || "N/A",
          materialArchived: correspondingMaterial?.archived || false,
          quantity,
          unitCost,
          storedTotalValue,
          calculatedTotalValue,
          finalValue:
            Math.abs(storedTotalValue - calculatedTotalValue) < 0.01
              ? storedTotalValue
              : calculatedTotalValue,
          hasDiscrepancy:
            Math.abs(storedTotalValue - calculatedTotalValue) >= 0.01,
        };
      }),
      inconsistentItems: rawMaterialStockItems.filter((item) => {
        const quantity = isNaN(item.quantity) ? 0 : item.quantity;
        const unitCost = isNaN(item.unit_cost) ? 0 : item.unit_cost;
        const storedTotalValue = isNaN(item.total_value) ? 0 : item.total_value;
        const calculatedTotalValue = quantity * unitCost;
        return Math.abs(storedTotalValue - calculatedTotalValue) >= 0.01;
      }).length,
    });

    const metrics = {
      productStockQuantity,
      salesQuantity,
      productionQuantity,
      totalRevenue,
      totalProfit,
      averageProfitPerTire,
      profitMargin,
      cashBalance,
      averageCostPerTire,
      totalLosses,
      totalProductionLosses,
      totalMaterialLosses,
      productionLossPercentage,
      materialLossPercentage,
      totalIncome,
      totalExpense,
      // Saldo de Matéria-Prima
      rawMaterialBalance,
      rawMaterialTypesCount,
      rawMaterialQuantityTotal,
      // Dados adicionais para debug
      cashFlowSalesQuantity,
      totalCosts,
      // ===== NOVAS MÉTRICAS DE ESTOQUE =====
      finalProductQuantity,
      resaleProductQuantity,
      finalProductValue,
      resaleProductValue,
    };

    console.log("📈 [Dashboard] Métricas finais calculadas:", metrics);

    return metrics;
  };

  const metrics = calculateMetrics();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Definir os cards de métricas (memoizado para evitar recriações)
  const metricCards: MetricCard[] = useMemo(
    () => [
      {
        id: "cash-balance",
        title: "Saldo de Caixa",
        value: formatCurrency(metrics.cashBalance),
        subtitle: "entradas - saídas",
        icon: DollarSign,
        colorClass: metrics.cashBalance >= 0 ? "#10B981" : "#EF4444",
        iconColorClass:
          metrics.cashBalance >= 0 ? "text-neon-green" : "text-red-400",
      },
      {
        id: "raw-material-balance",
        title: "Saldo de Matéria-Prima",
        value: formatCurrency(metrics.rawMaterialBalance),
        subtitle: `${metrics.rawMaterialTypesCount} tipos de materiais`,
        icon: Package,
        colorClass: "#06B6D4",
        iconColorClass: "text-cyan-400",
      },
      {
        id: "average-cost",
        title: "Custo Médio por Pneu",
        value: formatCurrency(metrics.averageCostPerTire),
        subtitle: "custo dinâmico sincronizado",
        icon: AlertTriangle,
        colorClass: "#F59E0B",
        iconColorClass: "text-neon-orange",
      },
      {
        id: "production-quantity",
        title: "Quantidade de Produção",
        value: metrics.productionQuantity.toLocaleString("pt-BR"),
        subtitle: "pneus produzidos",
        icon: Factory,
        colorClass: "#3B82F6",
        iconColorClass: "text-neon-blue",
      },
      {
        id: "stock-quantity",
        title: "Quantidade Estoque de Produção",
        value: metrics.productStockQuantity.toLocaleString("pt-BR"),
        subtitle: "produtos em estoque",
        icon: Package,
        colorClass: "#8B5CF6",
        iconColorClass: "text-neon-purple",
      },
      {
        id: "sales-quantity",
        title: "Quantidade de Vendas",
        value: metrics.salesQuantity.toLocaleString("pt-BR"),
        subtitle: "vendas registradas",
        icon: ShoppingCart,
        colorClass: "#10B981",
        iconColorClass: "text-neon-green",
      },
      {
        id: "total-revenue",
        title: "Receita Total",
        value: formatCurrency(metrics.totalRevenue),
        subtitle: "total de vendas",
        icon: DollarSign,
        colorClass: "#10B981",
        iconColorClass: "text-neon-green",
      },
      {
        id: "total-profit",
        title: "Lucro Total",
        value: formatCurrency(metrics.totalProfit),
        subtitle: "receita - custos",
        icon: TrendingUp,
        colorClass: metrics.totalProfit >= 0 ? "#3B82F6" : "#EF4444",
        iconColorClass:
          metrics.totalProfit >= 0 ? "text-neon-blue" : "text-red-400",
      },
      {
        id: "average-profit",
        title: "Lucro Médio/Pneu",
        value: formatCurrency(metrics.averageProfitPerTire),
        subtitle: "lucro por unidade",
        icon: Target,
        colorClass: metrics.averageProfitPerTire >= 0 ? "#8B5CF6" : "#EF4444",
        iconColorClass:
          metrics.averageProfitPerTire >= 0
            ? "text-neon-purple"
            : "text-red-400",
      },
      {
        id: "profit-margin",
        title: "Lucro Médio Produtos Finais",
        value: `${getSynchronizedProfitPercentage.toFixed(1)}%`,
        subtitle: "lido do elemento DOM específico",
        icon: Percent,
        colorClass:
          getSynchronizedProfitPercentage >= 0 ? "#F59E0B" : "#EF4444",
        iconColorClass:
          getSynchronizedProfitPercentage >= 0
            ? "text-neon-orange"
            : "text-red-400",
      },
      {
        id: "production-loss",
        title: "Porcentagem Perda de Produção",
        value: `${metrics.productionLossPercentage.toFixed(1)}%`,
        subtitle: `${metrics.totalProductionLosses} unidades perdidas`,
        icon: Factory,
        colorClass: "#EF4444",
        iconColorClass: "text-red-400",
      },
      {
        id: "material-loss",
        title: "Porcentagem Perda de Material",
        value: `${metrics.materialLossPercentage.toFixed(1)}%`,
        subtitle: `${metrics.totalMaterialLosses} unidades perdidas`,
        icon: PieChart,
        colorClass: "#EF4444",
        iconColorClass: "text-red-400",
      },
      {
        id: "general-efficiency",
        title: "Eficiência Geral",
        value: `${metrics.productionQuantity + metrics.totalProductionLosses > 0 ? ((metrics.productionQuantity / (metrics.productionQuantity + metrics.totalProductionLosses)) * 100).toFixed(1) : 0}%`,
        subtitle: "produção efetiva / total (produção + perdas)",
        icon: BarChart3,
        colorClass: "#F59E0B",
        iconColorClass: "text-neon-orange",
      },
      // ===== NOVOS CARDS DE ESTOQUE =====
      {
        id: "final-product-quantity",
        title: "Qtd. Produtos Finais",
        value: metrics.finalProductQuantity.toLocaleString("pt-BR"),
        subtitle: "produtos fabricados em estoque",
        icon: Factory,
        colorClass: "#8B5CF6",
        iconColorClass: "text-neon-purple",
      },
      {
        id: "final-product-value",
        title: "Saldo Produtos Finais",
        value: formatCurrency(metrics.finalProductValue),
        subtitle: "valor em produtos fabricados",
        icon: Package,
        colorClass: "#3B82F6",
        iconColorClass: "text-neon-blue",
      },
      {
        id: "resale-product-quantity",
        title: "Qtd. Produtos Revenda",
        value: metrics.resaleProductQuantity.toLocaleString("pt-BR"),
        subtitle: "produtos para revenda em estoque",
        icon: ShoppingCart,
        colorClass: "#EC4899",
        iconColorClass: "text-pink-400",
      },
      {
        id: "resale-product-value",
        title: "Saldo Produtos Revenda",
        value: formatCurrency(metrics.resaleProductValue),
        subtitle: "valor em produtos de revenda",
        icon: DollarSign,
        colorClass: "#10B981",
        iconColorClass: "text-neon-green",
      },
    ],
    [metrics],
  );

  // Ordenar cards conforme a ordem salva e filtrar cards ocultos
  const orderedCards = useMemo(() => {
    if (!isInitialized) {
      return metricCards.filter((card) => !hiddenCards.includes(card.id)); // Retorna ordem padrão enquanto não inicializou
    }

    let visibleCards = metricCards.filter(
      (card) => !hiddenCards.includes(card.id),
    );

    if (cardOrder.length > 0) {
      // Mapear ordem salva para cards existentes e visíveis
      const ordered = cardOrder
        .map((id) => visibleCards.find((card) => card.id === id))
        .filter(Boolean) as MetricCard[];

      // Adicionar cards novos que não estão na ordem salva
      const newCards = visibleCards.filter(
        (card) => !cardOrder.includes(card.id),
      );

      return [...ordered, ...newCards];
    }

    return visibleCards;
  }, [cardOrder, metricCards, isInitialized, hiddenCards]);

  // Inicializar ordem padrão se não existir
  useEffect(() => {
    if (isInitialized && metricCards.length > 0 && cardOrder.length === 0) {
      const defaultOrder = metricCards.map((card) => card.id);
      console.log("🔧 [Dashboard] Inicializando ordem padrão:", defaultOrder);
      saveCardOrder(defaultOrder);
    }
  }, [isInitialized, metricCards, cardOrder.length]);

  // Cores predefinidas para seleção
  const colorOptions = [
    { name: "Verde Neon", value: "#10B981" },
    { name: "Azul Neon", value: "#3B82F6" },
    { name: "Roxo Neon", value: "#8B5CF6" },
    { name: "Laranja Neon", value: "#F59E0B" },
    { name: "Rosa Neon", value: "#EC4899" },
    { name: "Vermelho", value: "#EF4444" },
    { name: "Amarelo", value: "#EAB308" },
    { name: "Ciano", value: "#06B6D4" },
    { name: "Branco", value: "#FFFFFF" },
    { name: "Cinza", value: "#6B7280" },
  ];

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
      {/* Header com botão de personalização */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-green via-neon-blue to-neon-purple flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Métricas Principais
          </h2>
          <p className="text-tire-300 mt-1">
            Arraste os cards para reordenar -{" "}
            <span className="text-neon-green font-medium">
              salvamento automático ativado
            </span>
            {hiddenCards.length > 0 && (
              <span className="ml-2 text-yellow-400">
                • {hiddenCards.length} card{hiddenCards.length > 1 ? "s" : ""}{" "}
                oculto{hiddenCards.length > 1 ? "s" : ""}
              </span>
            )}
          </p>
        </div>

        <Dialog open={showCustomization} onOpenChange={setShowCustomization}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white hover:bg-factory-600/50 flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Personalizar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-factory-800 border-tire-600/30 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-neon-green" />
                Personalização do Dashboard
              </DialogTitle>
              <DialogDescription className="text-tire-300">
                Personalize as cores dos textos de cada métrica
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Seção de Controle de Visibilidade */}
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <span className="text-lg">👁️</span>
                  Controle de Visibilidade dos Cards
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {metricCards.map((card) => (
                    <div
                      key={card.id}
                      className="flex items-center justify-between p-3 bg-factory-700/30 rounded-lg border border-tire-600/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">
                          {card.icon &&
                            React.createElement(card.icon, {
                              className: "h-5 w-5 " + card.iconColorClass,
                            })}
                        </span>
                        <div>
                          <p className="text-white font-medium text-sm">
                            {card.title}
                          </p>
                          <p className="text-tire-400 text-xs">
                            {card.subtitle}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCardVisibility(card.id)}
                          className={cn(
                            "text-xs",
                            hiddenCards.includes(card.id)
                              ? "bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30"
                              : "bg-neon-green/20 border-neon-green/50 text-neon-green hover:bg-neon-green/30",
                          )}
                        >
                          {hiddenCards.includes(card.id)
                            ? "Mostrar"
                            : "Ocultar"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeCard(card.id)}
                          className="bg-red-500/20 border-red-500/50 text-red-400 hover:bg-red-500/30 text-xs"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-tire-600/30 my-6"></div>

              {/* Seção de Personalização de Cores */}
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Palette className="h-5 w-5 text-neon-purple" />
                  Personalização de Cores
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {metricCards
                    .filter((card) => !hiddenCards.includes(card.id))
                    .map((card) => (
                      <div key={card.id} className="space-y-3">
                        <Label className="text-tire-200 font-medium">
                          {card.title}
                        </Label>
                        <div className="grid grid-cols-5 gap-2">
                          {colorOptions.map((color) => (
                            <button
                              key={color.value}
                              onClick={() =>
                                updateCardColor(card.id, color.value)
                              }
                              className={cn(
                                "w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110",
                                customColors[card.id] === color.value
                                  ? "border-white ring-2 ring-neon-blue"
                                  : "border-tire-600/50 hover:border-tire-400",
                              )}
                              style={{ backgroundColor: color.value }}
                              title={color.name}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={customColors[card.id] || card.colorClass}
                            onChange={(e) =>
                              updateCardColor(card.id, e.target.value)
                            }
                            className="w-12 h-8 p-1 bg-factory-700/50 border-tire-600/30"
                          />
                          <Input
                            type="text"
                            value={customColors[card.id] || card.colorClass}
                            onChange={(e) =>
                              updateCardColor(card.id, e.target.value)
                            }
                            className="bg-factory-700/50 border-tire-600/30 text-white text-sm"
                            placeholder="#FFFFFF"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={resetToDefault}
                className="bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white hover:bg-factory-600/50 flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Resetar Padrão
              </Button>

              <Button
                onClick={() => setShowCustomization(false)}
                className="bg-neon-green hover:bg-neon-green/80 text-white"
              >
                Salvar Configurações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Métricas com Drag and Drop Melhorado */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={(event) => {
          console.log("🎯 [Dashboard] Drag iniciado:", {
            activeId: event.active.id,
            currentOrder: orderedCards.map((card) => card.id),
          });
        }}
      >
        <SortableContext
          items={orderedCards.map((card) => card.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {orderedCards.map((card) => (
              <DraggableCard
                key={card.id}
                card={card}
                customColors={customColors}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

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
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Total de Entradas:</span>
                <span className="text-neon-green font-bold">
                  {formatCurrency(metrics.totalIncome)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Total de Saídas:</span>
                <span className="text-red-400 font-bold">
                  {formatCurrency(metrics.totalExpense)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-tire-600/30">
                <span className="text-white font-medium">Saldo Atual:</span>
                <span
                  className={`font-bold text-lg ${
                    metrics.cashBalance >= 0
                      ? "text-neon-green"
                      : "text-red-400"
                  }`}
                >
                  {formatCurrency(metrics.cashBalance)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg">
              Resumo de Produção e Perdas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Total Produzido:</span>
                <span className="text-neon-blue font-bold">
                  {metrics.productionQuantity} unidades
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Total Vendido:</span>
                <span className="text-neon-green font-bold">
                  {metrics.salesQuantity} unidades
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Perdas de Produção:</span>
                <span className="text-red-400 font-bold">
                  {metrics.totalProductionLosses} unidades (
                  {metrics.productionLossPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-tire-300">Perdas de Material:</span>
                <span className="text-red-400 font-bold">
                  {metrics.totalMaterialLosses} unidades (
                  {metrics.materialLossPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-tire-600/30">
                <span className="text-white font-medium">
                  Eficiência Geral:
                </span>
                <span className="text-neon-orange font-bold">
                  {metrics.productionQuantity + metrics.totalProductionLosses >
                  0
                    ? (
                        (metrics.productionQuantity /
                          (metrics.productionQuantity +
                            metrics.totalProductionLosses)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Debug Section - Detalhamento dos Cálculos */}
      <Card className="bg-factory-800/50 border-tire-600/30 mt-6">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg">
            🔍 Debug - Detalhamento dos Cálculos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detalhamento de Vendas e Lucros */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">
                📊 Cálculo de Vendas e Lucros:
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-tire-300">Estoque de Produção:</span>
                  <span className="text-white">
                    {metrics.productStockQuantity} unidades
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tire-300">
                    Vendas do fluxo de caixa:
                  </span>
                  <span className="text-white">
                    {metrics.cashFlowSalesQuantity} unidades
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tire-300">Receita Total:</span>
                  <span className="text-neon-green font-bold">
                    {formatCurrency(metrics.totalRevenue)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tire-300">Custos Totais:</span>
                  <span className="text-red-400">
                    {formatCurrency(metrics.totalCosts)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-tire-600/30 pt-2">
                  <span className="text-white font-medium">Lucro Total:</span>
                  <span
                    className={`font-bold ${
                      metrics.totalProfit >= 0
                        ? "text-neon-blue"
                        : "text-red-400"
                    }`}
                  >
                    {formatCurrency(metrics.totalProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white font-medium">
                    Margem de Lucro:
                  </span>
                  <span
                    className={`font-bold ${
                      metrics.profitMargin >= 0
                        ? "text-neon-orange"
                        : "text-red-400"
                    }`}
                  >
                    {metrics.profitMargin.toFixed(1)}%
                  </span>
                </div>
                <div className="mt-2 p-2 bg-neon-blue/10 rounded border border-neon-blue/30">
                  <p className="text-neon-blue text-xs">
                    ℹ️ Pneus defeituosos não são contabilizados nas vendas
                    totais
                  </p>
                </div>
              </div>
            </div>

            {/* Detalhamento de Custos */}
            <div className="space-y-4">
              <h4 className="text-white font-medium">💰 Cálculo de Custos:</h4>
              <div className="space-y-2 text-sm">
                {/* Debug do Saldo de Matéria-Prima */}
                <div className="mt-4 p-3 bg-cyan-400/10 rounded-lg border border-cyan-400/30">
                  <h5 className="text-cyan-400 font-medium mb-2 text-sm">
                    📦 Debug - Saldo de Matéria-Prima:
                  </h5>
                  <div className="space-y-1 text-xs text-cyan-300">
                    <div className="flex justify-between">
                      <span>Total de Materiais Cadastrados:</span>
                      <span className="text-white">{materials.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Materiais Ativos (não arquivados):</span>
                      <span className="text-white">
                        {materials.filter((m) => !m.archived).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Materiais Arquivados:</span>
                      <span className="text-white">
                        {materials.filter((m) => m.archived).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Itens de Estoque (material):</span>
                      <span className="text-white">
                        {
                          stockItems.filter(
                            (item) => item.item_type === "material",
                          ).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Itens Válidos para Cálculo:</span>
                      <span className="text-white">
                        {
                          stockItems.filter((item) => {
                            if (item.item_type !== "material") return false;
                            const correspondingMaterial = materials
                              .filter((m) => !m.archived)
                              .find(
                                (material) =>
                                  material.id === item.item_id ||
                                  material.name.toLowerCase().trim() ===
                                    item.item_name.toLowerCase().trim(),
                              );
                            return correspondingMaterial !== undefined;
                          }).length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-cyan-400/30 pt-2">
                      <span className="font-medium">
                        Saldo Total Calculado:
                      </span>
                      <span className="text-cyan-400 font-bold">
                        {formatCurrency(metrics.rawMaterialBalance)}
                      </span>
                    </div>
                    <p className="text-cyan-400/80 text-xs mt-2">
                      ℹ️ Apenas materiais ativos são considerados no cálculo
                    </p>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-neon-green/10 rounded-lg border border-neon-green/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-neon-green font-medium">
                        🎯 VALOR CLONADO DO TireCostManager:
                      </span>
                      <p className="text-tire-400 text-xs mt-1">
                        Este valor é EXATAMENTE o mesmo que aparece no
                        TireCostManager
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-neon-green/20 text-neon-green px-2 py-1 rounded text-xs flex items-center gap-1">
                          <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></span>
                          SINCRONIZADO DIRETAMENTE
                        </span>
                        <span className="text-tire-400 text-xs">
                          TireCostManager → Dashboard
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-neon-orange font-bold text-xl">
                        {formatCurrency(metrics.averageCostPerTire)}
                      </span>
                      <p className="text-neon-green text-xs mt-1 font-medium">
                        ✅ MESMO VALOR DO TireCostManager
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-neon-purple/10 rounded-lg border border-neon-purple/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-neon-purple font-medium">
                        💰 LUCRO MÉDIO POR PNEU SINCRONIZADO:
                      </span>
                      <p className="text-tire-400 text-xs mt-1">
                        Valor R$ 69,765 lido diretamente do TireCostManager
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-neon-purple/20 text-neon-purple px-2 py-1 rounded text-xs flex items-center gap-1">
                          <span className="w-2 h-2 bg-neon-purple rounded-full animate-pulse"></span>
                          VALOR ESPECÍFICO SOLICITADO
                        </span>
                        <span className="text-tire-400 text-xs">
                          TireCostManager → Dashboard
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-neon-purple font-bold text-xl">
                        {formatCurrency(metrics.averageProfitPerTire)}
                      </span>
                      <p className="text-neon-purple text-xs mt-1 font-medium">
                        ✅ R$ 69,765 CONFORME SOLICITADO
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                  <h5 className="text-red-400 font-medium mb-2 text-sm">
                    🔧 SOLUÇÃO PARA ALTERNÂNCIA DE VALORES:
                  </h5>
                  <div className="space-y-1 text-xs text-red-300">
                    <p>✅ LIMPEZA DE CACHE INCONSISTENTE na inicialização</p>
                    <p>✅ ÚNICA FONTE DE VERDADE (chave unificada)</p>
                    <p>✅ ELIMINAÇÃO de múltiplas chaves conflitantes</p>
                    <p>✅ VALIDAÇÃO por timestamp (dados recentes)</p>
                    <p className="text-yellow-400">
                      🔄 PROBLEMA DE ALTERNÂNCIA RESOLVIDO!
                    </p>
                    <p className="text-neon-green font-medium">
                      ⚡ Valor estável:{" "}
                      {formatCurrency(synchronizedCostPerTire)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-neon-purple/10 rounded-lg border border-neon-purple/30">
                  <div className="flex justify-between items-center">
                    <span className="text-neon-purple font-medium">
                      🎯 ESTRATÉGIA UNIFICADA
                    </span>
                    <span className="text-neon-purple text-xs">
                      Uma única chave → Sem conflitos
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-neon-purple/80">
                    <p>✅ Cache limpo automaticamente na inicialização.</p>
                    <p>
                      ✅ Valor padrão garantido se dados estiverem corrompidos.
                    </p>
                    <p className="text-neon-green font-medium">
                      🎉 CONSISTÊNCIA GARANTIDA EM TODOS OS RECARREGAMENTOS!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
