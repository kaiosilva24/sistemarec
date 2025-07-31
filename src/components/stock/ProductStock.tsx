import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Plus,
  Minus,
  Package2,
  Search,
  Settings,
  AlertTriangle,
  Info,
} from "lucide-react";
import { Product, StockItem, ResaleProduct } from "@/types/financial";

interface ProductStockProps {
  products?: Product[];
  resaleProducts?: ResaleProduct[];
  stockItems?: StockItem[];
  onStockUpdate?: (
    itemId: string,
    itemType: "material" | "product",
    quantity: number,
    operation: "add" | "remove",
    unitPrice?: number,
  ) => void;
  onSetMinLevel?: (
    itemId: string,
    itemType: "material" | "product",
    minLevel: number,
  ) => void;
  productType?: "all" | "final" | "resale";
  isLoading?: boolean;
}

const ProductStock = ({
  products = [],
  resaleProducts = [],
  stockItems = [],
  onStockUpdate = () => {},
  onSetMinLevel = () => {},
  productType = "all",
  isLoading = false,
}: ProductStockProps) => {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLevelsDialogOpen, setIsLevelsDialogOpen] = useState(false);
  const [selectedItemForLevels, setSelectedItemForLevels] = useState<string>("");
  const [minLevel, setMinLevel] = useState("");
  const [localProductType, setLocalProductType] = useState<"final" | "resale">("final");
  const [mainElementValue, setMainElementValue] = useState(0);

  const activeProducts = useMemo(() => products.filter((p) => !p.archived), [products]);
  const activeResaleProducts = useMemo(() => resaleProducts.filter((p) => !p.archived), [resaleProducts]);

  // Cache para armazenar custos específicos por produto
  const [productCostCache, setProductCostCache] = useState<{
    [key: string]: number;
  }>({});

  // Função para ler dinamicamente o valor do elemento principal no DOM (REAL das métricas)
  const readMainElementValue = useCallback((): number => {
    try {
      console.log('🔍 [ProductStock] Iniciando busca pelo valor das métricas...');
      
      // Buscar especificamente pelo valor "Custo Médio/Pneu" que você mostrou: R$ 94,87
      const allParagraphs = document.querySelectorAll('p');
      
      for (const p of allParagraphs) {
        const textContent = p.textContent || '';
        
        // Procurar por "Custo Médio/Pneu" ou similar
        if (textContent.includes('Custo Médio/Pneu') || textContent.includes('Custo Médio por Pneu')) {
          console.log('📍 [ProductStock] Encontrou elemento com "Custo Médio/Pneu"');
          
          // Buscar o próximo elemento irmão que contém o valor
          const parent = p.parentElement;
          if (parent) {
            const valueElements = parent.querySelectorAll('p');
            
            for (const valueEl of valueElements) {
              const valueText = valueEl.textContent || '';
              
              // Buscar padrões: R$ XX,XX ou R$&nbsp;XX,XX com classes de cor laranja
              const valueMatch = valueText.match(/R\$[\s\u00A0]*(\d+(?:[,\.]\d{2})?)/);
              
              if (valueMatch && 
                  !valueText.includes('Custo Médio') && 
                  (valueEl.className.includes('neon-orange') || valueEl.className.includes('text-xl'))) {
                
                let valueStr = valueMatch[1];
                // Converter vírgula para ponto se necessário
                if (valueStr.includes(',')) {
                  valueStr = valueStr.replace(',', '.');
                }
                const value = parseFloat(valueStr);
                
                if (value > 0) {
                  console.log(`🎯 [ProductStock] Valor REAL encontrado das métricas: R$ ${value.toFixed(2)} (classe: ${valueEl.className})`);
                  return value;
                }
              }
            }
          }
        }
      }
      
      // Busca alternativa: procurar diretamente por elementos com classes específicas e valores monetários
      const orangeElements = document.querySelectorAll('.text-neon-orange, .text-xl');
      
      for (const element of orangeElements) {
        const textContent = element.textContent || '';
        const valueMatch = textContent.match(/R\$[\s\u00A0]*(\d+(?:[,\.]\d{2})?)/);
        
        if (valueMatch) {
          let valueStr = valueMatch[1];
          if (valueStr.includes(',')) {
            valueStr = valueStr.replace(',', '.');
          }
          const value = parseFloat(valueStr);
          
          if (value > 0 && value > 50) { // Filtrar valores muito pequenos que não são o custo por pneu
            console.log(`🎯 [ProductStock] Valor alternativo encontrado: R$ ${value.toFixed(2)} (elemento: ${element.tagName}, classe: ${element.className})`);
            return value;
          }
        }
      }
      
      // Última tentativa: buscar por qualquer valor R$ maior que 50
      const allElements = document.querySelectorAll('*');
      
      for (const element of allElements) {
        const textContent = element.textContent || '';
        const valueMatch = textContent.match(/R\$[\s\u00A0]*(\d+(?:[,\.]\d{2})?)/);
        
        if (valueMatch && element.className.includes('font-bold')) {
          let valueStr = valueMatch[1];
          if (valueStr.includes(',')) {
            valueStr = valueStr.replace(',', '.');
          }
          const value = parseFloat(valueStr);
          
          if (value > 50 && value < 200) { // Range esperado para custo por pneu
            console.log(`🎯 [ProductStock] Valor genérico encontrado: R$ ${value.toFixed(2)} (texto: "${textContent.trim()}")`);
            return value;
          }
        }
      }
      
      console.warn(`⚠️ [ProductStock] Nenhum valor real encontrado das métricas`);
      return 0;
    } catch (error) {
      console.error(`❌ [ProductStock] Erro ao ler elemento principal:`, error);
      return 0;
    }
  }, []);

  // Função para sincronizar com o elemento principal REAL das métricas
  const syncWithMainElement = useCallback((): number => {
    const realValue = readMainElementValue();
    console.log(`🔄 [ProductStock] Sincronização com valor REAL das métricas: R$ ${realValue.toFixed(2)}`);
    return realValue;
  }, [readMainElementValue]);

  // Função para obter o custo específico por produto - SEMPRE SINCRONIZADO COM ELEMENTO PRINCIPAL REAL
  const getSpecificProductCost = useCallback((productName: string) => {
    console.log(`🔍 [ProductStock] Buscando custo REAL para produto: "${productName}"`);

    // Ler o valor REAL e ATUAL do elemento principal das métricas
    const realValue = readMainElementValue();
    
    if (realValue === 0) {
      console.warn(`⚠️ [ProductStock] Valor das métricas é 0, tentando buscar valor específico salvo`);
      
      // Tentar buscar valor específico do localStorage como fallback
      try {
        const savedData = localStorage.getItem('tireCostManager_specificAnalyses');
        if (savedData) {
          const analyses = JSON.parse(savedData);
          const productAnalysis = analyses.find((analysis: any) => analysis.productName === productName);
          if (productAnalysis && productAnalysis.costPerTire > 0) {
            console.log(`🔄 [ProductStock] Usando valor salvo para "${productName}": R$ ${productAnalysis.costPerTire.toFixed(2)}`);
            return productAnalysis.costPerTire;
          }
        }
      } catch (error) {
        console.error(`❌ [ProductStock] Erro ao buscar dados salvos:`, error);
      }
    }

    console.log(`✅ [ProductStock] Usando custo REAL das métricas para "${productName}": R$ ${realValue.toFixed(2)}`);
    return realValue;
  }, [readMainElementValue]);

  // Função para limpar cache e forçar nova busca
  const clearCostCache = useCallback(() => {
    console.log("🧹 [ProductStock] Limpando cache de custos por produto");
    setProductCostCache({});
  }, []);

  // Função para escrever valor médio de custo por pneu no elemento input - DINÂMICO
  const writeAverageCostToInput = useCallback((overrideValue?: number) => {
    try {
      // Usar valor override ou ler dinamicamente do elemento principal
      const dynamicValue = overrideValue !== undefined ? overrideValue : syncWithMainElement();
      const formattedValue = `R$ ${dynamicValue.toFixed(2)}`;
      
      // Buscar pelo elemento input específico que contém "R$" e é readonly
      const inputElements = document.querySelectorAll('input[readonly]');
      
      for (const input of inputElements) {
        const inputElement = input as HTMLInputElement;
        if (inputElement.value && inputElement.value.includes('R$')) {
          // Definir o valor dinâmico sincronizado
          inputElement.value = formattedValue;
          
          console.log(`✅ [ProductStock] Input sincronizado dinamicamente: ${formattedValue}`);
          
          // Disparar evento para notificar mudança
          const event = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(event);
          break;
        }
      }
    } catch (error) {
      console.error("❌ [ProductStock] Erro ao sincronizar input:", error);
    }
  }, [syncWithMainElement]);

  // Effect para sincronização dinâmica contínua
  useEffect(() => {
    const syncValues = () => {
      // Ler o valor atual do elemento principal
      const currentMainValue = syncWithMainElement();
      
      // Sincronizar o input com o valor principal
      writeAverageCostToInput(currentMainValue);
      
      // Atualizar o estado interno se necessário
      if (Math.abs(currentMainValue - mainElementValue) > 0.01) {
        setMainElementValue(currentMainValue);
        console.log(`🔄 [ProductStock] Estado interno atualizado para: R$ ${currentMainValue.toFixed(2)}`);
      }
    };

    // Aplicar sincronização imediatamente
    syncValues();

    // Verificar periodicamente para detectar mudanças no elemento principal
    const interval = setInterval(() => {
      syncValues();
    }, 1500); // Verificar a cada 1.5 segundos

    // Observer para detectar mudanças no DOM
    const observer = new MutationObserver((mutations) => {
      let shouldSync = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          // Verificar se alguma mudança afeta elementos com valores monetários
          const target = mutation.target as Element;
          if (target.textContent && target.textContent.includes('R$')) {
            shouldSync = true;
          }
        }
      });
      
      if (shouldSync) {
        console.log('🔍 [ProductStock] Mudança detectada no DOM, sincronizando...');
        setTimeout(() => syncValues(), 100); // Delay para garantir que o DOM foi atualizado
      }
    });

    // Observar mudanças no documento
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, [mainElementValue, writeAverageCostToInput, syncWithMainElement]);

  // Get all available products based on local type filter
  const getAllAvailableProducts = useCallback(() => {
    const finalProducts = activeProducts.map((p) => ({
      ...p,
      type: "final" as const,
    }));
    const resaleProductsFormatted = activeResaleProducts.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      type: "resale" as const,
    }));

    if (localProductType === "final") {
      return finalProducts;
    } else if (localProductType === "resale") {
      return resaleProductsFormatted;
    }
    return finalProducts; // Default to final products only
  }, [activeProducts, activeResaleProducts, localProductType]);

  const availableProducts = useMemo(() => getAllAvailableProducts(), [getAllAvailableProducts]);

  const handleStockOperation = useCallback((operation: "add" | "remove") => {
    if (selectedProduct && quantity && parseFloat(quantity) > 0) {
      // Para produtos finais, usar sempre o custo específico baseado no nome do produto
      const selectedProductData = availableProducts.find(
        (p) => p.id === selectedProduct,
      );
      const isFinalProduct = selectedProductData?.type === "final";

      let price: number | undefined = undefined;

      if (operation === "add") {
        if (isFinalProduct && selectedProductData) {
          // Para produtos finais, usar custo específico baseado no nome do produto
          price = getSpecificProductCost(selectedProductData.name);
          console.log(
            `💰 [ProductStock] Usando custo específico para produto final "${selectedProductData.name}": R$ ${price.toFixed(2)}`,
          );
        } else {
          // Para produtos de revenda, usar o preço manual se fornecido
          price = unitPrice ? parseFloat(unitPrice) : undefined;
          console.log(
            `💰 [ProductStock] Usando custo manual para produto revenda: R$ ${price?.toFixed(2) || "N/A"}`,
          );
        }
      }

      onStockUpdate(
        selectedProduct,
        "product",
        parseFloat(quantity),
        operation,
        price,
      );
      setQuantity("");
      setUnitPrice("");
    }
  }, [selectedProduct, quantity, unitPrice, availableProducts, getSpecificProductCost, onStockUpdate]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  const handleSetLevels = useCallback(() => {
    if (selectedItemForLevels && minLevel) {
      onSetMinLevel(selectedItemForLevels, "product", parseFloat(minLevel));
      setMinLevel("");
      setSelectedItemForLevels("");
      setIsLevelsDialogOpen(false);
    }
  }, [selectedItemForLevels, minLevel, onSetMinLevel]);

  const getStockForProduct = useCallback((productId: string) => {
    return stockItems.find((item) => item.item_id === productId);
  }, [stockItems]);

  const getStockLevel = useCallback((stock: StockItem) => {
    if (!stock.min_level) return "unknown";
    if (stock.quantity <= stock.min_level) return "low";
    return "normal";
  }, []);

  const getStockLevelColor = useCallback((level: string) => {
    switch (level) {
      case "low":
        return "text-red-400";
      case "normal":
        return "text-neon-green";
      default:
        return "text-tire-300";
    }
  }, []);

  const filteredProducts = useMemo(() => 
    availableProducts.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()),
    ), [availableProducts, searchTerm]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-factory-900/90 backdrop-blur-md rounded-2xl border border-tire-700/30">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-3">
          <Package2 className="h-5 w-5 text-neon-orange" />
          Estoque de Produtos
          {localProductType === "final" && (
            <span className="text-neon-green text-sm">(Finais)</span>
          )}
          {localProductType === "resale" && (
            <span className="text-neon-cyan text-sm">(Revenda)</span>
          )}
        </h3>
        <p className="text-tire-300 mt-2">
          {localProductType === "final" &&
            "Controle de entrada e saída de produtos fabricados"}
          {localProductType === "resale" &&
            "Controle de entrada e saída de produtos de revenda"}
        </p>
      </div>

      {/* Product Type Filter - Now inside Products tab */}
      <Card className="bg-factory-800/50 border-tire-600/30 mb-6">
        <CardHeader>
          <CardTitle className="text-tire-200 text-lg">
            Filtro por Tipo de Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setLocalProductType("final")}
              className={`flex-1 p-3 rounded-lg border transition-all ${
                localProductType === "final"
                  ? "bg-neon-green/20 border-neon-green text-neon-green"
                  : "bg-factory-700/30 border-tire-600/30 text-tire-300 hover:bg-factory-600/30"
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-medium">🏭 Produtos Finais</div>
                <div className="text-xs mt-1">
                  Produtos fabricados pela empresa
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setLocalProductType("resale")}
              className={`flex-1 p-3 rounded-lg border transition-all ${
                localProductType === "resale"
                  ? "bg-neon-cyan/20 border-neon-cyan text-neon-cyan"
                  : "bg-factory-700/30 border-tire-600/30 text-tire-300 hover:bg-factory-600/30"
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-medium">🛒 Produtos Revenda</div>
                <div className="text-xs mt-1">
                  Produtos comprados para revenda
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Operations */}
        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg">
              Movimentação de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-tire-300">Produto</Label>
              <Select
                value={selectedProduct}
                onValueChange={setSelectedProduct}
              >
                <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent className="bg-factory-800 border-tire-600/30">
                  {availableProducts.map((product) => (
                    <SelectItem
                      key={product.id}
                      value={product.id}
                      className="text-white hover:bg-tire-700/50"
                    >
                      {product.type === "final" ? "🏭" : "🛒"} {product.name} (
                      {product.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-tire-300">Quantidade</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                placeholder="Digite a quantidade"
              />
            </div>

            {/* Campo de preço condicional baseado no tipo de produto */}
            {(() => {
              const selectedProductData = availableProducts.find(
                (p) => p.id === selectedProduct,
              );
              const isFinalProduct = selectedProductData?.type === "final";

              if (isFinalProduct && selectedProductData) {
                // Para produtos finais, mostrar o custo específico do produto (somente leitura)
                const specificCost = getSpecificProductCost(
                  selectedProductData.name,
                );
                return (
                  <div className="space-y-2">
                    <Label className="text-tire-300">
                      Custo Específico - {selectedProductData.name}
                    </Label>
                    <div className="relative">
                      <Input
                        type="text"
                        value={`R$ ${specificCost.toFixed(2)}`}
                        readOnly
                        className="bg-factory-600/30 border-tire-500/30 text-neon-green font-medium cursor-not-allowed"
                      />
                      <div className="absolute right-3 top-2.5">
                        <Info className="h-4 w-4 text-neon-blue" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-neon-blue/10 rounded border border-neon-blue/30">
                        <Info className="h-4 w-4 text-neon-blue flex-shrink-0" />
                        <p className="text-xs text-neon-blue">
                          Custo específico baseado na análise do produto "
                          {selectedProductData.name}" do TireCostManager
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            console.log(
                              "🧹 [ProductStock] Limpando cache manualmente...",
                            );
                            clearCostCache();
                            // Forçar re-render do custo
                            const newCost = getSpecificProductCost(
                              selectedProductData.name,
                            );
                            console.log(
                              `🔄 [ProductStock] Novo custo após limpeza: R$ ${newCost.toFixed(2)}`,
                            );
                          }}
                          className="text-xs h-6 px-2 bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white hover:bg-tire-700/50"
                        >
                          🔄 Atualizar Custo
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const currentMainValue = syncWithMainElement();
                            const productCost = getSpecificProductCost(
                              selectedProductData.name,
                            );
                            
                            // Forçar escrita no input para teste
                            writeAverageCostToInput(currentMainValue);
                            
                            console.log(
                              "📊 [ProductStock] Estado atual da sincronização:",
                              {
                                valorElementoPrincipal: currentMainValue,
                                custoCalculadoProduto: productCost,
                                nomeProduto: selectedProductData.name,
                                mainElementValue,
                              }
                            );
                            alert(
                              `🔍 DEBUG - Estado da Sincronização:\n\n` +
                              `Valor do elemento principal: R$ ${currentMainValue.toFixed(2)}\n` +
                              `Custo calculado para "${selectedProductData.name}": R$ ${productCost.toFixed(2)}\n` +
                              `Estado interno mainElementValue: R$ ${mainElementValue.toFixed(2)}\n\n` +
                              `✅ Os valores ${currentMainValue === productCost ? 'ESTÃO' : 'NÃO ESTÃO'} sincronizados!\n\n` +
                              `📝 Valor escrito automaticamente no input!`
                            );
                          }}
                          className="text-xs h-6 px-2 bg-factory-700/50 border-tire-600/30 text-tire-300 hover:text-white hover:bg-tire-700/50"
                        >
                          🔍 Debug
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Para produtos de revenda, não mostrar campo de preço
                return null;
              }
            })()}

            <div className="flex gap-2">
              <Button
                onClick={() => handleStockOperation("add")}
                className="flex-1 bg-gradient-to-r from-neon-green to-tire-500 hover:from-tire-600 hover:to-neon-green text-white"
                disabled={!selectedProduct || !quantity || isLoading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
              <Button
                onClick={() => handleStockOperation("remove")}
                className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                disabled={!selectedProduct || !quantity || isLoading}
              >
                <Minus className="h-4 w-4 mr-2" />
                Remover
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stock List */}
        <Card className="lg:col-span-2 bg-factory-800/50 border-tire-600/30">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg flex items-center justify-between">
              Estoque Atual
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
                          {availableProducts.map((product) => (
                            <SelectItem
                              key={product.id}
                              value={product.id}
                              className="text-white hover:bg-tire-700/50"
                            >
                              {product.type === "final" ? "🏭" : "🛒"}{" "}
                              {product.name}
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
                      onClick={handleSetLevels}
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
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package2 className="h-12 w-12 text-tire-500 mx-auto mb-3" />
                  <p className="text-tire-400">
                    {searchTerm
                      ? "Nenhum produto encontrado"
                      : "Nenhum produto cadastrado"}
                  </p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const stock = getStockForProduct(product.id);
                  const stockLevel = stock ? getStockLevel(stock) : "unknown";
                  const stockLevelColor = getStockLevelColor(stockLevel);

                  // Get stock quantity from stock_items for both types
                  const displayQuantity = stock?.quantity || 0;

                  return (
                    <div
                      key={product.id}
                      className="p-4 bg-factory-700/30 rounded-lg border border-tire-600/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium flex items-center gap-2">
                          <span className="text-lg">
                            {product.type === "final" ? "🏭" : "🛒"}
                          </span>
                          {product.name}
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              product.type === "final"
                                ? "bg-neon-green/20 text-neon-green"
                                : "bg-neon-cyan/20 text-neon-cyan"
                            }`}
                          >
                            {product.type === "final" ? "Final" : "Revenda"}
                          </span>
                        </h4>
                        <div className="flex items-center gap-2">
                          {product.type === "final" && stockLevel === "low" && (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          )}
                          <span
                            className={`text-sm font-medium ${
                              product.type === "final"
                                ? stockLevelColor
                                : "text-neon-cyan"
                            }`}
                          >
                            {displayQuantity} {product.unit}
                          </span>
                        </div>
                      </div>
                      <div className="text-tire-400 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Tipo:</span>
                          <span
                            className={
                              product.type === "final"
                                ? "text-neon-green"
                                : "text-neon-cyan"
                            }
                          >
                            {product.type === "final"
                              ? "Produto Final"
                              : "Produto Revenda"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unidade:</span>
                          <span>{product.unit}</span>
                        </div>
                        {product.type === "final" && (
                          <>
                            {(() => {
                              // Para produtos finais, sempre mostrar o custo específico sincronizado
                              const specificCost = getSpecificProductCost(
                                product.name,
                              );
                              const totalValue = stock
                                ? stock.quantity * specificCost
                                : 0;

                              return (
                                <>
                                  <div className="flex justify-between">
                                    <span>Custo Específico:</span>
                                    <span className="text-neon-green font-medium">
                                      {formatCurrency(specificCost)}/
                                      {product.unit}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Valor Total:</span>
                                    <span className="text-neon-blue font-medium">
                                      {formatCurrency(totalValue)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-tire-400 text-xs">
                                      Fonte:
                                    </span>
                                    <span className="text-neon-cyan text-xs">
                                      TireCostManager ({product.name})
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </>
                        )}
                        {product.type === "resale" &&
                          stock &&
                          stock.unit_cost > 0 && (
                            <>
                              <div className="flex justify-between">
                                <span>Custo Médio:</span>
                                <span className="text-neon-green font-medium">
                                  {formatCurrency(stock.unit_cost)}/
                                  {product.unit}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Valor Total:</span>
                                <span className="text-neon-blue font-medium">
                                  {formatCurrency(stock.total_value)}
                                </span>
                              </div>
                            </>
                          )}
                        {product.type === "resale" &&
                          (!stock || stock.unit_cost === 0) && (
                            <div className="flex justify-between">
                              <span className="text-tire-400">Status:</span>
                              <span className="text-neon-cyan">
                                Configure preços no estoque
                              </span>
                            </div>
                          )}
                        {product.type === "final" &&
                          stock &&
                          stock.min_level && (
                            <>
                              <div className="flex justify-between">
                                <span>Nível Mínimo:</span>
                                <span>
                                  {stock.min_level} {product.unit}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <span className={stockLevelColor}>
                                  {stockLevel === "low" && "Estoque Baixo"}
                                  {stockLevel === "normal" && "Estoque Normal"}
                                </span>
                              </div>
                            </>
                          )}
                        {product.type === "final" &&
                          stock &&
                          stock.last_updated && (
                            <div className="flex justify-between">
                              <span>Última Atualização:</span>
                              <span>
                                {new Date(
                                  stock.last_updated,
                                ).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          )}
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
  );
};

export default ProductStock;