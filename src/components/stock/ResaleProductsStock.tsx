
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
  DollarSign
} from "lucide-react";
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

const ResaleProductsStock: React.FC<ResaleProductsStockProps> = ({ isLoading = false }) => {
  const { stockItems, isLoading: stockLoading, updateStockItem } = useStockItems();
  const { resaleProducts, updateResaleProduct, isLoading: productsLoading } = useResaleProducts();
  const [productAnalysis, setProductAnalysis] = useState<ResaleProductAnalysis[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!stockItems.length || !resaleProducts.length) return;

    // Filtrar apenas produtos de revenda em estoque
    const resaleProductStockItems = stockItems.filter(item => 
      item.item_type === "resaleProduct" && item.quantity > 0
    );

    const analysis = resaleProductStockItems.map(stockItem => {
      const product = resaleProducts.find(p => p.id === stockItem.item_id);
      if (!product) return null;

      const quantity = stockItem.quantity || 0;
      const purchasePrice = product.purchase_price || 0;
      const salePrice = product.sale_price || 0;
      const totalValue = quantity * purchasePrice;
      const profitMargin = salePrice > 0 ? ((salePrice - purchasePrice) / salePrice * 100) : 0;

      return {
        productId: stockItem.item_id,
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
    }).filter(Boolean) as ResaleProductAnalysis[];

    setProductAnalysis(analysis);
  }, [stockItems, resaleProducts]);

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

  const handleSaveChanges = async (productId: string) => {
    const product = productAnalysis.find(p => p.productId === productId);
    if (!product) return;

    setIsSaving(true);
    try {
      // Atualizar estoque
      const stockItem = stockItems.find(item => item.item_id === productId);
      if (stockItem) {
        const newTotalValue = product.editableQuantity * product.editablePurchasePrice;
        
        await updateStockItem(stockItem.id, {
          quantity: product.editableQuantity,
          total_value: newTotalValue
        });
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
    const averageMargin = productAnalysis.length > 0 ? 
      productAnalysis.reduce((total, product) => total + product.profitMargin, 0) / productAnalysis.length : 0;

    return { totalQuantity, totalValue, averageMargin };
  };

  const { totalQuantity, totalValue, averageMargin } = calculateTotals();

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
          <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-neon-blue" />
            Produtos para Revenda
            <span className="text-neon-blue text-sm">({productAnalysis.length} produtos)</span>
          </CardTitle>
          <p className="text-tire-300 text-sm">
            Gerenciamento completo de produtos para revenda com controle de preços e margem
          </p>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="space-y-4 max-h-96 overflow-y-auto">
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
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Quantidade */}
                      <div>
                        <Label className="text-tire-400 text-sm">Quantidade</Label>
                        {product.isEditing ? (
                          <Input
                            type="number"
                            min="0"
                            value={product.editableQuantity}
                            onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                            className="bg-factory-700/50 border-tire-600/30 text-white h-9 text-sm"
                          />
                        ) : (
                          <p className="text-white font-medium text-sm">{product.quantity} {product.unit}</p>
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
                          <p className="text-neon-orange font-medium text-sm">
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
                          <p className="text-neon-cyan font-medium text-sm">
                            {formatCurrency(product.salePrice)}
                          </p>
                        )}
                      </div>
                      
                      {/* Margem de Lucro */}
                      <div className="flex flex-col">
                        <Label className="text-tire-400 text-sm">Margem de Lucro</Label>
                        <p className={`font-medium text-sm ${product.profitMargin > 0 ? 'text-neon-green' : 'text-red-400'}`}>
                          {product.profitMargin.toFixed(2)}%
                        </p>
                        {product.isEditing && (
                          <Button
                            size="sm"
                            onClick={() => handleSaveChanges(product.productId)}
                            disabled={isSaving}
                            className="bg-neon-green/20 border-neon-green/50 text-neon-green hover:bg-neon-green/30 h-8 px-3 mt-2"
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
                <p className="text-tire-400 text-sm">Quantidade Total</p>
                <p className="text-2xl font-bold text-neon-cyan">{totalQuantity} itens</p>
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
      )}
    </div>
  );
};

export default ResaleProductsStock;
