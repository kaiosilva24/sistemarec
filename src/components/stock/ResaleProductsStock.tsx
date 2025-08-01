import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ShoppingCart, 
  Calculator, 
  Save, 
  Edit3, 
  TrendingUp,
  Package,
  Plus,
  Download,
  Upload
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useResaleProducts, useStockItems } from "@/hooks/useDataPersistence";
import { supabase } from "../../../supabase/supabase";

interface ResaleProductsStockProps {
  isLoading?: boolean;
}

interface ResaleProductAnalysis {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  editableQuantity: number;
  purchasePrice: number;
  salePrice: number;
  totalValue: number;
  profitMargin: number;
  isEditing: boolean;
}

interface AddStockDialogProps {
  onAddStock: (productId: string, quantity: number, unitCost: number) => void;
  resaleProducts: any[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddStockDialog: React.FC<AddStockDialogProps> = ({ 
  onAddStock, 
  resaleProducts, 
  isOpen, 
  onOpenChange 
}) => {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductId && quantity && unitCost) {
      onAddStock(selectedProductId, parseInt(quantity), parseInt(unitCost));
      setSelectedProductId("");
      setQuantity("");
      setUnitCost("");
      onOpenChange(false);
    }
  };

  const availableProducts = resaleProducts.filter(product => !product.archived);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-factory-800/95 border-tire-600/30 text-white">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-neon-green" />
            Adicionar Estoque de Produto para Revenda
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-tire-300">Produto</Label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full p-2 bg-factory-700/50 border border-tire-600/30 rounded text-white"
              required
            >
              <option value="">Selecione um produto</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-tire-300">Quantidade</Label>
              <Input
                type="text"
                value={quantity}
                onChange={(e) => {
                  const formatted = e.target.value.replace(/[^\d]/g, '');
                  setQuantity(formatted);
                }}
                className="bg-factory-700/50 border-tire-600/30 text-white"
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-tire-300">Custo Unitário</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tire-400 text-sm">
                  R$
                </span>
                <Input
                  type="text"
                  value={unitCost}
                  onChange={(e) => {
                    const formatted = e.target.value.replace(/[^\d]/g, '');
                    setUnitCost(formatted);
                  }}
                  className="bg-factory-700/50 border-tire-600/30 text-white pl-8"
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-neon-green hover:bg-neon-green/80 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ResaleProductsStock: React.FC<ResaleProductsStockProps> = ({ isLoading = false }) => {
  const { resaleProducts, isLoading: productsLoading } = useResaleProducts();
  const { stockItems, isLoading: stockLoading, addStockItem, updateStockItem } = useStockItems();
  const [productAnalysis, setProductAnalysis] = useState<ResaleProductAnalysis[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!stockItems.length || !resaleProducts.length) return;

    console.log('🔄 [ResaleProductsStock] Carregando dados dos produtos de revenda...');

    // Filtrar apenas produtos de revenda em estoque
    const resaleProductStockItems = stockItems.filter(item => 
      item.item_type === "resale_product" && 
      resaleProducts.find(p => p.id === item.item_id && !p.archived)
    );

    const analysis = resaleProductStockItems.map(stockItem => {
      const product = resaleProducts.find(p => p.id === stockItem.item_id);
      if (!product) return null;

      const quantity = stockItem.quantity || 0;
      const purchasePrice = stockItem.unit_cost || product.purchase_price || 0;
      const salePrice = product.sale_price || 0;
      const totalValue = quantity * purchasePrice;
      const profitMargin = salePrice > 0 ? ((salePrice - purchasePrice) / salePrice * 100) : 0;

      console.log(`📦 [ResaleProductsStock] Produto carregado: ${product.name}`, {
        quantity,
        purchasePrice,
        salePrice,
        totalValue,
        profitMargin: profitMargin.toFixed(2) + '%'
      });

      return {
        productId: stockItem.item_id,
        productName: product.name,
        unit: product.unit,
        quantity,
        editableQuantity: quantity,
        purchasePrice,
        salePrice,
        totalValue,
        profitMargin,
        isEditing: false
      };
    }).filter(Boolean) as ResaleProductAnalysis[];

    setProductAnalysis(analysis);
    console.log('✅ [ResaleProductsStock] Análise de produtos concluída:', {
      totalProducts: analysis.length,
      productsWithStock: analysis.filter(p => p.quantity > 0).length,
      totalValue: analysis.reduce((sum, p) => sum + p.totalValue, 0)
    });
  }, [stockItems, resaleProducts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleQuantityChange = (productId: string, newQuantity: string) => {
    const cleanValue = newQuantity.replace(/[^\d]/g, '');
    const numericQuantity = parseInt(cleanValue) || 0;

    setProductAnalysis(prev => 
      prev.map(product => 
        product.productId === productId 
          ? { 
              ...product, 
              editableQuantity: numericQuantity,
              totalValue: numericQuantity * product.purchasePrice
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

  const handleAddStock = async (productId: string, quantity: number, unitCost: number) => {
    const product = resaleProducts.find(p => p.id === productId);
    if (!product) return;

    setIsSaving(true);
    try {
      const totalValue = quantity * unitCost;

      // Verificar se já existe item no estoque
      const existingStockItem = stockItems.find(item => 
        item.item_id === productId && item.item_type === "resale_product"
      );

      if (existingStockItem) {
        // Atualizar item existente
        await updateStockItem(existingStockItem.id, {
          quantity: quantity,
          unit_cost: unitCost,
          total_value: totalValue
        });
      } else {
        // Criar novo item no estoque
        await addStockItem({
          item_id: productId,
          item_type: "resale_product",
          item_name: product.name,
          quantity: quantity,
          unit_cost: unitCost,
          total_value: totalValue
        });
      }

      console.log(`✅ Estoque adicionado: ${product.name} - ${quantity} unidades com custo ${unitCost}`);
    } catch (error) {
      console.error("Erro ao adicionar estoque:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuantity = async (productId: string) => {
    const product = productAnalysis.find(p => p.productId === productId);
    if (!product) return;

    setIsSaving(true);
    try {
      const stockItem = stockItems.find(item => 
        item.item_id === productId && item.item_type === "resale_product"
      );

      if (stockItem) {
        const newTotalValue = product.editableQuantity * product.purchasePrice;

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

  const handleExportData = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      version: "1.0",
      products: productAnalysis,
      summary: {
        totalProducts: productAnalysis.length,
        productsInStock: productAnalysis.filter(p => p.quantity > 0).length,
        totalValue: calculateGrandTotal()
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estoque_produtos_revenda_${new Date().toISOString().split('T')[0]}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log("✅ Dados exportados com sucesso!");
  };

  if (isLoading || stockLoading || productsLoading) {
    return (
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-neon-blue" />
            Produtos para Revenda
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-neon-blue" />
                Produtos para Revenda
                <span className="text-neon-blue text-sm">({productAnalysis.length} tipos)</span>
              </CardTitle>
              <p className="text-tire-300 text-sm mt-1">
                Controle de estoque e análise de custos por produto de revenda
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-neon-green hover:bg-neon-green/80 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Estoque
              </Button>
              <Button
                onClick={handleExportData}
                className="bg-neon-blue hover:bg-neon-blue/80 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {productAnalysis.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-tire-500 mx-auto mb-3" />
                <p className="text-tire-400">Nenhum produto de revenda em estoque</p>
              </div>
            ) : (
              productAnalysis.map((product) => (
                <div
                  key={product.productId}
                  className="p-4 rounded-lg border transition-all bg-factory-700/30 border-tire-600/20 hover:bg-factory-700/50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold text-lg flex items-center gap-2">
                      {product.productName}
                      <span className="text-tire-400 text-sm">({product.unit})</span>
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

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-tire-400 text-sm">Quantidade Atual</Label>
                        {product.isEditing ? (
                          <Input
                            type="text"
                            value={product.editableQuantity.toString()}
                            onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                            className="bg-factory-700/50 border-tire-600/30 text-white h-10 text-base"
                          />
                        ) : (
                          <p className="text-white font-medium text-base">{product.quantity} {product.unit}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-tire-400 text-sm">Preço de Compra</Label>
                        <p className="text-neon-orange font-medium text-base">
                          {formatCurrency(product.purchasePrice)}
                        </p>
                      </div>

                      <div>
                        <Label className="text-tire-400 text-sm">Preço de Venda</Label>
                        <p className="text-neon-cyan font-medium text-base">
                          {formatCurrency(product.salePrice)}
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

                  {/* Seção de Informações Adicionais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-factory-600/20 rounded-lg border border-tire-600/30">
                      <p className="text-tire-400 text-sm">Margem de Lucro</p>
                      <p className={`font-bold text-lg ${product.profitMargin > 0 ? 'text-neon-green' : 'text-red-400'}`}>
                        {product.profitMargin.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center p-3 bg-factory-600/20 rounded-lg border border-tire-600/30">
                      <p className="text-tire-400 text-sm">Lucro por Unidade</p>
                      <p className={`font-bold text-lg ${(product.salePrice - product.purchasePrice) > 0 ? 'text-neon-green' : 'text-red-400'}`}>
                        {formatCurrency(product.salePrice - product.purchasePrice)}
                      </p>
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
              <TrendingUp className="h-5 w-5 text-neon-purple" />
              Resumo Total do Estoque de Revenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
                <p className="text-tire-400 text-sm">Total de Tipos</p>
                <p className="text-2xl font-bold text-white">{productAnalysis.length}</p>
              </div>

              <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
                <p className="text-tire-400 text-sm">Produtos em Estoque</p>
                <p className="text-2xl font-bold text-neon-cyan">
                  {productAnalysis.filter(p => p.quantity > 0).length}
                </p>
              </div>

              <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
                <p className="text-tire-400 text-sm">Quantidade Total</p>
                <p className="text-2xl font-bold text-neon-blue">
                  {productAnalysis.reduce((total, product) => total + product.quantity, 0)}
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

      <AddStockDialog
        onAddStock={handleAddStock}
        resaleProducts={resaleProducts}
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
      />
    </div>
  );
};

export default ResaleProductsStock;