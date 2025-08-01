import React, { useState, useEffect } from "react";
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
import { Package, Calculator, Save, Edit3, Search } from "lucide-react";
import { useStockItems, useProducts } from "@/hooks/useDataPersistence";

interface FinalProductsStockProps {
  isLoading?: boolean;
}

interface ProductAnalysis {
  productId: string;
  productName: string;
  measures: string;
  totalRevenue: number;
  totalSold: number;
  costPerTire: number;
  profit: number;
  profitMargin: number;
  quantity: number;
  editableQuantity: number;
  totalValue: number;
  isEditing: boolean;
}

const FinalProductsStock: React.FC<FinalProductsStockProps> = ({ isLoading = false }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "in-stock" | "out-of-stock">("all");
  const [showMinLevelDialog, setShowMinLevelDialog] = useState(false);
  const [selectedProductForMinLevel, setSelectedProductForMinLevel] = useState<string>("");
  const [minLevel, setMinLevel] = useState<string>("");

  const { stockItems, isLoading: stockLoading, updateStockItem } = useStockItems();
  const { products, isLoading: productsLoading } = useProducts();
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Função para extrair as medidas do nome do produto
  const extractMeasures = (productName: string): string => {
    // Regex para capturar padrões como "175 70 14", "185 65 15", etc.
    const measurePattern = /(\d{3}\s\d{2}\s\d{2})/;
    const match = productName.match(measurePattern);
    return match ? match[1] : productName;
  };

  // Função para obter custo específico do TireCostManager
  const getSpecificCost = (productName: string): number => {
    try {
      // Buscar dados específicos salvos pelo TireCostManager
      const productKey = `tireAnalysis_${productName.toLowerCase().replace(/\s+/g, "_")}`;
      const savedAnalysis = localStorage.getItem(productKey);

      if (savedAnalysis) {
        const analysis = JSON.parse(savedAnalysis);
        if (analysis.costPerTire && analysis.costPerTire > 0) {
          return analysis.costPerTire;
        }
      }

      // Fallback para custo médio sincronizado
      const synchronizedData = localStorage.getItem("dashboard_averageCostPerTire");
      if (synchronizedData) {
        const data = JSON.parse(synchronizedData);
        if (data.value && data.value > 0) {
          return data.value;
        }
      }

      return 0;
    } catch (error) {
      console.error("Erro ao buscar custo específico:", error);
      return 0;
    }
  };

  useEffect(() => {
    if (!stockItems.length || !products.length) return;

    // Filtrar apenas produtos finais em estoque
    const finalProductStockItems = stockItems.filter(item => 
      item.item_type === "product" && item.quantity > 0
    );

    const analysis = finalProductStockItems.map(stockItem => {
      const product = products.find(p => p.id === stockItem.item_id);
      if (!product) return null;

      const costPerTire = getSpecificCost(product.name);
      const measures = extractMeasures(product.name);
      const quantity = stockItem.quantity || 0;
      const totalValue = quantity * costPerTire;

      // Calcular valores baseados no estoque e vendas (mockado por enquanto)
      const totalSold = 0; // TODO: Integrar com dados de vendas
      const totalRevenue = totalSold * (product.price || 0);
      const profit = totalRevenue - (totalSold * costPerTire);
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

      return {
        productId: stockItem.item_id,
        productName: product.name,
        measures,
        totalRevenue,
        totalSold,
        costPerTire,
        profit,
        profitMargin,
        quantity,
        editableQuantity: quantity,
        totalValue,
        isEditing: false
      };
    }).filter(Boolean) as ProductAnalysis[];

    setProductAnalysis(analysis);
  }, [stockItems, products]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleQuantityChange = (productId: string, newQuantity: string) => {
    const numericQuantity = parseInt(newQuantity) || 0;
    setProductAnalysis(prev => 
      prev.map(product => 
        product.productId === productId 
          ? { 
              ...product, 
              editableQuantity: numericQuantity,
              totalValue: numericQuantity * product.costPerTire
            }
          : product
      )
    );
  };

  const handleEditToggle = (productId: string) => {
    setProductAnalysis(prev => 
      prev.map(product => 
        product.productId === productId 
          ? { ...product, isEditing: !product.isEditing }
          : product
      )
    );
  };

  const handleSaveQuantity = async (productId: string) => {
    const product = productAnalysis.find(p => p.productId === productId);
    if (!product) return;

    setIsSaving(true);
    try {
      const stockItem = stockItems.find(item => item.item_id === productId);
      if (stockItem) {
        // Calcular novo valor total baseado na quantidade editável
        const newTotalValue = product.editableQuantity * product.costPerTire;

        await updateStockItem(stockItem.id, {
          quantity: product.editableQuantity,
          total_value: newTotalValue
        });

        // Atualizar estado local
        setProductAnalysis(prev => 
          prev.map(p => 
            p.productId === productId 
              ? { 
                  ...p, 
                  quantity: product.editableQuantity,
                  totalValue: newTotalValue,
                  isEditing: false 
                }
              : p
          )
        );

        console.log(`✅ Quantidade atualizada para ${product.productName}: ${product.editableQuantity} unidades, Valor total: ${formatCurrency(newTotalValue)}`);
      }
    } catch (error) {
      console.error("Erro ao salvar quantidade:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateGrandTotal = () => {
    return filteredProductAnalysis.reduce((total, product) => total + product.totalValue, 0);
  };

  // Apply search and filter logic
  const filteredProductAnalysis = productAnalysis.filter(product => {
    const matchesSearch = 
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.measures.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterType === "all" || 
      (filterType === "in-stock" && product.quantity > 0) ||
      (filterType === "out-of-stock" && product.quantity === 0);

    return matchesSearch && matchesFilter;
  });

  if (isLoading || stockLoading || productsLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 bg-factory-900/90 backdrop-blur-md rounded-2xl border border-tire-700/30">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-factory-700/50 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-factory-700/50 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-factory-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-factory-900/90 backdrop-blur-md rounded-2xl border border-tire-700/30">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-neon-green" />
              </div>
              Produtos Finais
              <span className="text-neon-green text-sm">({productAnalysis.length} tipos)</span>
            </h3>
            <p className="text-tire-300 mt-2">
              Análise de custos e controle de quantidade por tipo de pneu
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6 p-4 bg-factory-800/30 rounded-lg border border-tire-600/20">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-tire-400" />
            <Input
              placeholder="Buscar produtos por nome ou medida..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-factory-700/50 border-tire-600/30 text-white"
            />
          </div>
        </div>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48 bg-factory-700/50 border-tire-600/30 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-factory-800 border-tire-600/30">
            <SelectItem value="all" className="text-white hover:bg-tire-700/50">
              Todos os Produtos
            </SelectItem>
            <SelectItem value="in-stock" className="text-white hover:bg-tire-700/50">
              Com Estoque
            </SelectItem>
            <SelectItem value="out-of-stock" className="text-white hover:bg-tire-700/50">
              Sem Estoque
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Métricas de Resumo */}
      {productAnalysis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-factory-800/50 border border-tire-600/30 rounded-lg p-4">
            <p className="text-tire-400 text-sm">Total de Tipos</p>
            <p className="text-2xl font-bold text-white">{filteredProductAnalysis.length}</p>
            <p className="text-xs text-tire-400 mt-1">
              {productAnalysis.length !== filteredProductAnalysis.length && 
                `de ${productAnalysis.length} total`}
            </p>
          </div>

          <div className="bg-factory-800/50 border border-tire-600/30 rounded-lg p-4">
            <p className="text-tire-400 text-sm">Quantidade Total</p>
            <p className="text-2xl font-bold text-neon-cyan">
              {filteredProductAnalysis.reduce((total, product) => total + product.quantity, 0)} unidades
            </p>
          </div>

          <div className="bg-factory-800/50 border border-tire-600/30 rounded-lg p-4">
            <p className="text-tire-400 text-sm">Custo Médio por Pneu</p>
            <p className="text-2xl font-bold text-neon-orange">
              {formatCurrency(filteredProductAnalysis.length > 0 
                ? filteredProductAnalysis.reduce((sum, p) => sum + p.costPerTire, 0) / filteredProductAnalysis.length 
                : 0
              )}
            </p>
          </div>

          <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4">
            <p className="text-tire-400 text-sm">Valor Total do Estoque</p>
            <p className="text-2xl font-bold text-neon-green">
              {formatCurrency(calculateGrandTotal())}
            </p>
          </div>
        </div>
      )}

      {/* Lista de Produtos */}
      <div className="space-y-4">
        {filteredProductAnalysis.length === 0 ? (
          <div className="text-center py-12 bg-factory-800/30 rounded-lg border border-tire-600/20">
            <Package className="h-16 w-16 text-tire-500 mx-auto mb-4" />
            <p className="text-tire-400 text-lg">
              {searchTerm || filterType !== "all"
                ? "Nenhum produto encontrado com os filtros aplicados"
                : "Nenhum produto final em estoque"}
            </p>
            {(searchTerm || filterType !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
                className="mt-4 bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white hover:bg-tire-700/50"
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        ) : (
          filteredProductAnalysis.map((product) => (
            <div
              key={product.productId}
              className="p-6 bg-factory-800/50 border border-tire-600/30 rounded-lg hover:bg-factory-800/70 transition-all duration-200"
            >
              {/* Header do Produto */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-white font-semibold text-xl flex items-center gap-2">
                    <span className="text-2xl">🏭</span>
                    {product.measures}
                  </h4>
                  <p className="text-tire-400 text-sm">{product.productName}</p>
                </div>
                <div className="text-right">
                  <span className="text-neon-green font-bold text-2xl">
                    {formatCurrency(product.totalValue)}
                  </span>
                  <p className="text-tire-400 text-sm">Valor Total</p>
                </div>
              </div>

              {/* Controle de Quantidade */}
              <div className="bg-factory-700/30 rounded-lg p-4 border border-tire-600/20">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-tire-300 font-medium text-base flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-neon-orange" />
                    Controle de Quantidade
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditToggle(product.productId)}
                    className="bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white hover:bg-factory-600/50 h-8 px-3"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    {product.isEditing ? "Cancelar" : "Editar"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-tire-400 text-sm mb-1 block">Quantidade Atual</Label>
                    {product.isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        value={product.editableQuantity}
                        onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                        className="bg-factory-700/50 border-tire-600/30 text-white h-10"
                      />
                    ) : (
                      <div className="bg-factory-600/30 border border-tire-600/20 rounded-md px-3 py-2 h-10 flex items-center">
                        <span className="text-white font-medium">{product.quantity} unidades</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-tire-400 text-sm mb-1 block">Custo por Pneu</Label>
                    <div className="bg-factory-600/30 border border-tire-600/20 rounded-md px-3 py-2 h-10 flex items-center">
                      <span className="text-neon-orange font-medium">
                        {formatCurrency(product.costPerTire)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-tire-400 text-sm mb-1 block">Valor Total</Label>
                    <div className="bg-factory-600/30 border border-tire-600/20 rounded-md px-3 py-2 h-10 flex items-center">
                      <span className="text-neon-green font-medium">
                        {formatCurrency(product.isEditing ? product.editableQuantity * product.costPerTire : product.totalValue)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end">
                    {product.isEditing && (
                      <Button
                        size="sm"
                        onClick={() => handleSaveQuantity(product.productId)}
                        disabled={isSaving}
                        className="bg-neon-green/20 border border-neon-green/50 text-neon-green hover:bg-neon-green/30 h-10 px-4 w-full"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FinalProductsStock;