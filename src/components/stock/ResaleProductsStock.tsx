
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
  Trash2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  stockItemId?: string;
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
      const cleanQuantity = parseInt(quantity.replace(/[^\d]/g, '')) || 0;
      const cleanUnitCost = parseInt(unitCost.replace(/[^\d]/g, '')) || 0;
      onAddStock(selectedProductId, cleanQuantity, cleanUnitCost);
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
  const [productAnalysis, setProductAnalysis] = useState<ResaleProductAnalysis[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stockData, setStockData] = useState<any[]>([]);
  const [stockLoading, setStockLoading] = useState(true);

  // Carrega dados do estoque de produtos de revenda do Supabase
  const loadResaleStockData = async () => {
    try {
      setStockLoading(true);
      const { data, error } = await supabase
        .from('resale_products_stock')
        .select(`
          *,
          resale_products!inner(
            id,
            name,
            unit,
            purchase_price,
            sale_price,
            archived
          )
        `)
        .eq('resale_products.archived', false);

      if (error) {
        console.error('Erro ao carregar estoque de produtos de revenda:', error);
        return;
      }

      console.log('✅ [ResaleProductsStock] Dados carregados do Supabase:', data);
      setStockData(data || []);
    } catch (error) {
      console.error('Erro na consulta do Supabase:', error);
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    loadResaleStockData();
  }, []);

  useEffect(() => {
    if (!stockData.length || !resaleProducts.length) return;

    console.log('🔄 [ResaleProductsStock] Processando dados dos produtos de revenda...');

    const analysis = stockData.map(stockItem => {
      const product = stockItem.resale_products;
      if (!product) return null;

      const quantity = stockItem.quantity || 0;
      const purchasePrice = stockItem.purchase_price || product.purchase_price || 0;
      const salePrice = stockItem.sale_price || product.sale_price || 0;
      const totalValue = stockItem.total_value || (quantity * purchasePrice);
      const profitMargin = salePrice > 0 ? ((salePrice - purchasePrice) / salePrice * 100) : 0;

      console.log(`📦 [ResaleProductsStock] Produto processado: ${product.name}`, {
        quantity,
        purchasePrice,
        salePrice,
        totalValue,
        profitMargin: profitMargin.toFixed(2) + '%'
      });

      return {
        productId: stockItem.resale_product_id,
        productName: product.name,
        unit: product.unit,
        quantity,
        editableQuantity: quantity,
        purchasePrice,
        salePrice,
        totalValue,
        profitMargin,
        isEditing: false,
        stockItemId: stockItem.id
      };
    }).filter(Boolean) as ResaleProductAnalysis[];

    setProductAnalysis(analysis);
    console.log('✅ [ResaleProductsStock] Análise de produtos concluída:', {
      totalProducts: analysis.length,
      productsWithStock: analysis.filter(p => p.quantity > 0).length,
      totalValue: analysis.reduce((sum, p) => sum + p.totalValue, 0)
    });
  }, [stockData, resaleProducts]);

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

      // Verifica se já existe registro para este produto
      const existingStock = stockData.find(item => item.resale_product_id === productId);

      if (existingStock) {
        // Atualiza registro existente
        const { error } = await supabase
          .from('resale_products_stock')
          .update({
            quantity: quantity,
            purchase_price: unitCost,
            sale_price: product.sale_price,
            total_value: totalValue,
            profit_margin: product.sale_price > 0 ? ((product.sale_price - unitCost) / product.sale_price * 100) : 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingStock.id);

        if (error) throw error;
      } else {
        // Cria novo registro
        const { error } = await supabase
          .from('resale_products_stock')
          .insert({
            resale_product_id: productId,
            product_name: product.name,
            unit: product.unit,
            quantity: quantity,
            purchase_price: unitCost,
            sale_price: product.sale_price,
            total_value: totalValue,
            profit_margin: product.sale_price > 0 ? ((product.sale_price - unitCost) / product.sale_price * 100) : 0
          });

        if (error) throw error;
      }

      console.log(`✅ Estoque adicionado no Supabase: ${product.name} - ${quantity} unidades com custo ${unitCost}`);
      
      // Recarrega os dados
      await loadResaleStockData();
    } catch (error) {
      console.error("Erro ao adicionar estoque:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveQuantity = async (productId: string) => {
    const product = productAnalysis.find(p => p.productId === productId);
    if (!product || !product.stockItemId) return;

    setIsSaving(true);
    try {
      const newTotalValue = product.editableQuantity * product.purchasePrice;

      const { error } = await supabase
        .from('resale_products_stock')
        .update({
          quantity: product.editableQuantity,
          total_value: newTotalValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.stockItemId);

      if (error) throw error;

      // Atualiza estado local
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

      console.log(`✅ Quantidade atualizada no Supabase para ${product.productName}: ${product.editableQuantity} unidades`);
    } catch (error) {
      console.error("Erro ao salvar quantidade:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveStock = async (productId: string) => {
    const product = productAnalysis.find(p => p.productId === productId);
    if (!product || !product.stockItemId) return;

    if (!confirm(`Deseja remover ${product.productName} do estoque?`)) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('resale_products_stock')
        .delete()
        .eq('id', product.stockItemId);

      if (error) throw error;

      console.log(`✅ Produto removido do estoque: ${product.productName}`);
      
      // Recarrega os dados
      await loadResaleStockData();
    } catch (error) {
      console.error("Erro ao remover produto do estoque:", error);
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
              <CardTitle className="text-tire-200 text-xl flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-neon-blue" />
                Produtos para Revenda
                <span className="text-neon-blue text-base">({productAnalysis.length} tipos)</span>
              </CardTitle>
              <p className="text-tire-300 text-sm mt-1">
                Controle de estoque e análise de custos por produto de revenda integrado ao Supabase
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
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {productAnalysis.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-tire-500 mx-auto mb-3" />
                <p className="text-tire-400 text-lg">Nenhum produto de revenda em estoque</p>
                <p className="text-tire-500 text-sm">Clique em "Adicionar Estoque" para começar</p>
              </div>
            ) : (
              productAnalysis.map((product) => (
                <div
                  key={product.productId}
                  className="p-5 rounded-lg border transition-all bg-factory-700/30 border-tire-600/20 hover:bg-factory-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-bold text-xl flex items-center gap-2">
                      {product.productName}
                      <span className="text-tire-400 text-base font-normal">({product.unit})</span>
                    </h4>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-neon-green font-bold text-2xl">
                          {formatCurrency(product.totalValue)}
                        </span>
                        <p className="text-tire-400 text-sm">Valor Total</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveStock(product.productId)}
                        className="bg-red-900/20 border-red-500/30 text-red-400 hover:bg-red-900/30 hover:text-red-300 h-9 px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Seção de Controle de Quantidade */}
                  <div className="bg-factory-600/20 rounded-lg p-4 mb-4 border border-tire-600/30">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-tire-300 font-semibold text-lg flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-neon-orange" />
                        Controle de Quantidade
                      </Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditToggle(product.productId)}
                        className="bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white h-9 px-3"
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        {product.isEditing ? "Cancelar" : "Editar"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label className="text-tire-400 text-sm font-medium">Quantidade Atual</Label>
                        {product.isEditing ? (
                          <Input
                            type="text"
                            value={product.editableQuantity.toString()}
                            onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                            className="bg-factory-700/50 border-tire-600/30 text-white h-11 text-lg font-semibold"
                          />
                        ) : (
                          <p className="text-white font-bold text-lg mt-1">{product.quantity} {product.unit}</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-tire-400 text-sm font-medium">Preço de Compra</Label>
                        <p className="text-neon-orange font-bold text-lg mt-1">
                          {formatCurrency(product.purchasePrice)}
                        </p>
                      </div>

                      <div>
                        <Label className="text-tire-400 text-sm font-medium">Preço de Venda</Label>
                        <p className="text-neon-cyan font-bold text-lg mt-1">
                          {formatCurrency(product.salePrice)}
                        </p>
                      </div>

                      <div className="flex items-end">
                        {product.isEditing && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveQuantity(product.productId)}
                            disabled={isSaving}
                            className="bg-neon-green/20 border-neon-green/50 text-neon-green hover:bg-neon-green/30 h-9 px-4 w-full font-semibold"
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {isSaving ? "Salvando..." : "Salvar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Seção de Informações Adicionais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-factory-600/20 rounded-lg border border-tire-600/30">
                      <p className="text-tire-400 text-sm font-medium">Margem de Lucro</p>
                      <p className={`font-bold text-xl ${product.profitMargin > 0 ? 'text-neon-green' : 'text-red-400'}`}>
                        {product.profitMargin.toFixed(1)}%
                      </p>
                    </div>

                    <div className="text-center p-4 bg-factory-600/20 rounded-lg border border-tire-600/30">
                      <p className="text-tire-400 text-sm font-medium">Lucro por Unidade</p>
                      <p className={`font-bold text-xl ${(product.salePrice - product.purchasePrice) > 0 ? 'text-neon-green' : 'text-red-400'}`}>
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
            <CardTitle className="text-tire-200 text-xl flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-neon-purple" />
              Resumo Total do Estoque de Revenda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
                <p className="text-tire-400 text-sm font-medium">Total de Tipos</p>
                <p className="text-2xl font-bold text-white">{productAnalysis.length}</p>
              </div>

              <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
                <p className="text-tire-400 text-sm font-medium">Produtos em Estoque</p>
                <p className="text-2xl font-bold text-neon-cyan">
                  {productAnalysis.filter(p => p.quantity > 0).length}
                </p>
              </div>

              <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
                <p className="text-tire-400 text-sm font-medium">Quantidade Total</p>
                <p className="text-2xl font-bold text-neon-blue">
                  {productAnalysis.reduce((total, product) => total + product.quantity, 0)}
                </p>
              </div>

              <div className="text-center p-4 bg-neon-green/10 rounded-lg border border-neon-green/30">
                <p className="text-tire-400 text-sm font-medium">Valor Total do Estoque</p>
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
