import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import {
  Settings,
  Palette,
  GripVertical,
  RotateCcw,
  Check,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import RawMaterialStock from "./RawMaterialStock";
import ProductStock from "./ProductStock";
import StockCharts from "./StockCharts";
import {
  useMaterials,
  useProducts,
  useStockItems,
  useResaleProducts,
  useCostCalculationOptions,
} from "@/hooks/useDataPersistence";
import { useToast } from "@/components/ui/use-toast";

interface StockDashboardProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  color: string;
  bgColor: string;
  type:
    | "materialTypes"
    | "materialValue"
    | "finalProductQuantity"
    | "finalProductValue"
    | "resaleProductQuantity"
    | "resaleProductValue";
}

interface SortableCardProps {
  card: MetricCard;
  onColorChange?: (cardId: string, color: string, bgColor: string) => void;
  showColorPicker?: boolean;
}

const SortableCard = ({
  card,
  onColorChange,
  showColorPicker = false,
}: SortableCardProps) => {
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
    transition: isDragging ? "none" : transition, // Remove transition during drag for smoother experience
    opacity: isDragging ? 0.5 : 1, // More visible during drag
    zIndex: isDragging ? 1000 : 1,
  };

  const colorOptions = [
    { name: "Blue", color: "text-neon-blue", bgColor: "bg-factory-800/50" },
    { name: "Green", color: "text-neon-green", bgColor: "bg-factory-800/50" },
    { name: "Purple", color: "text-neon-purple", bgColor: "bg-factory-800/50" },
    { name: "Orange", color: "text-neon-orange", bgColor: "bg-factory-800/50" },
    { name: "Cyan", color: "text-neon-cyan", bgColor: "bg-factory-800/50" },
    { name: "Yellow", color: "text-yellow-400", bgColor: "bg-factory-800/50" },
    { name: "Red", color: "text-red-400", bgColor: "bg-factory-800/50" },
  ];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative transition-all duration-200 ${
        isDragging
          ? "scale-105 shadow-2xl shadow-neon-blue/30"
          : "hover:scale-[1.02] hover:shadow-lg"
      }`}
    >
      {/* Drag handle overlay - covers entire card for easy dragging */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute inset-0 z-20 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        style={{
          background: "transparent",
          // Prevent text selection during drag
          userSelect: "none",
          WebkitUserSelect: "none",
          MozUserSelect: "none",
          msUserSelect: "none",
        }}
      />

      <Card
        className={`${card.bgColor} border-tire-600/30 relative group ${
          isDragging
            ? "border-neon-blue/70 shadow-xl shadow-neon-blue/25 bg-factory-700/80"
            : "hover:border-tire-500/50 hover:bg-factory-700/30"
        } transition-all duration-200 overflow-hidden`}
      >
        {/* Drag indicator - more prominent */}
        <div
          className={`absolute top-2 left-2 transition-opacity pointer-events-none z-10 ${
            isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-80"
          }`}
        >
          <div className="bg-tire-700/50 rounded p-1 backdrop-blur-sm">
            <GripVertical className="h-4 w-4 text-tire-300" />
          </div>
        </div>

        {/* Drag state indicator */}
        {isDragging && (
          <div className="absolute inset-0 bg-neon-blue/10 border-2 border-neon-blue/30 rounded-lg pointer-events-none z-10" />
        )}

        <CardContent className="p-4 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-tire-300 text-sm">{card.title}</p>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-xs text-tire-400 mt-1">{card.subtitle}</p>
            </div>
            <div className={card.color}>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Card component for drag overlay - enhanced visual feedback
const DragOverlayCard = ({ card }: { card: MetricCard }) => {
  return (
    <div className="transform scale-110 animate-pulse">
      <Card
        className={`${card.bgColor} border-neon-blue/70 shadow-2xl shadow-neon-blue/40 bg-factory-700/90 backdrop-blur-sm`}
        style={{
          filter: "brightness(1.1) saturate(1.2)",
        }}
      >
        {/* Glowing border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 via-transparent to-neon-purple/20 rounded-lg" />

        {/* Drag indicator in overlay */}
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-neon-blue/30 rounded p-1 backdrop-blur-sm">
            <GripVertical className="h-4 w-4 text-neon-blue" />
          </div>
        </div>

        <CardContent className="p-4 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-tire-200 text-sm font-medium">{card.title}</p>
              <p className={`text-2xl font-bold ${card.color} drop-shadow-sm`}>
                {card.value}
              </p>
              <p className="text-xs text-tire-300 mt-1">{card.subtitle}</p>
            </div>
            <div className={`${card.color} drop-shadow-sm`}>
              <span className="text-2xl">{card.icon}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Placeholder component for ProductFinancialAnalysis
const ProductFinancialAnalysis = () => {
  return (
    <div class="p-6 pt-0">
        <div class="space-y-3 max-h-96 overflow-y-auto">
            <div class="p-4 rounded-lg border cursor-pointer transition-all bg-factory-700/30 border-tire-600/20 hover:bg-factory-700/50">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-white font-medium flex items-center gap-2">175 70 14 P6</h4>
                    <div class="text-right">
                        <span class="text-neon-green font-bold text-lg">R$&nbsp;0,00</span>
                        <p class="text-tire-400 text-xs">Receita</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p class="text-tire-400">Vendidos</p>
                        <p class="text-white font-medium">0</p>
                    </div>
                    <div>
                        <p class="text-tire-400">Custo/Pneu (Receita)</p>
                        <p class="text-neon-orange font-medium flex items-center gap-1"><span class="text-neon-yellow text-xs">📋</span>R$&nbsp;100,64</p>
                    </div>
                    <div>
                        <p class="text-tire-400">Lucro</p>
                        <p class="font-medium text-neon-blue">R$&nbsp;0,00</p>
                    </div>
                    <div>
                        <p class="text-tire-400">Margem</p>
                        <p class="font-medium text-neon-purple">0.00%</p>
                    </div>
                </div>
            </div>
            <div class="p-4 rounded-lg border cursor-pointer transition-all bg-factory-700/30 border-tire-600/20 hover:bg-factory-700/50">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="text-white font-medium flex items-center gap-2">175 65 14 P1</h4>
                    <div class="text-right">
                        <span class="text-neon-green font-bold text-lg">R$&nbsp;0,00</span>
                        <p class="text-tire-400 text-xs">Receita</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p class="text-tire-400">Vendidos</p>
                        <p class="text-white font-medium">0</p>
                    </div>
                    <div>
                        <p class="text-tire-400">Custo/Pneu (Receita)</p>
                        <p class="text-neon-orange font-medium flex items-center gap-1"><span class="text-neon-yellow text-xs">📋</span>R$&nbsp;85,80</p>
                    </div>
                    <div>
                        <p class="text-tire-400">Lucro</p>
                        <p class="font-medium text-neon-blue">R$&nbsp;0,00</p>
                    </div>
                    <div>
                        <p class="text-tire-400">Margem</p>
                        <p class="font-medium text-neon-purple">0.00%</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const StockDashboard = ({
  onRefresh = () => {},
  isLoading = false,
}: StockDashboardProps) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedCardForColor, setSelectedCardForColor] = useState<string>("");
  const [customColorValue, setCustomColorValue] = useState<string>("#10B981");
  const { toast } = useToast();

  // Color options for customization - matching main dashboard
  const colorOptions = [
    {
      name: "Verde Neon",
      color: "text-neon-green",
      bgColor: "bg-factory-800/50",
      hex: "#10B981",
    },
    {
      name: "Azul Neon",
      color: "text-neon-blue",
      bgColor: "bg-factory-800/50",
      hex: "#3B82F6",
    },
    {
      name: "Roxo Neon",
      color: "text-neon-purple",
      bgColor: "bg-factory-800/50",
      hex: "#8B5CF6",
    },
    {
      name: "Laranja Neon",
      color: "text-neon-orange",
      bgColor: "bg-factory-800/50",
      hex: "#F59E0B",
    },
    {
      name: "Rosa Neon",
      color: "text-pink-400",
      bgColor: "bg-factory-800/50",
      hex: "#EC4899",
    },
    {
      name: "Vermelho",
      color: "text-red-400",
      bgColor: "bg-factory-800/50",
      hex: "#EF4444",
    },
    {
      name: "Amarelo",
      color: "text-yellow-400",
      bgColor: "bg-factory-800/50",
      hex: "#EAB308",
    },
    {
      name: "Ciano",
      color: "text-neon-cyan",
      bgColor: "bg-factory-800/50",
      hex: "#06B6D4",
    },
    {
      name: "Branco",
      color: "text-white",
      bgColor: "bg-factory-800/50",
      hex: "#FFFFFF",
    },
    {
      name: "Cinza",
      color: "text-gray-400",
      bgColor: "bg-factory-800/50",
      hex: "#6B7280",
    },
  ];

  // Convert hex to Tailwind color class
  const hexToTailwindColor = (hex: string): string => {
    const colorMap: { [key: string]: string } = {
      "#10B981": "text-neon-green",
      "#3B82F6": "text-neon-blue",
      "#8B5CF6": "text-neon-purple",
      "#F59E0B": "text-neon-orange",
      "#EC4899": "text-pink-400",
      "#EF4444": "text-red-400",
      "#EAB308": "text-yellow-400",
      "#06B6D4": "text-neon-cyan",
      "#FFFFFF": "text-white",
      "#6B7280": "text-gray-400",
    };
    return colorMap[hex.toUpperCase()] || "text-neon-blue";
  };

  // Handle custom color change
  const handleCustomColorChange = (hex: string) => {
    setCustomColorValue(hex);
    if (selectedCardForColor) {
      const tailwindColor = hexToTailwindColor(hex);
      handleColorChange(
        selectedCardForColor,
        tailwindColor,
        "bg-factory-800/50",
      );
    }
  };

  // Default card order and colors
  const defaultCards: MetricCard[] = [
    {
      id: "materialTypes",
      title: "Tipos de Material",
      value: 0,
      subtitle: "de 0 cadastrados",
      icon: "🧱",
      color: "text-neon-blue",
      bgColor: "bg-factory-800/50",
      type: "materialTypes",
    },
    {
      id: "materialValue",
      title: "Saldo Matéria-Prima",
      value: "R$ 0",
      subtitle: "Valor total investido",
      icon: "💎",
      color: "text-neon-cyan",
      bgColor: "bg-factory-800/50",
      type: "materialValue",
    },
    {
      id: "finalProductQuantity",
      title: "Qtd. Produtos Finais",
      value: 0,
      subtitle: "Produtos fabricados",
      icon: "🏭",
      color: "text-neon-green",
      bgColor: "bg-factory-800/50",
      type: "finalProductQuantity",
    },
    {
      id: "finalProductValue",
      title: "Saldo Produtos Finais",
      value: "R$ 0",
      subtitle: "Valor em produtos finais",
      icon: "🎯",
      color: "text-neon-orange",
      bgColor: "bg-factory-800/50",
      type: "finalProductValue",
    },
    {
      id: "resaleProductQuantity",
      title: "Qtd. Produtos Revenda",
      value: 0,
      subtitle: "Produtos para revenda",
      icon: "🛒",
      color: "text-neon-purple",
      bgColor: "bg-factory-800/50",
      type: "resaleProductQuantity",
    },
    {
      id: "resaleProductValue",
      title: "Saldo Produtos Revenda",
      value: "R$ 0",
      subtitle: "Valor em revenda",
      icon: "💰",
      color: "text-yellow-400",
      bgColor: "bg-factory-800/50",
      type: "resaleProductValue",
    },
  ];

  // Drag and drop sensors with improved activation for better UX
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced distance for more responsive drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // State for card order and customization
  const [cards, setCards] = useState<MetricCard[]>(() => {
    const saved = localStorage.getItem("stockDashboard_cardOrder");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log(
          "🔄 [StockDashboard] Carregando cards salvos do localStorage:",
          {
            savedCards: parsed.length,
            defaultCards: defaultCards.length,
            savedOrder: parsed.map((c: MetricCard) => c.id),
            defaultOrder: defaultCards.map((c) => c.id),
          },
        );

        // Preserve the saved order and merge with default properties
        const restoredCards = parsed.map((savedCard: MetricCard) => {
          const defaultCard = defaultCards.find((dc) => dc.id === savedCard.id);
          if (defaultCard) {
            // Merge saved customizations with default properties
            return {
              ...defaultCard,
              ...savedCard,
              // Ensure we keep the saved order by using the saved card structure
            };
          }
          return savedCard; // Fallback to saved card if no default found
        });

        // Add any new default cards that weren't in the saved data
        const savedIds = parsed.map((c: MetricCard) => c.id);
        const newCards = defaultCards.filter((dc) => !savedIds.includes(dc.id));

        const finalCards = [...restoredCards, ...newCards];

        console.log("✅ [StockDashboard] Cards restaurados com sucesso:", {
          finalOrder: finalCards.map((c) => c.id),
          totalCards: finalCards.length,
        });

        return finalCards;
      } catch (error) {
        console.error(
          "❌ [StockDashboard] Erro ao carregar cards do localStorage:",
          error,
        );
        return defaultCards;
      }
    }
    console.log("🔄 [StockDashboard] Usando ordem padrão dos cards");
    return defaultCards;
  });

  // Save to localStorage whenever cards change
  useEffect(() => {
    console.log(
      "💾 [StockDashboard] Salvando ordem dos cards no localStorage:",
      {
        cardOrder: cards.map((c) => c.id),
        totalCards: cards.length,
        timestamp: new Date().toISOString(),
      },
    );
    localStorage.setItem("stockDashboard_cardOrder", JSON.stringify(cards));
  }, [cards]);

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      console.log("🔄 [StockDashboard] Reordenando cards:", {
        activeId: active.id,
        overId: over.id,
        beforeOrder: cards.map((c) => c.id),
      });

      setCards((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);

        console.log("✅ [StockDashboard] Nova ordem dos cards:", {
          afterOrder: newOrder.map((c) => c.id),
          movedFrom: oldIndex,
          movedTo: newIndex,
        });

        return newOrder;
      });

      toast({
        title: "Cards reordenados",
        description:
          "A ordem dos cards foi atualizada e salva automaticamente.",
      });
    }
  };

  // Handle color change
  const handleColorChange = (
    cardId: string,
    color: string,
    bgColor: string,
  ) => {
    setCards((prev) =>
      prev.map((card) =>
        card.id === cardId ? { ...card, color, bgColor } : card,
      ),
    );

    toast({
      title: "Cor atualizada",
      description: "A cor do card foi alterada com sucesso.",
    });
  };

  // Reset to default
  const resetToDefault = () => {
    console.log("🔄 [StockDashboard] Resetando cards para configuração padrão");
    setCards(defaultCards);
    localStorage.removeItem("stockDashboard_cardOrder");
    console.log("✅ [StockDashboard] Cards resetados e localStorage limpo");
    toast({
      title: "Configurações resetadas",
      description: "Os cards foram restaurados para a configuração padrão.",
    });
  };

  // Use database hooks
  const { materials, isLoading: materialsLoading } = useMaterials();
  const { products, isLoading: productsLoading } = useProducts();
  const { resaleProducts, isLoading: resaleProductsLoading } =
    useResaleProducts();
  const {
    stockItems,
    addStockItem,
    updateStockItem,
    isLoading: stockLoading,
  } = useStockItems();

  const { removeStockItemByItemId } = useStockItems();
  const { averageCostPerTire, synchronizedCostData } =
    useCostCalculationOptions();

  const handleStockUpdate = async (
    itemId: string,
    itemType: "material" | "product",
    quantity: number,
    operation: "add" | "remove",
    unitPrice?: number,
    itemName?: string,
  ) => {
    console.log(`🔄 [StockDashboard] Atualizando estoque:`, {
      itemId,
      itemType,
      quantity,
      operation,
      unitPrice,
      itemName,
    });

    const existingStock = stockItems.find(
      (item) => item.item_id === itemId && item.item_type === itemType,
    );

    if (existingStock) {
      // Update existing stock item
      if (operation === "add") {
        const newQuantity = existingStock.quantity + quantity;
        let newUnitCost = existingStock.unit_cost;

        // Calculate weighted average cost if adding with a price
        if (unitPrice && unitPrice > 0) {
          const currentTotalValue =
            existingStock.quantity * existingStock.unit_cost;
          const newTotalValue = quantity * unitPrice;
          newUnitCost = (currentTotalValue + newTotalValue) / newQuantity;
        }

        const updateData = {
          quantity: newQuantity,
          unit_cost: newUnitCost,
          total_value: newQuantity * newUnitCost,
          last_updated: new Date().toISOString(),
        };

        await updateStockItem(existingStock.id, updateData);

        console.log(
          `✅ [StockDashboard] Estoque atualizado (add):`,
          updateData,
        );
      } else {
        // Remove operation - keep same unit cost
        const newQuantity = Math.max(0, existingStock.quantity - quantity);
        const updateData = {
          quantity: newQuantity,
          total_value: newQuantity * existingStock.unit_cost,
          last_updated: new Date().toISOString(),
        };

        await updateStockItem(existingStock.id, updateData);

        console.log(
          `✅ [StockDashboard] Estoque atualizado (remove):`,
          updateData,
        );
      }
    } else {
      // Create new stock item
      let sourceItem;
      let finalItemName = itemName;

      if (itemType === "material") {
        sourceItem = materials.find((m) => m.id === itemId);
      } else {
        // Check both final products and resale products
        sourceItem =
          products.find((p) => p.id === itemId) ||
          resaleProducts.find((p) => p.id === itemId);
      }

      // Use provided itemName or fallback to sourceItem name
      if (!finalItemName && sourceItem) {
        finalItemName = sourceItem.name;
      }

      if (sourceItem && operation === "add" && finalItemName) {
        const cost = unitPrice || 0;
        const newStockItem = {
          item_id: itemId,
          item_name: finalItemName,
          item_type: itemType,
          unit: sourceItem.unit,
          quantity: quantity,
          unit_cost: cost,
          total_value: quantity * cost,
          last_updated: new Date().toISOString(),
        };

        console.log(
          `🆕 [StockDashboard] Criando novo item de estoque:`,
          newStockItem,
        );
        await addStockItem(newStockItem);
      }
    }
  };

  const handleSetMinLevel = async (
    itemId: string,
    itemType: "material" | "product",
    minLevel: number,
  ) => {
    const stockItem = stockItems.find(
      (item) => item.item_id === itemId && item.item_type === itemType,
    );

    if (stockItem) {
      const updateData = {
        min_level: minLevel,
        last_updated: new Date().toISOString(),
      };

      await updateStockItem(stockItem.id, updateData);

      console.log(
        `🔧 [StockDashboard] Dados enviados para updateStockItem (min):`,
        updateData,
      );
    }
  };

  const getMaterialStockItems = () => {
    return stockItems.filter((item) => item.item_type === "material");
  };

  const getProductStockItems = () => {
    return stockItems.filter((item) => item.item_type === "product");
  };

  // Get all products and stock items (no filtering by type here)
  const getAllProducts = () => {
    return products.filter((p) => !p.archived);
  };

  const getAllResaleProducts = () => {
    return resaleProducts.filter((p) => !p.archived);
  };

  const getAllProductStockItems = () => {
    return stockItems.filter((item) => item.item_type === "product");
  };

  // Calculate separated metrics for dashboard by type
  const calculateMetrics = () => {
    console.log(
      "🔍 [StockDashboard] Calculando métricas separadas do dashboard:",
      {
        totalStockItems: stockItems.length,
        stockItemsDetails: stockItems.map((item) => ({
          id: item.id,
          item_id: item.item_id,
          item_name: item.item_name,
          item_type: item.item_type,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total_value: item.total_value,
          min_level: item.min_level,
        })),
      },
    );

    // Separar itens de estoque por tipo (incluindo quantidade zero para debug)
    const materialStockItems = stockItems.filter(
      (item) => item.item_type === "material",
    );
    const productStockItems = stockItems.filter(
      (item) => item.item_type === "product",
    );

    // Calculate material types metrics
    const totalMaterialsRegistered = materials.length;
    const materialTypesInStock = materialStockItems.filter(
      (item) => item.quantity > 0,
    ).length;

    console.log(
      `📊 [StockDashboard] Tipos de Material - Total cadastrados: ${totalMaterialsRegistered}, Em estoque: ${materialTypesInStock}`,
    );

    console.log(
      `📦 [StockDashboard] Matérias-primas no estoque: ${materialStockItems.length}`,
      materialStockItems.map((item) => ({
        name: item.item_name,
        quantity: item.quantity,
        value: item.total_value,
      })),
    );
    console.log(
      `📦 [StockDashboard] Produtos no estoque: ${productStockItems.length}`,
      productStockItems.map((item) => ({
        name: item.item_name,
        quantity: item.quantity,
        value: item.total_value,
      })),
    );

    // Separar produtos finais e de revenda
    const finalProductIds = getAllProducts().map((p) => p.id);
    const resaleProductIds = getAllResaleProducts().map((p) => p.id);

    console.log("🔍 [StockDashboard] IDs dos produtos cadastrados:", {
      finalProductIds,
      resaleProductIds,
      finalProductNames: getAllProducts().map((p) => ({
        id: p.id,
        name: p.name,
      })),
      resaleProductNames: getAllResaleProducts().map((p) => ({
        id: p.id,
        name: p.name,
      })),
    });

    const finalProductStockItems = productStockItems.filter((item) =>
      finalProductIds.includes(item.item_id),
    );
    const resaleProductStockItems = productStockItems.filter((item) =>
      resaleProductIds.includes(item.item_id),
    );

    console.log(
      `🏭 [StockDashboard] Produtos finais em estoque: ${finalProductStockItems.length}`,
      finalProductStockItems.map((item) => ({
        name: item.item_name,
        quantity: item.quantity,
        value: item.total_value,
      })),
    );
    console.log(
      `🛒 [StockDashboard] Produtos revenda em estoque: ${resaleProductStockItems.length}`,
      resaleProductStockItems.map((item) => ({
        name: item.item_name,
        quantity: item.quantity,
        value: item.total_value,
      })),
    );

    // Calcular quantidades totais (incluindo itens com quantidade zero)
    const materialTotalQuantity = materialStockItems.reduce((sum, item) => {
      // Garantir que quantity seja um número válido
      let quantity = 0;

      // Convert to number and validate
      const numericQuantity = Number(item.quantity);
      if (!isNaN(numericQuantity) && numericQuantity >= 0) {
        quantity = numericQuantity;
      }

      console.log(
        `📊 Material ${item.item_name}: ${quantity} (original: ${item.quantity}, type: ${typeof item.quantity})`,
      );
      return sum + quantity;
    }, 0);
    const finalProductTotalQuantity = finalProductStockItems.reduce(
      (sum, item) =>