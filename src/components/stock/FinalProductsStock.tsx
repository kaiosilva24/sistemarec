import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Package2,
  Search,
  Settings,
  AlertTriangle,
  Info,
  TrendingUp,
  Factory,
  DollarSign,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Product, StockItem, ProductionEntry } from "@/types/financial";
import {
  useProducts,
  useStockItems,
  useProductionEntries,
  useCostCalculationOptions,
} from "@/hooks/useDataPersistence";

interface FinalProductsStockProps {
  isLoading?: boolean;
}

interface ProductStockInfo {
  product: Product;
  stockItem?: StockItem;
  currentStock: number;
  costPerUnit: number;
  totalValue: number;
  productionEntries: ProductionEntry[];
  lastProduction?: ProductionEntry;
  totalProduced: number;
}

const FinalProductsStock = ({ isLoading = false }: FinalProductsStockProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [isLevelsDialogOpen, setIsLevelsDialogOpen] = useState(false);
  const [minLevel, setMinLevel] = useState("");
  const [selectedItemForLevels, setSelectedItemForLevels] =
    useState<string>("");

  // Hooks para dados
  const { products, isLoading: productsLoading } = useProducts();
  const {
    stockItems,
    updateStockItem,
    isLoading: stockLoading,
  } = useStockItems();
  const { productionEntries, isLoading: productionLoading } =
    useProductionEntries();
  const { averageCostPerTire, synchronizedCostData } =
    useCostCalculationOptions();

  // Cache para custos específicos por produto
  const [productCostCache, setProductCostCache] = useState<{
    [key: string]: number;
  }>({});

  // Função para obter custo específico por produto
  const getSpecificProductCost = useMemo(() => {
    return (productName: string): number => {
      console.log(
        `🔍 [FinalProductsStock] Buscando custo específico para produto: "${productName}"`,
      );

      // Verificar cache primeiro
      if (productCostCache[productName]) {
        console.log(
          `💾 [FinalProductsStock] Custo encontrado no cache para "${productName}": R$ ${productCostCache[productName].toFixed(2)}`,
        );
        return productCostCache[productName];
      }

      // Usar custo médio sincronizado se disponível
      if (averageCostPerTire > 0) {
        console.log(
          `✅ [FinalProductsStock] Usando custo médio sincronizado para "${productName}": R$ ${averageCostPerTire.toFixed(2)}`,
        );
        return averageCostPerTire;
      }

      // Mapeamento de produtos para seus custos conhecidos
      const productCostMap: { [key: string]: number } = {
        "175 70 14 P6": 108.42,
        "175 65 14 P1": 93.75,
        "pneu comum": 95.5,
        "pneu premium": 125.75,
        "pneu especial": 110.25,
        "pneu básico": 85.9,
      };

      const mappedCost = productCostMap[productName];
      if (mappedCost) {
        console.log(
          `✅ [FinalProductsStock] Usando custo mapeado para "${productName}": R$ ${mappedCost.toFixed(2)}`,
        );
        return mappedCost;
      }

      // Valor padrão
      const defaultValue = 101.09;
      console.log(
        `⚠️ [FinalProductsStock] Usando valor padrão para "${productName}": R$ ${defaultValue.toFixed(2)}`,
      );
      return defaultValue;
    };
  }, [productCostCache, averageCostPerTire]);

  // Atualizar cache quando o custo sincronizado mudar
  useEffect(() => {
    if (averageCostPerTire > 0) {
      console.log(
        `🔄 [FinalProductsStock] Atualizando cache com custo sincronizado: R$ ${averageCostPerTire.toFixed(2)}`,
      );
      // Limpar cache para forçar uso do novo custo sincronizado
      setProductCostCache({});
    }
  }, [averageCostPerTire]);

  // Processar dados dos produtos finais
  const finalProductsData = useMemo(() => {
    const finalProducts = products.filter((p) => !p.archived);

    return finalProducts.map((product): ProductStockInfo => {
      // Encontrar item de estoque correspondente
      const stockItem = stockItems.find(
        (item) => item.item_id === product.id && item.item_type === "product",
      );

      // Filtrar entradas de produção para este produto
      const productProductionEntries = productionEntries.filter(
        (entry) => entry.product_id === product.id,
      );

      // Calcular total produzido
      const totalProduced = productProductionEntries.reduce(
        (sum, entry) => sum + (entry.quantity_produced || 0),
        0,
      );

      // Obter última produção
      const lastProduction = productProductionEntries.sort(
        (a, b) =>
          new Date(b.production_date).getTime() -
          new Date(a.production_date).getTime(),
      )[0];

      // Calcular estoque atual
      const currentStock = stockItem?.quantity || 0;

      // Obter custo por unidade
      const costPerUnit = getSpecificProductCost(product.name);

      // Calcular valor total
      const totalValue = currentStock * costPerUnit;

      return {
        product,
        stockItem,
        currentStock,
        costPerUnit,
        totalValue,
        productionEntries: productProductionEntries,
        lastProduction,
        totalProduced,
      };
    });
  }, [products, stockItems, productionEntries, getSpecificProductCost]);

  // Filtrar produtos baseado na busca
  const filteredProducts = useMemo(() => {
    return finalProductsData.filter((productInfo) =>
      productInfo.product.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [finalProductsData, searchTerm]);

  // Calcular métricas gerais
  const metrics = useMemo(() => {
    const totalProducts = finalProductsData.length;
    const productsInStock = finalProductsData.filter(
      (p) => p.currentStock > 0,
    ).length;
    const totalStockQuantity = finalProductsData.reduce(
      (sum, p) => sum + p.currentStock,
      0,
    );
    const totalStockValue = finalProductsData.reduce(
      (sum, p) => sum + p.totalValue,
      0,
    );
    const totalProduced = finalProductsData.reduce(
      (sum, p) => sum + p.totalProduced,
      0,
    );
    const lowStockProducts = finalProductsData.filter(
      (p) => p.stockItem?.min_level && p.currentStock <= p.stockItem.min_level,
    ).length;

    return {
      totalProducts,
      productsInStock,
      totalStockQuantity,
      totalStockValue,
      totalProduced,
      lowStockProducts,
    };
  }, [finalProductsData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleSetMinLevel = async () => {
    if (selectedItemForLevels && minLevel) {
      const productInfo = finalProductsData.find(
        (p) => p.product.id === selectedItemForLevels,
      );

      if (productInfo?.stockItem) {
        const updateData = {
          min_level: parseFloat(minLevel),
          last_updated: new Date().toISOString(),
        };

        await updateStockItem(productInfo.stockItem.id, updateData);
        setMinLevel("");
        setSelectedItemForLevels("");
        setIsLevelsDialogOpen(false);
      }
    }
  };

  const getStockLevel = (productInfo: ProductStockInfo) => {
    if (!productInfo.stockItem?.min_level) return "unknown";
    if (productInfo.currentStock <= productInfo.stockItem.min_level)
      return "low";
    return "normal";
  };

  const getStockLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "text-red-400";
      case "normal":
        return "text-neon-green";
      default:
        return "text-tire-300";
    }
  };

  if (isLoading || productsLoading || stockLoading || productionLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-6 bg-factory-900/90 backdrop-blur-md rounded-2xl border border-tire-700/30">
        <div className="flex items-center justify-center h-64">
          <div className="text-tire-300">Carregando produtos finais...</div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full max-w-6xl mx-auto p-6 bg-factory-900/90 backdrop-blur-md rounded-2xl border border-tire-700/30">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-3">
            <Factory className="h-5 w-5 text-neon-green" />
            Estoque de Produtos Finais
            <span className="text-neon-green text-sm">(Produção)</span>
          </h3>
          <p className="text-tire-300 mt-2">
            Controle de estoque com custo por pneu e integração com produção
          </p>
        </div>

        {/* Métricas Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm">Total de Produtos</p>
                  <p className="text-2xl font-bold text-neon-blue">
                    {metrics.totalProducts}
                  </p>
                  <p className="text-xs text-tire-400 mt-1">
                    {metrics.productsInStock} em estoque
                  </p>
                </div>
                <Package2 className="h-8 w-8 text-neon-blue" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm">Qtd. em Estoque</p>
                  <p className="text-2xl font-bold text-neon-green">
                    {metrics.totalStockQuantity.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-tire-400 mt-1">unidades</p>
                </div>
                <BarChart3 className="h-8 w-8 text-neon-green" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm">Valor do Estoque</p>
                  <p className="text-2xl font-bold text-neon-orange">
                    {formatCurrency(metrics.totalStockValue)}
                  </p>
                  <p className="text-xs text-tire-400 mt-1">
                    Custo sincronizado
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-neon-orange" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-tire-300 text-sm">Total Produzido</p>
                  <p className="text-2xl font-bold text-neon-purple">
                    {metrics.totalProduced.toLocaleString("pt-BR")}
                  </p>
                  <p className="text-xs text-tire-400 mt-1">
                    {metrics.lowStockProducts > 0 && (
                      <span className="text-red-400">
                        {metrics.lowStockProducts} baixo estoque
                      </span>
                    )}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-neon-purple" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações de Sincronização */}
        {synchronizedCostData && (
          <Card className="bg-factory-800/50 border-tire-600/30 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Info className="h-5 w-5 text-neon-blue" />
                <div>
                  <p className="text-white font-medium">
                    Custo Sincronizado: {formatCurrency(averageCostPerTire)}
                    /unidade
                  </p>
                  <p className="text-tire-400 text-sm">
                    Última atualização:{" "}
                    {formatDate(synchronizedCostData.lastUpdated)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controles */}
          <Card className="bg-factory-800/50 border-tire-600/30">
            <CardHeader>
              <CardTitle className="text-tire-200 text-lg flex items-center justify-between">
                Controles
                <Dialog
                  open={isLevelsDialogOpen}
                  onOpenChange={setIsLevelsDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-tire-300 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-factory-800 border-tire-600/30 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Configurar Nível Mínimo de Estoque
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-tire-300">Produto</Label>
                        <Select
                          value={selectedItemForLevels}
                          onValueChange={setSelectedItemForLevels}
                        >
                          <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                            <SelectValue placeholder="Selecione um produto" />
                          </SelectTrigger>
                          <SelectContent className="bg-factory-800 border-tire-600/30">
                            {finalProductsData.map((productInfo) => (
                              <SelectItem
                                key={productInfo.product.id}
                                value={productInfo.product.id}
                                className="text-white hover:bg-tire-700/50"
                              >
                                🏭 {productInfo.product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-tire-300">Nível Mínimo</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={minLevel}
                          onChange={(e) => setMinLevel(e.target.value)}
                          className="bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                          placeholder="Digite o nível mínimo de estoque"
                        />
                      </div>
                      <Button
                        onClick={handleSetMinLevel}
                        className="w-full bg-neon-blue hover:bg-neon-blue/80"
                      >
                        Salvar Nível Mínimo
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-tire-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                />
              </div>
            </CardHeader>
          </Card>

          {/* Lista de Produtos */}
          <Card className="lg:col-span-2 bg-factory-800/50 border-tire-600/30">
            <CardHeader>
              <CardTitle className="text-tire-200 text-lg">
                Produtos em Estoque ({filteredProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Factory className="h-12 w-12 text-tire-500 mx-auto mb-3" />
                    <p className="text-tire-400">
                      {searchTerm
                        ? "Nenhum produto encontrado"
                        : "Nenhum produto final cadastrado"}
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((productInfo) => {
                    const stockLevel = getStockLevel(productInfo);
                    const stockLevelColor = getStockLevelColor(stockLevel);

                    return (
                      <div
                        key={productInfo.product.id}
                        className="p-4 bg-factory-700/30 rounded-lg border border-tire-600/20"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-medium flex items-center gap-2">
                            <span className="text-lg">🏭</span>
                            {productInfo.product.name}
                            <span className="text-xs px-2 py-1 rounded bg-neon-green/20 text-neon-green">
                              Final
                            </span>
                          </h4>
                          <div className="flex items-center gap-2">
                            {stockLevel === "low" && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertTriangle className="h-4 w-4 text-red-400" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Estoque baixo</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            <span
                              className={`text-sm font-medium ${stockLevelColor}`}
                            >
                              {productInfo.currentStock}{" "}
                              {productInfo.product.unit}
                            </span>
                          </div>
                        </div>
                        <div className="text-tire-400 text-sm space-y-1">
                          <div className="flex justify-between">
                            <span>Custo por Unidade:</span>
                            <span className="text-neon-green font-medium">
                              {formatCurrency(productInfo.costPerUnit)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Valor Total em Estoque:</span>
                            <span className="text-neon-blue font-medium">
                              {formatCurrency(productInfo.totalValue)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Produzido:</span>
                            <span className="text-neon-purple">
                              {productInfo.totalProduced.toLocaleString(
                                "pt-BR",
                              )}{" "}
                              {productInfo.product.unit}
                            </span>
                          </div>
                          {productInfo.lastProduction && (
                            <div className="flex justify-between">
                              <span>Última Produção:</span>
                              <span className="text-tire-300">
                                {formatDate(
                                  productInfo.lastProduction.production_date,
                                )}{" "}
                                - {productInfo.lastProduction.quantity_produced}{" "}
                                {productInfo.product.unit}
                              </span>
                            </div>
                          )}
                          {productInfo.stockItem?.min_level && (
                            <>
                              <div className="flex justify-between">
                                <span>Nível Mínimo:</span>
                                <span>
                                  {productInfo.stockItem.min_level}{" "}
                                  {productInfo.product.unit}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={stockLevelColor}>
                                  {stockLevel === "low" && "Estoque Baixo"}
                                  {stockLevel === "normal" && "Estoque Normal"}
                                  {stockLevel === "unknown" &&
                                    "Não Configurado"}
                                </span>
                              </div>
                            </>
                          )}
                          {productInfo.stockItem?.last_updated && (
                            <div className="flex justify-between">
                              <span>Última Atualização:</span>
                              <span>
                                {formatDate(productInfo.stockItem.last_updated)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-tire-400 text-xs">
                              Fonte do Custo:
                            </span>
                            <span className="text-neon-cyan text-xs">
                              {averageCostPerTire > 0
                                ? "TireCostManager (Sincronizado)"
                                : "Mapeamento Local"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default FinalProductsStock;
