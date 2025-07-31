
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
  DollarSign,
  Plus,
  Minus
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useStockItems, useResaleProducts } from "@/hooks/useDataPersistence";

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
  editablePurchasePrice: number;
  salePrice: number;
  editableSalePrice: number;
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
      onAddStock(selectedProductId, parseInt(quantity), parseFloat(unitCost));
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
            Definir Estoque de Produto para Revenda
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
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-factory-700/50 border-tire-600/30 text-white"
                placeholder="0"
                min="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-tire-300">Custo Unitário</Label>
              <Input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="bg-factory-700/50 border-tire-600/30 text-white"
                placeholder="0,00"
                min="0"
                required
              />
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
              Definir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ResaleProductsStock: React.FC<ResaleProductsStockProps> = ({ isLoading = false }) => {
  const { stockItems, isLoading: stockLoading, updateStockItem, addStockItem } = useStockItems();
  const { resaleProducts, updateResaleProduct, isLoading: productsLoading } = useResaleProducts();
  const [productAnalysis, setProductAnalysis] = useState<ResaleProductAnalysis[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!resaleProducts.length) return;

    // Começar sempre com valores zerados - apenas usar o novo sistema de cálculo
    const analysis = resaleProducts
      .filter(product => !product.archived)
      .map(product => {
        // ZERADO: Ignorar dados antigos, começar sempre com 0
        const quantity = 0;
        const purchasePrice = 0;
        const salePrice = 0;
        const totalValue = 0;
        const profitMargin = 0;

        return {
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          quantity,
          editableQuantity: quantity,
          purchasePrice,
          editablePurchasePrice: purchasePrice,
          salePrice,
          editableSalePrice: salePrice,
          totalValue,
          profitMargin,
          isEditing: false
        };
      });

    setProductAnalysis(analysis);
  }, [resaleProducts]);

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
              totalValue: numericQuantity * product.editablePurchasePrice
            }
          : product
      )
    );
  };

  const handlePurchasePriceChange = (productId: string, newPrice: string) => {
    const numericPrice = parseFloat(newPrice.replace(',', '.')) || 0;
    setProductAnalysis(prev => 
      prev.map(product => 
        product.productId === productId 
          ? { 
              ...product, 
              editablePurchasePrice: numericPrice,
              totalValue: product.editableQuantity * numericPrice,
              profitMargin: product.editableSalePrice > 0 ? 
                ((product.editableSalePrice - numericPrice) / product.editableSalePrice * 100) : 0
            }
          : product
      )
    );
  };

  const handleSalePriceChange = (productId: string, newPrice: string) => {
    const numericPrice = parseFloat(newPrice.replace(',', '.')) || 0;
    setProductAnalysis(prev => 
      prev.map(product => 
        product.productId === productId 
          ? { 
              ...product, 
              editableSalePrice: numericPrice,
              profitMargin: numericPrice > 0 ? 
                ((numericPrice - product.editablePurchasePrice) / numericPrice * 100) : 0
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
      // NOVO SISTEMA: Sempre criar/substituir com os novos valores
      // Verificar se já existe estoque
      const existingStock = stockItems.find(item => 
        item.item_id === productId && item.item_type === "resaleProduct"
      );

      if (existingStock) {
        // Substituir valores existentes pelos novos (não somar)
        await updateStockItem(existingStock.id, {
          quantity: quantity,
          unit_cost: unitCost,
          total_value: quantity * unitCost,
          last_updated: new Date().toISOString(),
        });
      } else {
        // Criar novo item de estoque
        await addStockItem({
          item_id: productId,
          item_name: product.name,
          item_type: "resaleProduct",
          unit: product.unit,
          quantity: quantity,
          unit_cost: unitCost,
          total_value: quantity * unitCost,
          last_updated: new Date().toISOString(),
        });
      }

      console.log(`✅ Estoque definido: ${product.name} - ${quantity} unidades com custo ${unitCost}`);
    } catch (error) {
      console.error("Erro ao definir estoque:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveChanges = async (productId: string) => {
    const product = productAnalysis.find(p => p.productId === productId);
    if (!product) return;

    setIsSaving(true);
    try {
      // Atualizar estoque
      const stockItem = stockItems.find(item => 
        item.item_id === productId && item.item_type === "resaleProduct"
      );
      
      if (stockItem) {
        const newTotalValue = product.editableQuantity * product.editablePurchasePrice;
        
        await updateStockItem(stockItem.id, {
          quantity: product.editableQuantity,
          unit_cost: product.editablePurchasePrice,
          total_value: newTotalValue,
          last_updated: new Date().toISOString(),
        });
      } else if (product.editableQuantity > 0) {
        // Criar novo item de estoque se quantidade > 0
        const resaleProduct = resaleProducts.find(p => p.id === productId);
        if (resaleProduct) {
          await addStockItem({
            item_id: productId,
            item_name: resaleProduct.name,
            item_type: "resaleProduct",
            unit: resaleProduct.unit,
            quantity: product.editableQuantity,
            unit_cost: product.editablePurchasePrice,
            total_value: product.editableQuantity * product.editablePurchasePrice,
            last_updated: new Date().toISOString(),
          });
        }
      }

      // Atualizar produto de revenda
      await updateResaleProduct(productId, {
        purchase_price: product.editablePurchasePrice,
        sale_price: product.editableSalePrice,
        profit_margin: product.profitMargin
      });

      // Atualizar estado local
      setProductAnalysis(prev => 
        prev.map(p => 
          p.productId === productId 
            ? { 
                ...p, 
                quantity: product.editableQuantity,
                purchasePrice: product.editablePurchasePrice,
                salePrice: product.editableSalePrice,
                totalValue: product.editableQuantity * product.editablePurchasePrice,
                isEditing: false 
              }
            : p
        )
      );

      console.log(`✅ Produto de revenda atualizado: ${product.productName}`);
    } catch (error) {
      console.error("Erro ao salvar alterações:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTotals = () => {
    const totalQuantity = productAnalysis.reduce((total, product) => total + product.quantity, 0);
    const totalValue = productAnalysis.reduce((total, product) => total + product.totalValue, 0);
    const productsInStock = productAnalysis.filter(product => product.quantity > 0).length;
    const averageMargin = productAnalysis.length > 0 ? 
      productAnalysis.reduce((total, product) => total + product.profitMargin, 0) / productAnalysis.length : 0;

    return { totalQuantity, totalValue, productsInStock, averageMargin };
  };

  const { totalQuantity, totalValue, productsInStock, averageMargin } = calculateTotals();

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
                <span className="text-neon-blue text-sm">({productAnalysis.length} produtos)</span>
              </CardTitle>
              <p className="text-tire-300 text-sm mt-1">
                Gerenciamento completo de produtos para revenda com controle de preços e margem
              </p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-neon-green hover:bg-neon-green/80 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Definir Estoque
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {productAnalysis.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-tire-500 mx-auto mb-3" />
                <p className="text-tire-400">Nenhum produto de revenda cadastrado</p>
              </div>
            ) : (
              productAnalysis.map((product) => (
                <div
                  key={product.productId}
                  className="p-4 rounded-lg border transition-all bg-factory-700/30 border-tire-600/20 hover:bg-factory-700/50"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-white font-semibold text-lg">{product.productName}</h4>
                      <p className="text-tire-400 text-sm">Unidade: {product.unit}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-neon-green font-bold text-xl">
                        {formatCurrency(product.totalValue)}
                      </span>
                      <p className="text-tire-400 text-sm">Valor Total</p>
                    </div>
                  </div>

                  {/* Seção de Controles */}
                  <div className="bg-factory-600/20 rounded-lg p-4 space-y-4 border border-tire-600/30">
                    <div className="flex items-center justify-between">
                      <Label className="text-tire-300 font-medium text-base flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-neon-orange" />
                        Controles do Produto
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditToggle(product.productId)}
                          className="bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white h-8 px-3"
                        >
                          <Edit3 className="h-3 w-3 mr-1" />
                          {product.isEditing ? "Cancelar" : "Editar"}
                        </Button>
                        {product.isEditing && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveChanges(product.productId)}
                            disabled={isSaving}
                            className="bg-neon-green/20 border-neon-green/50 text-neon-green hover:bg-neon-green/30 h-8 px-3"
                          >
                            <Save className="h-3 w-3 mr-1" />
                            {isSaving ? "Salvando..." : "Salvar"}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Quantidade */}
                      <div>
                        <Label className="text-tire-400 text-sm">Quantidade em Estoque</Label>
                        {product.isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={product.editableQuantity}
                            onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                            className="bg-factory-700/50 border-tire-600/30 text-white h-9 text-sm"
                          />
                        ) : (
                          <p className="text-white font-medium text-lg">
                            {product.quantity} {product.unit}
                          </p>
                        )}
                      </div>
                      
                      {/* Preço de Compra */}
                      <div>
                        <Label className="text-tire-400 text-sm">Preço de Compra</Label>
                        {product.isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.editablePurchasePrice}
                            onChange={(e) => handlePurchasePriceChange(product.productId, e.target.value)}
                            className="bg-factory-700/50 border-tire-600/30 text-white h-9 text-sm"
                          />
                        ) : (
                          <p className="text-neon-orange font-medium text-lg">
                            {formatCurrency(product.purchasePrice)}
                          </p>
                        )}
                      </div>

                      {/* Preço de Venda */}
                      <div>
                        <Label className="text-tire-400 text-sm">Preço de Venda</Label>
                        {product.isEditing ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={product.editableSalePrice}
                            onChange={(e) => handleSalePriceChange(product.productId, e.target.value)}
                            className="bg-factory-700/50 border-tire-600/30 text-white h-9 text-sm"
                          />
                        ) : (
                          <p className="text-neon-cyan font-medium text-lg">
                            {formatCurrency(product.salePrice)}
                          </p>
                        )}
                      </div>
                      
                      {/* Margem de Lucro */}
                      <div>
                        <Label className="text-tire-400 text-sm">Margem de Lucro</Label>
                        <p className={`font-bold text-lg ${product.profitMargin > 0 ? 'text-neon-green' : 'text-red-400'}`}>
                          {product.profitMargin.toFixed(2)}%
                        </p>
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
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-neon-purple" />
            Resumo dos Produtos de Revenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
              <p className="text-tire-400 text-sm">Total de Produtos</p>
              <p className="text-2xl font-bold text-white">{productAnalysis.length}</p>
            </div>
            
            <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
              <p className="text-tire-400 text-sm">Produtos em Estoque</p>
              <p className="text-2xl font-bold text-neon-cyan">{productsInStock}</p>
            </div>
            
            <div className="text-center p-4 bg-neon-blue/10 rounded-lg border border-neon-blue/30">
              <p className="text-tire-400 text-sm">Valor Total Investido</p>
              <p className="text-2xl font-bold text-neon-blue">
                {formatCurrency(totalValue)}
              </p>
            </div>

            <div className="text-center p-4 bg-neon-purple/10 rounded-lg border border-neon-purple/30">
              <p className="text-tire-400 text-sm">Margem Média</p>
              <p className={`text-2xl font-bold ${averageMargin > 0 ? 'text-neon-green' : 'text-red-400'}`}>
                {averageMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para definir estoque */}
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
