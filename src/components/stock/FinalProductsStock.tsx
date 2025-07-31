
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Calculator, Save, Edit3 } from "lucide-react";
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
    return productAnalysis.reduce((total, product) => total + product.totalValue, 0);
  };

  if (isLoading || stockLoading || productsLoading) {
    return (
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-neon-green" />
            Produtos Finais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-factory-700/50 rounded"></div>
            <div className="h-20 bg-factory-700/50 rounded"></div>
            <div className="h-20 bg-factory-700/50 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-neon-green" />
            Produtos Finais
            <span className="text-neon-green text-sm">({productAnalysis.length} tipos)</span>
          </CardTitle>
          <p className="text-tire-300 text-sm">
            Análise de custos e controle de quantidade por tipo de pneu
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {productAnalysis.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-tire-500 mx-auto mb-3" />
                <p className="text-tire-400">Nenhum produto final em estoque</p>
              </div>
            ) : (
              productAnalysis.map((product) => (
                <div
                  key={product.productId}
                  className="p-4 rounded-lg border transition-all bg-factory-700/30 border-tire-600/20 hover:bg-factory-700/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                      {product.measures}
                    </h4>
                    <div className="text-right">
                      <span className="text-neon-green font-bold text-xl">
                        {formatCurrency(product.totalValue)}
                      </span>
                      <p className="text-tire-400 text-sm">Valor Total</p>
                    </div>
                  </div>

                  {/* Seção de Controle de Quantidade */}
                  <div className="bg-factory-600/20 rounded-lg p-3 mb-3 border border-tire-600/30">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-tire-300 font-medium text-base flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-neon-orange" />
                        Controle de Quantidade
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditToggle(product.productId)}
                        className="bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white h-8 px-3"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        {product.isEditing ? "Cancelar" : "Editar"}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-tire-400 text-sm">Quantidade Atual</Label>
                        {product.isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={product.editableQuantity}
                            onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                            className="bg-factory-700/50 border-tire-600/30 text-white h-10 text-base"
                          />
                        ) : (
                          <p className="text-white font-medium text-base">{product.quantity} unidades</p>
                        )}
                      </div>
                      
                      <div>
                        <Label className="text-tire-400 text-sm">Custo por Pneu</Label>
                        <p className="text-neon-orange font-medium text-base">
                          {formatCurrency(product.costPerTire)}
                        </p>
                      </div>
                      
                      <div className="flex items-end">
                        {product.isEditing && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveQuantity(product.productId)}
                            disabled={isSaving}
                            className="bg-neon-green/20 border-neon-green/50 text-neon-green hover:bg-neon-green/30 h-8 px-3 w-full"
                          >
                            <Save className="h-3 w-3 mr-1" />
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
        </CardContent>
      </Card>

      {/* Card de Resumo Total */}
      {productAnalysis.length > 0 && (
        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-neon-orange" />
              Resumo Total do Estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
                <p className="text-tire-400 text-sm">Total de Tipos</p>
                <p className="text-2xl font-bold text-white">{productAnalysis.length}</p>
              </div>
              
              <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
                <p className="text-tire-400 text-sm">Quantidade Total</p>
                <p className="text-2xl font-bold text-neon-cyan">
                  {productAnalysis.reduce((total, product) => total + product.quantity, 0)} unidades
                </p>
              </div>
              
              <div className="text-center p-4 bg-neon-green/10 rounded-lg border border-neon-green/30">
                <p className="text-tire-400 text-sm">Valor Total do Estoque</p>
                <p className="text-2xl font-bold text-neon-green">
                  {formatCurrency(calculateGrandTotal())}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinalProductsStock;
