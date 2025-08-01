
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
  Minus,
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
import { useResaleProducts } from "@/hooks/useDataPersistence";
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

// Interface para dados salvos no Supabase
interface ResaleProductStockData {
  id?: string;
  resale_product_id: string;
  product_name: string;
  unit: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  total_value: number;
  profit_margin: number;
  created_at?: string;
  updated_at?: string;
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
              Definir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ResaleProductsStock: React.FC<ResaleProductsStockProps> = ({ isLoading = false }) => {
  const { resaleProducts, updateResaleProduct, isLoading: productsLoading } = useResaleProducts();
  const [productAnalysis, setProductAnalysis] = useState<ResaleProductAnalysis[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [stockData, setStockData] = useState<ResaleProductStockData[]>([]);

  // Carregar dados do Supabase
  const loadStockData = async (): Promise<ResaleProductStockData[]> => {
    try {
      const { data, error } = await supabase
        .from('resale_products_stock')
        .select('*');

      if (error) {
        console.error("❌ Erro ao carregar dados do estoque:", error);
        return [];
      }

      console.log("✅ Dados do estoque carregados do Supabase:", data?.length || 0);
      return data || [];
    } catch (error) {
      console.error("❌ Erro ao carregar dados do estoque:", error);
      return [];
    }
  };

  // Salvar dados no Supabase
  const saveStockData = async (productData: Omit<ResaleProductStockData, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: existingData, error: checkError } = await supabase
        .from('resale_products_stock')
        .select('id')
        .eq('resale_product_id', productData.resale_product_id)
        .single();

      if (existingData) {
        // Atualizar registro existente
        const { data, error } = await supabase
          .from('resale_products_stock')
          .update({
            ...productData,
            updated_at: new Date().toISOString()
          })
          .eq('resale_product_id', productData.resale_product_id)
          .select()
          .single();

        if (error) {
          console.error("❌ Erro ao atualizar estoque:", error);
          return null;
        }

        console.log("✅ Estoque atualizado no Supabase:", data);
        return data;
      } else {
        // Criar novo registro
        const { data, error } = await supabase
          .from('resale_products_stock')
          .insert({
            ...productData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error("❌ Erro ao salvar estoque:", error);
          return null;
        }

        console.log("✅ Estoque salvo no Supabase:", data);
        return data;
      }
    } catch (error) {
      console.error("❌ Erro ao salvar dados do estoque:", error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!resaleProducts.length || productsLoading) return;

      console.log('🔄 [ResaleProductsStock] Carregando dados dos produtos de revenda...');

      // Carregar dados salvos do Supabase
      const savedStockData = await loadStockData();
      setStockData(savedStockData);

      const analysis = resaleProducts
        .filter(product => !product.archived)
        .map(product => {
          // Buscar dados salvos para este produto
          const savedData = savedStockData.find(data => data.resale_product_id === product.id);

          const quantity = savedData?.quantity || 0;
          const purchasePrice = savedData?.purchase_price || product.purchase_price || 0;
          const salePrice = savedData?.sale_price || product.sale_price || 0;
          const totalValue = savedData?.total_value || (quantity * purchasePrice);
          const profitMargin = salePrice > 0 ? 
            ((salePrice - purchasePrice) / salePrice * 100) : 0;

          console.log(`📦 [ResaleProductsStock] Produto carregado: ${product.name}`, {
            quantity,
            purchasePrice,
            salePrice,
            totalValue,
            profitMargin: profitMargin.toFixed(2) + '%',
            hasSupabaseData: !!savedData
          });

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
      console.log('✅ [ResaleProductsStock] Análise de produtos concluída:', {
        totalProducts: analysis.length,
        productsWithStock: analysis.filter(p => p.quantity > 0).length,
        totalValue: analysis.reduce((sum, p) => sum + p.totalValue, 0)
      });
    };

    loadData();
  }, [resaleProducts, productsLoading]);

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
              totalValue: numericQuantity * product.editablePurchasePrice
            }
          : product
      )
    );
  };

  const handlePurchasePriceChange = (productId: string, newPrice: string) => {
    const cleanValue = newPrice.replace(/[^\d]/g, '');
    const numericPrice = parseInt(cleanValue) || 0;

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
    const cleanValue = newPrice.replace(/[^\d]/g, '');
    const numericPrice = parseInt(cleanValue) || 0;

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
      const totalValue = quantity * unitCost;
      const profitMargin = product.sale_price > 0 ? 
        ((product.sale_price - unitCost) / product.sale_price * 100) : 0;

      // Salvar no Supabase
      const savedData = await saveStockData({
        resale_product_id: productId,
        product_name: product.name,
        unit: product.unit,
        quantity: quantity,
        purchase_price: unitCost,
        sale_price: product.sale_price,
        total_value: totalValue,
        profit_margin: profitMargin
      });

      if (savedData) {
        // Atualizar no estado local
        setProductAnalysis(prev => 
          prev.map(p => 
            p.productId === productId 
              ? {
                  ...p,
                  quantity: quantity,
                  editableQuantity: quantity,
                  purchasePrice: unitCost,
                  editablePurchasePrice: unitCost,
                  salePrice: product.sale_price,
                  editableSalePrice: product.sale_price,
                  totalValue: totalValue,
                  profitMargin: profitMargin
                }
              : p
          )
        );

        // Atualizar dados do estoque
        const updatedStockData = await loadStockData();
        setStockData(updatedStockData);

        console.log(`✅ Estoque definido: ${product.name} - ${quantity} unidades com custo ${unitCost}`);
      }
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
      const totalValue = product.editableQuantity * product.editablePurchasePrice;
      const profitMargin = product.editableSalePrice > 0 ? 
        ((product.editableSalePrice - product.editablePurchasePrice) / product.editableSalePrice * 100) : 0;

      // Atualizar produto de revenda
      await updateResaleProduct(productId, {
        purchase_price: product.editablePurchasePrice,
        sale_price: product.editableSalePrice,
        profit_margin: profitMargin
      });

      // Salvar no Supabase
      const savedData = await saveStockData({
        resale_product_id: productId,
        product_name: product.productName,
        unit: product.unit,
        quantity: product.editableQuantity,
        purchase_price: product.editablePurchasePrice,
        sale_price: product.editableSalePrice,
        total_value: totalValue,
        profit_margin: profitMargin
      });

      if (savedData) {
        // Atualizar estado local
        setProductAnalysis(prev => 
          prev.map(p => 
            p.productId === productId 
              ? { 
                  ...p, 
                  quantity: product.editableQuantity,
                  purchasePrice: product.editablePurchasePrice,
                  salePrice: product.editableSalePrice,
                  totalValue: totalValue,
                  profitMargin: profitMargin,
                  isEditing: false 
                }
              : p
          )
        );

        // Atualizar dados do estoque
        const updatedStockData = await loadStockData();
        setStockData(updatedStockData);

        console.log(`✅ [ResaleProductsStock] Alterações salvas para: ${product.productName}`);
      }
    } catch (error) {
      console.error(`❌ [ResaleProductsStock] Erro ao salvar alterações para ${product.productName}:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const currentStockData = await loadStockData();
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: "1.0",
        products: currentStockData,
        summary: {
          totalProducts: currentStockData.length,
          productsInStock: currentStockData.filter(p => p.quantity > 0).length,
          totalValue: currentStockData.reduce((sum, p) => sum + p.total_value, 0)
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
    } catch (error) {
      console.error("❌ Erro ao exportar dados:", error);
    }
  };

  const handleSyncData = async () => {
    setIsSaving(true);
    try {
      const updatedStockData = await loadStockData();
      setStockData(updatedStockData);

      // Atualizar análise de produtos
      const analysis = resaleProducts
        .filter(product => !product.archived)
        .map(product => {
          const savedData = updatedStockData.find(data => data.resale_product_id === product.id);

          const quantity = savedData?.quantity || 0;
          const purchasePrice = savedData?.purchase_price || product.purchase_price || 0;
          const salePrice = savedData?.sale_price || product.sale_price || 0;
          const totalValue = savedData?.total_value || (quantity * purchasePrice);
          const profitMargin = salePrice > 0 ? 
            ((salePrice - purchasePrice) / salePrice * 100) : 0;

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
      console.log("✅ Dados sincronizados com o Supabase!");
    } catch (error) {
      console.error("❌ Erro ao sincronizar dados:", error);
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

  if (isLoading || productsLoading) {
    return (
      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-neon-blue" />
            Produtos para Revenda (Sistema de Arquivo)
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
                Produtos para Revenda (Sistema de Arquivo)
                <span className="text-neon-blue text-sm">({productAnalysis.length} produtos)</span>
              </CardTitle>
              <p className="text-tire-300 text-sm mt-1">
                Sistema de estoque salvo no Supabase - Dados persistentes no banco de dados
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsAddDialogOpen(true)}
                className="bg-neon-green hover:bg-neon-green/80 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Definir Estoque
              </Button>
              <Button
                onClick={handleExportData}
                className="bg-neon-blue hover:bg-neon-blue/80 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
              <Button
                onClick={handleSyncData}
                disabled={isSaving}
                className="bg-neon-purple hover:bg-neon-purple/80 text-white"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isSaving ? "Sincronizando..." : "Sincronizar"}
              </Button>
            </div>
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
                      <div>
                        <Label className="text-tire-400 text-sm">Quantidade em Estoque</Label>
                        {product.isEditing ? (
                          <div className="relative">
                            <Input
                              type="text"
                              value={product.editableQuantity.toString()}
                              onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                              placeholder="0"
                              className="bg-factory-700/50 border-tire-600/30 text-white h-9 text-sm pr-12"
                            />
                            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-tire-400 text-xs">
                              {product.unit}
                            </span>
                          </div>
                        ) : (
                          <p className="text-white font-medium text-lg">
                            {product.quantity} {product.unit}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-tire-400 text-sm">Preço de Compra</Label>
                        {product.isEditing ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tire-400 text-xs">
                              R$
                            </span>
                            <Input
                              type="text"
                              value={product.editablePurchasePrice.toString()}
                              onChange={(e) => handlePurchasePriceChange(product.productId, e.target.value)}
                              placeholder="0"
                              className="bg-factory-700/50 border-tire-600/30 text-white h-9 text-sm pl-8"
                            />
                          </div>
                        ) : (
                          <p className="text-neon-orange font-medium text-lg">
                            R$ {product.purchasePrice}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-tire-400 text-sm">Preço de Venda</Label>
                        {product.isEditing ? (
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-tire-400 text-xs">
                              R$
                            </span>
                            <Input
                              type="text"
                              value={product.editableSalePrice.toString()}
                              onChange={(e) => handleSalePriceChange(product.productId, e.target.value)}
                              placeholder="0"
                              className="bg-factory-700/50 border-tire-600/30 text-white h-9 text-sm pl-8"
                            />
                          </div>
                        ) : (
                          <p className="text-neon-cyan font-medium text-lg">
                            R$ {product.salePrice}
                          </p>
                        )}
                      </div>

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

      <Card className="bg-factory-800/50 border-tire-600/30">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-neon-purple" />
            Resumo dos Produtos de Revenda (Supabase)
            {isSaving && (
              <span className="text-neon-orange text-sm animate-pulse ml-2">
                (Salvando...)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
              <p className="text-tire-400 text-sm">Total de Produtos</p>
              <p className="text-2xl font-bold text-white">{productAnalysis.length}</p>
            </div>

            <div className={`text-center p-4 rounded-lg border transition-all duration-300 ${
              productsInStock > 0 
                ? 'bg-neon-cyan/10 border-neon-cyan/30' 
                : 'bg-factory-700/30 border-tire-600/20'
            }`}>
              <p className="text-tire-400 text-sm">Produtos em Estoque</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                productsInStock > 0 ? 'text-neon-cyan' : 'text-tire-300'
              }`}>
                {productsInStock}
              </p>
            </div>

            <div className={`text-center p-4 rounded-lg border transition-all duration-300 ${
              totalValue > 0 
                ? 'bg-neon-blue/10 border-neon-blue/30' 
                : 'bg-factory-700/30 border-tire-600/20'
            }`}>
              <p className="text-tire-400 text-sm">Valor Total Investido</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                totalValue > 0 ? 'text-neon-blue' : 'text-tire-300'
              }`}>
                {formatCurrency(totalValue)}
              </p>
            </div>

            <div className={`text-center p-4 rounded-lg border transition-all duration-300 ${
              averageMargin > 0 
                ? 'bg-neon-purple/10 border-neon-purple/30' 
                : 'bg-factory-700/30 border-tire-600/20'
            }`}>
              <p className="text-tire-400 text-sm">Margem Média</p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                averageMargin > 0 ? 'text-neon-green' : 'text-red-400'
              }`}>
                {averageMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
