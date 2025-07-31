import React, { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  TrendingUp,
  Calendar,
  Filter,
  X,
  CalendarDays,
  BarChart3,
  DollarSign,
  Target,
  Palette,
  Settings,
  RotateCcw,
  ShoppingCart,
} from "lucide-react";
import type {
  CashFlowEntry,
  StockItem,
  ResaleProduct,
} from "@/types/financial";
import { useResaleProducts } from "@/hooks/useDataPersistence";

interface ResaleProductProfitManagerProps {
  cashFlowEntries?: CashFlowEntry[];
  stockItems?: StockItem[];
  isLoading?: boolean;
}

interface ResaleProfitData {
  productName: string;
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  averageProfitPerUnit: number;
  salesCount: number;
}

const ResaleProductProfitManager = ({
  cashFlowEntries = [],
  stockItems = [],
  isLoading = false,
}: ResaleProductProfitManagerProps) => {
  // Estados para filtros
  const [dateFilter, setDateFilter] = useState("last30days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [sortBy, setSortBy] = useState<"profit" | "revenue" | "margin">(
    "profit",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Estados para configuração de cores
  const [showColorSettings, setShowColorSettings] = useState(false);
  const [colorSettings, setColorSettings] = useState({
    profitColor: "#06B6D4", // Ciano para produtos de revenda
    revenueColor: "#3B82F6", // Azul para receita
    costColor: "#EF4444", // Vermelho para custo
    marginColor: "#F59E0B", // Laranja para margem
  });

  // Hook para produtos de revenda
  const { resaleProducts, isLoading: resaleProductsLoading } =
    useResaleProducts();

  // Carregar configurações salvas do localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem(
      "resaleProductProfitColorSettings",
    );
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setColorSettings((prev) => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error("Erro ao carregar configurações de cores:", error);
      }
    }
  }, []);

  // Salvar configurações no localStorage
  const saveColorSettings = () => {
    localStorage.setItem(
      "resaleProductProfitColorSettings",
      JSON.stringify(colorSettings),
    );
  };

  // Resetar cores para o padrão
  const resetToDefaultColors = () => {
    const defaultSettings = {
      profitColor: "#06B6D4",
      revenueColor: "#3B82F6",
      costColor: "#EF4444",
      marginColor: "#F59E0B",
    };
    setColorSettings(defaultSettings);
    localStorage.setItem(
      "resaleProductProfitColorSettings",
      JSON.stringify(defaultSettings),
    );
  };

  // Atualizar cor específica
  const updateColor = (key: string, value: string) => {
    setColorSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Filter cash flow entries by date
  const getFilteredSales = () => {
    const today = new Date();
    let filteredEntries = cashFlowEntries.filter(
      (entry) => entry.type === "income" && entry.category === "venda",
    );

    switch (dateFilter) {
      case "today":
        const todayStr = today.toISOString().split("T")[0];
        filteredEntries = filteredEntries.filter(
          (entry) => entry.transaction_date === todayStr,
        );
        break;
      case "last7days":
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredEntries = filteredEntries.filter((entry) => {
          const entryDate = new Date(entry.transaction_date);
          return entryDate >= last7Days && entryDate <= today;
        });
        break;
      case "last30days":
        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredEntries = filteredEntries.filter((entry) => {
          const entryDate = new Date(entry.transaction_date);
          return entryDate >= last30Days && entryDate <= today;
        });
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          filteredEntries = filteredEntries.filter((entry) => {
            const entryDate = new Date(entry.transaction_date);
            return entryDate >= startDate && entryDate <= endDate;
          });
        }
        break;
    }

    return filteredEntries;
  };

  // Extract product info from sale description
  const extractProductInfoFromSale = (description: string) => {
    try {
      if (!description || description.trim() === "") {
        return null;
      }

      const productIdMatch = description.match(/ID_Produto: ([^\s|]+)/);
      const quantityMatch = description.match(/Qtd: ([0-9.,]+)/);
      const productNameMatch = description.match(/Produto: ([^|]+)/);
      const unitPriceMatch = description.match(/Preço Unit: R\$\s*([0-9.,]+)/);

      if (productIdMatch && quantityMatch) {
        return {
          productId: productIdMatch[1],
          quantity: parseFloat(quantityMatch[1].replace(",", ".")),
          productName: productNameMatch?.[1]?.trim() || "",
          unitPrice: unitPriceMatch
            ? parseFloat(unitPriceMatch[1].replace(",", "."))
            : 0,
        };
      }
    } catch (error) {
      console.error("Erro ao extrair informações do produto:", error);
    }
    return null;
  };

  // Check if a product is a resale product
  const isResaleProduct = (productName: string) => {
    return resaleProducts.some(
      (resaleProduct) =>
        resaleProduct.name.toLowerCase().trim() ===
          productName.toLowerCase().trim() && !resaleProduct.archived,
    );
  };

  // Get cost for resale product from stock items
  const getResaleProductCost = (productName: string) => {
    // Find the resale product
    const resaleProduct = resaleProducts.find(
      (product) =>
        product.name.toLowerCase().trim() ===
          productName.toLowerCase().trim() && !product.archived,
    );

    if (!resaleProduct) {
      return 0;
    }

    // Find the stock item for this resale product
    const stockItem = stockItems.find(
      (item) =>
        item.item_id === resaleProduct.id && item.item_type === "product",
    );

    return stockItem ? stockItem.unit_cost : 0;
  };

  // Calculate profit data for resale products only
  const profitData = useMemo(() => {
    const salesEntries = getFilteredSales();
    const productMap = new Map<string, ResaleProfitData>();

    salesEntries.forEach((entry) => {
      const productInfo = extractProductInfoFromSale(entry.description || "");
      let productName = "Produto Não Identificado";
      let quantity = 1;

      if (productInfo && productInfo.productName) {
        productName = productInfo.productName;
        quantity = productInfo.quantity;
      } else {
        // Fallback: try to extract product name from description
        if (entry.description) {
          const match = entry.description.match(/Produto: ([^|]+)/);
          if (match) {
            productName = match[1].trim();
          }
        }
      }

      // Only process if it's a resale product
      if (!isResaleProduct(productName)) {
        return;
      }

      const existing = productMap.get(productName) || {
        productName,
        totalSales: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        profitMargin: 0,
        averageProfitPerUnit: 0,
        salesCount: 0,
      };

      // Calculate cost using stock item unit cost
      const unitCost = getResaleProductCost(productName);
      const revenue = entry.amount;
      const totalCostForSale = unitCost * quantity;
      const profit = revenue - totalCostForSale;

      existing.totalSales += quantity;
      existing.totalRevenue += revenue;
      existing.totalCost += totalCostForSale;
      existing.totalProfit += profit;
      existing.salesCount += 1;

      productMap.set(productName, existing);
    });

    // Calculate derived metrics
    const result = Array.from(productMap.values()).map((data) => ({
      ...data,
      profitMargin:
        data.totalRevenue > 0
          ? (data.totalProfit / data.totalRevenue) * 100
          : 0,
      averageProfitPerUnit:
        data.totalSales > 0 ? data.totalProfit / data.totalSales : 0,
    }));

    // Sort data
    result.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case "revenue":
          aValue = a.totalRevenue;
          bValue = b.totalRevenue;
          break;
        case "margin":
          aValue = a.profitMargin;
          bValue = b.profitMargin;
          break;
        case "profit":
        default:
          aValue = a.totalProfit;
          bValue = b.totalProfit;
          break;
      }
      return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
    });

    return result;
  }, [
    cashFlowEntries,
    dateFilter,
    customStartDate,
    customEndDate,
    sortBy,
    sortOrder,
    resaleProducts,
    stockItems,
  ]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalRevenue = profitData.reduce(
      (sum, item) => sum + item.totalRevenue,
      0,
    );
    const totalCost = profitData.reduce((sum, item) => sum + item.totalCost, 0);
    const totalProfit = profitData.reduce(
      (sum, item) => sum + item.totalProfit,
      0,
    );
    const totalSales = profitData.reduce(
      (sum, item) => sum + item.totalSales,
      0,
    );
    const averageProfitPerUnit = totalSales > 0 ? totalProfit / totalSales : 0;
    const overallProfitMargin =
      totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalCost,
      totalProfit,
      totalSales,
      averageProfitPerUnit,
      overallProfitMargin,
    };
  }, [profitData]);

  // Limpar filtros
  const handleClearFilters = () => {
    setDateFilter("last30days");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  // Verificar se há filtros ativos
  const hasActiveFilters =
    dateFilter !== "last30days" || customStartDate || customEndDate;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;

      // Safe access to data properties with fallback values and type checking
      const productName = data?.productName || data?.fullName || "Produto";
      const totalRevenue = Number(data?.totalRevenue || data?.receita || 0);
      const totalCost = Number(data?.totalCost || data?.custo || 0);
      const totalProfit = Number(data?.totalProfit || data?.lucro || 0);
      const profitMargin = Number(data?.profitMargin || data?.margem || 0);
      const totalSales = Number(data?.totalSales || data?.vendas || 0);
      const averageProfitPerUnit = Number(
        data?.averageProfitPerUnit || data?.lucroPorUnidade || 0,
      );

      // Ensure all values are valid numbers before formatting
      const safeFormatCurrency = (value: number) => {
        const numValue = isNaN(value) ? 0 : value;
        return formatCurrency(numValue);
      };

      const safeFormatPercentage = (value: number) => {
        const numValue = isNaN(value) ? 0 : value;
        return numValue.toFixed(1);
      };

      return (
        <div className="bg-factory-800 border border-tire-600/30 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{productName}</p>
          <p className="text-neon-green">
            Receita: {safeFormatCurrency(totalRevenue)}
          </p>
          <p className="text-red-400">Custo: {safeFormatCurrency(totalCost)}</p>
          <p className="text-neon-cyan">
            Lucro: {safeFormatCurrency(totalProfit)}
          </p>
          <p className="text-neon-orange">
            Margem: {safeFormatPercentage(profitMargin)}%
          </p>
          <p className="text-tire-300 text-sm">Vendas: {totalSales} unidades</p>
          <p className="text-tire-300 text-sm">
            Lucro/Unidade: {safeFormatCurrency(averageProfitPerUnit)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (isLoading || resaleProductsLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 bg-factory-900/90 backdrop-blur-md rounded-2xl border border-tire-700/30">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-factory-700/50 rounded w-1/3"></div>
          <div className="h-96 bg-factory-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-factory-900/90 backdrop-blur-md rounded-2xl border border-tire-700/30">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-neon-cyan" />
                <TrendingUp className="h-5 w-5 text-neon-green" />
                <DollarSign className="h-5 w-5 text-neon-blue" />
              </div>
              Lucro Produto Revenda
            </h3>
            <p className="text-tire-300 mt-2">
              Análise de lucro específica para produtos de revenda
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Botão de Configurações de Cores */}
            <Dialog
              open={showColorSettings}
              onOpenChange={setShowColorSettings}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white hover:bg-factory-600/50 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configurar Cores
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-factory-800 border-tire-600/30 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center gap-2">
                    <Palette className="h-5 w-5 text-neon-cyan" />
                    Configurações de Cores - Produtos Revenda
                  </DialogTitle>
                  <DialogDescription className="text-tire-300">
                    Personalize as cores das colunas do gráfico de lucro para
                    produtos de revenda
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white flex items-center gap-2">
                      <Settings className="h-4 w-4 text-neon-blue" />
                      Cores do Gráfico
                    </h4>

                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label className="text-tire-300">Lucro</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={colorSettings.profitColor}
                            onChange={(e) =>
                              updateColor("profitColor", e.target.value)
                            }
                            className="w-12 h-8 p-1 bg-factory-700/50 border-tire-600/30"
                          />
                          <Input
                            type="text"
                            value={colorSettings.profitColor}
                            onChange={(e) =>
                              updateColor("profitColor", e.target.value)
                            }
                            className="bg-factory-700/50 border-tire-600/30 text-white"
                            placeholder="#06B6D4"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-tire-300">Receita</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={colorSettings.revenueColor}
                            onChange={(e) =>
                              updateColor("revenueColor", e.target.value)
                            }
                            className="w-12 h-8 p-1 bg-factory-700/50 border-tire-600/30"
                          />
                          <Input
                            type="text"
                            value={colorSettings.revenueColor}
                            onChange={(e) =>
                              updateColor("revenueColor", e.target.value)
                            }
                            className="bg-factory-700/50 border-tire-600/30 text-white"
                            placeholder="#3B82F6"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-tire-300">Custo</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            value={colorSettings.costColor}
                            onChange={(e) =>
                              updateColor("costColor", e.target.value)
                            }
                            className="w-12 h-8 p-1 bg-factory-700/50 border-tire-600/30"
                          />
                          <Input
                            type="text"
                            value={colorSettings.costColor}
                            onChange={(e) =>
                              updateColor("costColor", e.target.value)
                            }
                            className="bg-factory-700/50 border-tire-600/30 text-white"
                            placeholder="#EF4444"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={resetToDefaultColors}
                    className="bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white hover:bg-factory-600/50 flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Resetar Padrão
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowColorSettings(false)}
                      className="bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white hover:bg-factory-600/50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        saveColorSettings();
                        setShowColorSettings(false);
                      }}
                      className="bg-neon-cyan hover:bg-neon-cyan/80 text-white"
                    >
                      Salvar Configurações
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-tire-300 hover:text-white hover:bg-tire-700/50 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Receita Total</p>
                <p className="text-2xl font-bold text-neon-green">
                  {formatCurrency(summaryMetrics.totalRevenue)}
                </p>
              </div>
              <div className="text-neon-green">
                <DollarSign className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Lucro Total</p>
                <p className="text-2xl font-bold text-neon-cyan">
                  {formatCurrency(summaryMetrics.totalProfit)}
                </p>
              </div>
              <div className="text-neon-cyan">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Lucro Médio/Unidade</p>
                <p className="text-2xl font-bold text-neon-purple">
                  {formatCurrency(summaryMetrics.averageProfitPerUnit)}
                </p>
              </div>
              <div className="text-neon-purple">
                <Target className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Margem de Lucro</p>
                <p className="text-2xl font-bold text-neon-orange">
                  {summaryMetrics.overallProfitMargin.toFixed(1)}%
                </p>
              </div>
              <div className="text-neon-orange">
                <BarChart3 className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="mb-6 p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-neon-cyan" />
          <Label className="text-tire-200 font-medium">
            Filtros de Período
          </Label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-2">
            <Label className="text-tire-300 text-sm">Período:</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-factory-800 border-tire-600/30">
                <SelectItem
                  value="today"
                  className="text-white hover:bg-tire-700/50"
                >
                  Hoje
                </SelectItem>
                <SelectItem
                  value="last7days"
                  className="text-white hover:bg-tire-700/50"
                >
                  Últimos 7 dias
                </SelectItem>
                <SelectItem
                  value="last30days"
                  className="text-white hover:bg-tire-700/50"
                >
                  Últimos 30 dias
                </SelectItem>
                <SelectItem
                  value="custom"
                  className="text-white hover:bg-tire-700/50"
                >
                  Período personalizado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-tire-300 text-sm">Ordenar por:</Label>
            <Select
              value={sortBy}
              onValueChange={(value: "profit" | "revenue" | "margin") =>
                setSortBy(value)
              }
            >
              <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-factory-800 border-tire-600/30">
                <SelectItem
                  value="profit"
                  className="text-white hover:bg-tire-700/50"
                >
                  Lucro
                </SelectItem>
                <SelectItem
                  value="revenue"
                  className="text-white hover:bg-tire-700/50"
                >
                  Receita
                </SelectItem>
                <SelectItem
                  value="margin"
                  className="text-white hover:bg-tire-700/50"
                >
                  Margem
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-tire-300 text-sm">Ordem:</Label>
            <Select
              value={sortOrder}
              onValueChange={(value: "asc" | "desc") => setSortOrder(value)}
            >
              <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-factory-800 border-tire-600/30">
                <SelectItem
                  value="desc"
                  className="text-white hover:bg-tire-700/50"
                >
                  Maior para Menor
                </SelectItem>
                <SelectItem
                  value="asc"
                  className="text-white hover:bg-tire-700/50"
                >
                  Menor para Maior
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-tire-300 text-sm">Tipo de Gráfico:</Label>
            <Select
              value={chartType}
              onValueChange={(value: "bar" | "line") => setChartType(value)}
            >
              <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-factory-800 border-tire-600/30">
                <SelectItem
                  value="bar"
                  className="text-white hover:bg-tire-700/50"
                >
                  Barras
                </SelectItem>
                <SelectItem
                  value="line"
                  className="text-white hover:bg-tire-700/50"
                >
                  Linha
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {dateFilter === "custom" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="space-y-2">
              <Label className="text-tire-300 text-sm">Data Inicial:</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-tire-400" />
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="pl-9 bg-factory-700/50 border-tire-600/30 text-white"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-tire-300 text-sm">Data Final:</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-tire-400" />
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="pl-9 bg-factory-700/50 border-tire-600/30 text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Gráfico */}
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-neon-cyan" />
            Lucro por Produto de Revenda
            {profitData.length > 0 && (
              <span className="text-sm font-normal text-tire-400">
                ({profitData.length} produtos)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profitData.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-tire-500 mx-auto mb-3" />
              <p className="text-tire-400">
                Nenhuma venda de produto de revenda encontrada no período
                selecionado
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              {chartType === "bar" ? (
                <BarChart
                  data={profitData.map((item) => ({
                    name:
                      item.productName.length > 12
                        ? item.productName.substring(0, 12) + "..."
                        : item.productName,
                    fullName: item.productName || "Produto",
                    productName: item.productName || "Produto",
                    lucro: Number(item.totalProfit || 0),
                    totalProfit: Number(item.totalProfit || 0),
                    receita: Number(item.totalRevenue || 0),
                    totalRevenue: Number(item.totalRevenue || 0),
                    custo: Number(item.totalCost || 0),
                    totalCost: Number(item.totalCost || 0),
                    margem: Number(item.profitMargin || 0),
                    profitMargin: Number(item.profitMargin || 0),
                    vendas: Number(item.totalSales || 0),
                    totalSales: Number(item.totalSales || 0),
                    lucroPorUnidade: Number(item.averageProfitPerUnit || 0),
                    averageProfitPerUnit: Number(
                      item.averageProfitPerUnit || 0,
                    ),
                  }))}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 80,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) =>
                      `R$ ${value.toLocaleString("pt-BR")}`
                    }
                    label={{
                      value: "Valor (R$)",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fill: "#9CA3AF",
                        fontSize: "12px",
                      },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="lucro"
                    name="Lucro"
                    fill={colorSettings.profitColor}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart
                  data={profitData.map((item) => ({
                    name:
                      item.productName.length > 12
                        ? item.productName.substring(0, 12) + "..."
                        : item.productName,
                    fullName: item.productName || "Produto",
                    productName: item.productName || "Produto",
                    lucro: Number(item.totalProfit || 0),
                    totalProfit: Number(item.totalProfit || 0),
                    receita: Number(item.totalRevenue || 0),
                    totalRevenue: Number(item.totalRevenue || 0),
                    custo: Number(item.totalCost || 0),
                    totalCost: Number(item.totalCost || 0),
                    margem: Number(item.profitMargin || 0),
                    profitMargin: Number(item.profitMargin || 0),
                    vendas: Number(item.totalSales || 0),
                    totalSales: Number(item.totalSales || 0),
                    lucroPorUnidade: Number(item.averageProfitPerUnit || 0),
                    averageProfitPerUnit: Number(
                      item.averageProfitPerUnit || 0,
                    ),
                  }))}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 80,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#374151"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickFormatter={(value) =>
                      `R$ ${value.toLocaleString("pt-BR")}`
                    }
                    label={{
                      value: "Valor (R$)",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fill: "#9CA3AF",
                        fontSize: "12px",
                      },
                    }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="lucro"
                    name="Lucro"
                    stroke={colorSettings.profitColor}
                    strokeWidth={3}
                    dot={{
                      fill: colorSettings.profitColor,
                      strokeWidth: 2,
                      r: 4,
                    }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResaleProductProfitManager;
