import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
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
}

const FinalProductsStock: React.FC<FinalProductsStockProps> = ({ isLoading = false }) => {
  const { stockItems, isLoading: stockLoading } = useStockItems();
  const { products, isLoading: productsLoading } = useProducts();
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis[]>([]);

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
        quantity: stockItem.quantity
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
    <Card className="bg-factory-800/50 border-tire-600/30">
      <CardHeader>
        <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
          <Package className="h-5 w-5 text-neon-green" />
          Produtos Finais
          <span className="text-neon-green text-sm">({productAnalysis.length} tipos)</span>
        </CardTitle>
        <p className="text-tire-300 text-sm">
          Análise de custos e performance por tipo de pneu
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
                className="p-4 rounded-lg border cursor-pointer transition-all bg-factory-700/30 border-tire-600/20 hover:bg-factory-700/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    {product.measures}
                  </h4>
                  <div className="text-right">
                    <span className="text-neon-green font-bold text-lg">
                      {formatCurrency(product.totalRevenue)}
                    </span>
                    <p className="text-tire-400 text-xs">Receita</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-tire-400">Vendidos</p>
                    <p className="text-white font-medium">{product.totalSold}</p>
                  </div>
                  <div>
                    <p className="text-tire-400">Custo/Pneu (Receita)</p>
                    <p className="text-neon-orange font-medium flex items-center gap-1">
                      <span className="text-neon-yellow text-xs">📋</span>
                      {formatCurrency(product.costPerTire)}
                    </p>
                  </div>
                  <div>
                    <p className="text-tire-400">Lucro</p>
                    <p className="font-medium text-neon-blue">
                      {formatCurrency(product.profit)}
                    </p>
                  </div>
                  <div>
                    <p className="text-tire-400">Margem</p>
                    <p className="font-medium text-neon-purple">
                      {product.profitMargin.toFixed(2)}%
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-tire-600/20">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-tire-400">Em estoque:</span>
                    <span className="text-neon-cyan font-medium">
                      {product.quantity} unidades
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinalProductsStock;