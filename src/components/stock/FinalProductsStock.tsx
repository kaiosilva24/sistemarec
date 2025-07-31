
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, Package, TrendingUp, Calculator, Edit3, Save, X } from "lucide-react";
import { useStockItems } from "@/hooks/useDataPersistence";

interface FinalProductsStockProps {
  isLoading?: boolean;
}

const FinalProductsStock: React.FC<FinalProductsStockProps> = ({ isLoading = false }) => {
  const { stockItems, updateStockItem, isLoading: stockLoading } = useStockItems();
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<string>("");

  // Estado para custos específicos sincronizados
  const [specificCosts, setSpecificCosts] = useState<Record<string, number>>({});
  const [averageCostPerTire, setAverageCostPerTire] = useState<number>(102.43);

  // Função para obter custo específico sincronizado do TireCostManager
  const getSynchronizedSpecificCost = (productName: string): number => {
    console.log(`🔍 [FinalProductsStock] Buscando custo específico para: "${productName}"`);

    // ESTRATÉGIA 1: Buscar dados específicos salvos pelo TireCostManager
    try {
      const productKey = `tireAnalysis_${productName.toLowerCase().replace(/\s+/g, "_")}`;
      const savedAnalysis = localStorage.getItem(productKey);
      
      if (savedAnalysis) {
        const analysis = JSON.parse(savedAnalysis);
        if (analysis.costPerTire && analysis.costPerTire > 0) {
          console.log(`✅ [FinalProductsStock] Custo específico encontrado para "${productName}": R$ ${analysis.costPerTire.toFixed(2)}`);
          return analysis.costPerTire;
        }
      }
    } catch (error) {
      console.error(`❌ [FinalProductsStock] Erro ao buscar análise específica:`, error);
    }

    // ESTRATÉGIA 2: Usar custo médio sincronizado do TireCostManager
    try {
      const synchronizedData = localStorage.getItem("dashboard_averageCostPerTire");
      if (synchronizedData) {
        const data = JSON.parse(synchronizedData);
        if (data.value && data.value > 0) {
          console.log(`✅ [FinalProductsStock] Usando custo médio sincronizado para "${productName}": R$ ${data.value.toFixed(2)}`);
          return data.value;
        }
      }
    } catch (error) {
      console.error(`❌ [FinalProductsStock] Erro ao buscar custo médio:`, error);
    }

    // ESTRATÉGIA 3: Buscar valor atual do DOM
    try {
      const costElements = document.querySelectorAll('p.text-xl.font-bold.text-neon-orange');
      for (const element of costElements) {
        const textContent = element.textContent?.trim();
        if (textContent && textContent.includes('R$')) {
          const match = textContent.match(/R\$\s*([\d.,]+)/);
          if (match) {
            const valueStr = match[1].replace(',', '.');
            const numericValue = parseFloat(valueStr);
            if (!isNaN(numericValue) && numericValue > 0) {
              console.log(`✅ [FinalProductsStock] Custo do DOM para "${productName}": R$ ${numericValue.toFixed(2)}`);
              return numericValue;
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ [FinalProductsStock] Erro ao buscar custo do DOM:`, error);
    }

    // FALLBACK: Usar custo médio do estado
    console.log(`⚠️ [FinalProductsStock] Usando custo médio padrão para "${productName}": R$ ${averageCostPerTire.toFixed(2)}`);
    return averageCostPerTire;
  };

  // Effect para sincronizar custos específicos
  useEffect(() => {
    const updateSpecificCosts = () => {
      const finalProducts = stockItems.filter(item => 
        item.item_type === "product" && 
        item.quantity > 0
      );

      const newSpecificCosts: Record<string, number> = {};
      
      finalProducts.forEach(product => {
        const specificCost = getSynchronizedSpecificCost(product.item_name);
        newSpecificCosts[product.item_id] = specificCost;
      });

      setSpecificCosts(newSpecificCosts);
      
      console.log(`🔄 [FinalProductsStock] Custos específicos atualizados:`, newSpecificCosts);
    };

    // Atualizar imediatamente
    updateSpecificCosts();

    // Listener para mudanças do TireCostManager
    const handleTireCostUpdate = (event: CustomEvent) => {
      console.log(`📡 [FinalProductsStock] Evento de atualização de custo recebido:`, event.detail);
      
      if (event.detail.averageCostPerTire) {
        setAverageCostPerTire(event.detail.averageCostPerTire);
      }
      
      // Atualizar custos específicos
      updateSpecificCosts();
    };

    // Adicionar listener
    window.addEventListener('tireCostUpdated', handleTireCostUpdate as EventListener);

    // Interval para sincronização contínua
    const syncInterval = setInterval(updateSpecificCosts, 5000);

    return () => {
      window.removeEventListener('tireCostUpdated', handleTireCostUpdate as EventListener);
      clearInterval(syncInterval);
    };
  }, [stockItems, averageCostPerTire]);

  const finalProducts = stockItems.filter(item => 
    item.item_type === "product" && 
    item.quantity > 0
  );

  const handleEdit = (itemId: string, currentQuantity: number) => {
    setEditingItem(itemId);
    setEditQuantity(currentQuantity.toString());
  };

  const handleSave = async (itemId: string) => {
    const newQuantity = parseFloat(editQuantity);
    if (!isNaN(newQuantity) && newQuantity >= 0) {
      try {
        await updateStockItem(itemId, { quantity: newQuantity });
        setEditingItem(null);
        setEditQuantity("");
      } catch (error) {
        console.error("Erro ao atualizar quantidade:", error);
      }
    }
  };

  const handleCancel = () => {
    setEditingItem(null);
    setEditQuantity("");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getTotalValue = () => {
    return finalProducts.reduce((total, product) => {
      const specificCost = specificCosts[product.item_id] || averageCostPerTire;
      return total + (product.quantity * specificCost);
    }, 0);
  };

  if (isLoading || stockLoading) {
    return (
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-neon-green" />
            Estoque de Produtos Finais
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
          Estoque de Produtos Finais
          <Badge variant="secondary" className="bg-neon-green/20 text-neon-green">
            {finalProducts.length} produtos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {/* Resumo do valor total */}
        <div className="mb-4 p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-tire-300 text-sm">Valor Total do Estoque</p>
              <p className="text-xl font-bold text-neon-green">
                {formatCurrency(getTotalValue())}
              </p>
            </div>
            <div className="text-right">
              <p className="text-tire-300 text-sm">Custo Médio/Pneu (Sincronizado)</p>
              <p className="text-lg font-bold text-neon-orange">
                {formatCurrency(averageCostPerTire)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {finalProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-tire-500 mx-auto mb-3" />
              <p className="text-tire-400">Nenhum produto final em estoque</p>
            </div>
          ) : (
            finalProducts.map((product) => {
              const specificCost = specificCosts[product.item_id] || averageCostPerTire;
              const totalValue = product.quantity * specificCost;
              const isEditing = editingItem === product.item_id;
              
              return (
                <div
                  key={product.item_id}
                  className="p-4 bg-factory-700/30 rounded-lg border border-tire-600/20"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium flex items-center gap-2">
                      <span className="text-lg">🏭</span>
                      {product.item_name}
                      <span className="text-xs px-2 py-1 rounded bg-neon-green/20 text-neon-green">
                        Final
                      </span>
                    </h4>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            className="w-20 h-8 text-sm bg-factory-700/50 border-tire-600/30 text-white"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSave(product.item_id)}
                            className="h-8 px-2 bg-neon-green/20 border-neon-green/50 text-neon-green hover:bg-neon-green/30"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            className="h-8 px-2 bg-factory-700/50 border-tire-600/30 text-tire-300"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-tire-300">
                            {product.quantity} un
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(product.item_id, product.quantity)}
                            className="h-8 px-2 text-tire-400 hover:text-white hover:bg-factory-700/50"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-tire-400 text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Tipo:</span>
                      <span className="text-neon-green">Produto Final</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unidade:</span>
                      <span>{product.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Custo Específico:</span>
                      <span className="text-neon-green font-medium">
                        {formatCurrency(specificCost)}/{product.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor Total:</span>
                      <span className="text-neon-blue font-medium">
                        {formatCurrency(totalValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-tire-400 text-xs">Fonte:</span>
                      <span className="text-neon-cyan text-xs">
                        TireCostManager ({product.item_name})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Última Atualização:</span>
                      <span>{formatDate(product.updated_at || product.created_at)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FinalProductsStock;
