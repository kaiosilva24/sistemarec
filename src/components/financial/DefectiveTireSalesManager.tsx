import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  DollarSign,
  Calendar,
  Filter,
  X,
  CalendarDays,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { DefectiveTireSale } from "@/types/financial";
import { useTranslation } from "react-i18next";

interface DefectiveTireSalesManagerProps {
  defectiveTireSales?: DefectiveTireSale[];
  onSubmit?: (
    sale: Omit<DefectiveTireSale, "id" | "created_at">,
  ) => Promise<void>;
  onDelete?: (saleId: string) => Promise<void>;
  isLoading?: boolean;
}

const DefectiveTireSalesManager = ({
  defectiveTireSales = [],
  onSubmit = async () => {},
  onDelete = async () => {},
  isLoading = false,
}: DefectiveTireSalesManagerProps) => {
  const { t } = useTranslation();
  const [tireName, setTireName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [description, setDescription] = useState("");
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilterType, setDateFilterType] = useState("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !tireName.trim() ||
      !quantity ||
      !unitPrice ||
      parseFloat(quantity) <= 0 ||
      parseFloat(unitPrice) <= 0
    ) {
      console.warn(
        "⚠️ [DefectiveTireSalesManager] Validação falhou - campos obrigatórios",
      );
      return;
    }

    const quantityNum = parseFloat(quantity);
    const unitPriceNum = parseFloat(unitPrice);
    const totalValue = quantityNum * unitPriceNum;

    const saleData = {
      tire_name: tireName.trim(),
      quantity: quantityNum,
      unit_price: unitPriceNum,
      sale_value: totalValue,
      description: description.trim() || undefined,
      sale_date: saleDate,
    };

    console.log(
      "🏭 [DefectiveTireSalesManager] INICIANDO registro de venda de pneu defeituoso:",
      {
        ...saleData,
        sale_date_formatted: new Date(saleData.sale_date).toLocaleDateString(
          "pt-BR",
        ),
        timestamp: new Date().toISOString(),
      },
    );

    try {
      console.log("🔄 [DefectiveTireSalesManager] Chamando onSubmit...");
      const result = await onSubmit(saleData);

      console.log(
        "✅ [DefectiveTireSalesManager] onSubmit concluído com sucesso:",
        {
          result_id: result?.id,
          result_tire_name: result?.tire_name,
        },
      );

      console.log(
        "✅ [DefectiveTireSalesManager] Venda registrada com SUCESSO - resetando formulário",
      );

      // Reset form only after successful submission
      setTireName("");
      setQuantity("");
      setUnitPrice("");
      setDescription("");
      setSaleDate(new Date().toISOString().split("T")[0]);

      console.log("✅ [DefectiveTireSalesManager] Formulário resetado");
    } catch (error) {
      console.error("❌ [DefectiveTireSalesManager] ERRO ao registrar venda:", {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        saleData,
      });

      // Show user-friendly error message
      alert(
        `Erro ao registrar venda: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      );

      // Don't reset form on error so user doesn't lose data
    }
  };

  const handleDelete = async (sale: DefectiveTireSale) => {
    if (
      confirm(
        `Tem certeza que deseja deletar a venda de ${sale.quantity} unidade(s) do pneu "${sale.tire_name}" no valor total de ${formatCurrency(sale.sale_value)}?`,
      )
    ) {
      await onDelete(sale.id);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Advanced filtering logic
  const filteredSales = defectiveTireSales.filter((sale) => {
    const matchesSearch = sale.tire_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    // Advanced date filtering
    let matchesDate = true;
    const saleDate = new Date(sale.sale_date);
    const today = new Date();

    switch (dateFilterType) {
      case "today":
        matchesDate = sale.sale_date === today.toISOString().split("T")[0];
        break;
      case "last7days":
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = saleDate >= last7Days;
        break;
      case "last30days":
        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = saleDate >= last30Days;
        break;
      case "thisMonth":
        const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        matchesDate = sale.sale_date.startsWith(thisMonth);
        break;
      case "lastMonth":
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
        matchesDate = sale.sale_date.startsWith(lastMonthStr);
        break;
      case "month":
        matchesDate = !filterMonth || sale.sale_date.startsWith(filterMonth);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          matchesDate = saleDate >= startDate && saleDate <= endDate;
        } else if (customStartDate) {
          const startDate = new Date(customStartDate);
          matchesDate = saleDate >= startDate;
        } else if (customEndDate) {
          const endDate = new Date(customEndDate);
          matchesDate = saleDate <= endDate;
        }
        break;
      case "all":
      default:
        matchesDate = true;
        break;
    }

    return matchesSearch && matchesDate;
  });

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setDateFilterType("all");
    setFilterMonth("");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm ||
    dateFilterType !== "all" ||
    filterMonth ||
    customStartDate ||
    customEndDate;

  // Calculate totals
  const totalSales = filteredSales.reduce(
    (sum, sale) => sum + sale.sale_value,
    0,
  );
  const totalQuantity = filteredSales.reduce(
    (sum, sale) => sum + sale.quantity,
    0,
  );
  const averageSaleValue =
    filteredSales.length > 0 ? totalSales / filteredSales.length : 0;
  const averageUnitPrice = totalQuantity > 0 ? totalSales / totalQuantity : 0;

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-factory-900/90 backdrop-blur-md rounded-2xl border border-tire-700/30">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-white" />
          </div>
          Venda de Pneus com Defeito
        </h2>
        <p className="text-tire-300 mt-2">
          Registre as vendas de pneus defeituosos e acompanhe a receita
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Valor Total</p>
                <p className="text-2xl font-bold text-neon-green">
                  {formatCurrency(totalSales)}
                </p>
              </div>
              <div className="text-neon-green">
                <DollarSign className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Qtd. Total Pneus</p>
                <p className="text-2xl font-bold text-neon-blue">
                  {totalQuantity}
                </p>
              </div>
              <div className="text-neon-blue">
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Nº de Vendas</p>
                <p className="text-2xl font-bold text-orange-400">
                  {filteredSales.length}
                </p>
              </div>
              <div className="text-orange-400">
                <Calendar className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Preço Médio/Un</p>
                <p className="text-2xl font-bold text-purple-400">
                  {formatCurrency(averageUnitPrice)}
                </p>
              </div>
              <div className="text-purple-400">
                <DollarSign className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg">
              Registrar Venda de Pneu Defeituoso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tireName" className="text-tire-300">
                  Nome/Tipo do Pneu *
                </Label>
                <Input
                  id="tireName"
                  type="text"
                  value={tireName}
                  onChange={(e) => setTireName(e.target.value)}
                  className="bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                  placeholder="Ex: Pneu 175/70 R13, Pneu Caminhão..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-tire-300">
                    Quantidade *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="1"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                    placeholder="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitPrice" className="text-tire-300">
                    Preço Unitário (R$) *
                  </Label>
                  <Input
                    id="unitPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              {/* Total Value Display */}
              {quantity &&
                unitPrice &&
                parseFloat(quantity) > 0 &&
                parseFloat(unitPrice) > 0 && (
                  <div className="p-3 bg-factory-700/30 rounded-lg border border-tire-600/20">
                    <div className="flex justify-between items-center">
                      <span className="text-tire-300 font-medium">
                        Valor Total:
                      </span>
                      <span className="text-neon-green font-bold text-lg">
                        {formatCurrency(
                          parseFloat(quantity) * parseFloat(unitPrice),
                        )}
                      </span>
                    </div>
                    <p className="text-tire-400 text-sm mt-1">
                      {quantity} × {formatCurrency(parseFloat(unitPrice))}
                    </p>
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="saleDate" className="text-tire-300">
                  Data da Venda *
                </Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="bg-factory-700/50 border-tire-600/30 text-white"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-tire-300">
                  Observações (Opcional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                  placeholder="Detalhes sobre o defeito, comprador, etc..."
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-red-500 hover:to-orange-500 text-white"
                disabled={
                  isLoading ||
                  !tireName.trim() ||
                  !quantity ||
                  !unitPrice ||
                  parseFloat(quantity || "0") <= 0 ||
                  parseFloat(unitPrice || "0") <= 0
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Venda
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sales List */}
        <Card className="xl:col-span-2 bg-factory-800/50 border-tire-600/30">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                Histórico de Vendas
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-tire-300 hover:text-white hover:bg-tire-700/50 flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpar Filtros
                </Button>
              )}
            </CardTitle>

            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-tire-400" />
              <Input
                placeholder="Buscar por nome do pneu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
              />
            </div>

            {/* Advanced Date Filters */}
            <div className="p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-neon-blue" />
                <Label className="text-tire-200 font-medium">
                  Filtros de Data
                </Label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date Filter Type */}
                <div className="space-y-2">
                  <Label className="text-tire-300 text-sm">Período:</Label>
                  <Select
                    value={dateFilterType}
                    onValueChange={(value) => {
                      setDateFilterType(value);
                      // Reset other date filters when changing type
                      if (value !== "month") setFilterMonth("");
                      if (value !== "custom") {
                        setCustomStartDate("");
                        setCustomEndDate("");
                      }
                    }}
                  >
                    <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-factory-800 border-tire-600/30">
                      <SelectItem
                        value="all"
                        className="text-white hover:bg-tire-700/50"
                      >
                        Todas as datas
                      </SelectItem>
                      <SelectItem
                        value="today"
                        className="text-white hover:bg-tire-700/50"
                      >
                        Hoje
                      </SelectItem>
                      <SelectItem
                        value="last7days"
                        className="text-white hover:bg-tire-700/50"
                      >
                        Últimos 7 dias
                      </SelectItem>
                      <SelectItem
                        value="last30days"
                        className="text-white hover:bg-tire-700/50"
                      >
                        Últimos 30 dias
                      </SelectItem>
                      <SelectItem
                        value="thisMonth"
                        className="text-white hover:bg-tire-700/50"
                      >
                        Este mês
                      </SelectItem>
                      <SelectItem
                        value="lastMonth"
                        className="text-white hover:bg-tire-700/50"
                      >
                        Mês passado
                      </SelectItem>
                      <SelectItem
                        value="month"
                        className="text-white hover:bg-tire-700/50"
                      >
                        Mês específico
                      </SelectItem>
                      <SelectItem
                        value="custom"
                        className="text-white hover:bg-tire-700/50"
                      >
                        Período personalizado
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Specific Month Filter */}
                {dateFilterType === "month" && (
                  <div className="space-y-2">
                    <Label className="text-tire-300 text-sm">Mês:</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-tire-400" />
                      <Input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="pl-9 bg-factory-700/50 border-tire-600/30 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Custom Date Range */}
                {dateFilterType === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-tire-300 text-sm">
                        Data Inicial:
                      </Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-tire-400" />
                        <Input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="pl-9 bg-factory-700/50 border-tire-600/30 text-white"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-tire-300 text-sm">
                        Data Final:
                      </Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-tire-400" />
                        <Input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="pl-9 bg-factory-700/50 border-tire-600/30 text-white"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Active Filters Indicators */}
              {hasActiveFilters && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {searchTerm && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-neon-blue/20 rounded text-neon-blue text-xs">
                      <Search className="h-3 w-3" />
                      Busca: "{searchTerm}"
                    </div>
                  )}
                  {dateFilterType !== "all" && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-neon-green/20 rounded text-neon-green text-xs">
                      <Calendar className="h-3 w-3" />
                      {dateFilterType === "today" && "Hoje"}
                      {dateFilterType === "last7days" && "Últimos 7 dias"}
                      {dateFilterType === "last30days" && "Últimos 30 dias"}
                      {dateFilterType === "thisMonth" && "Este mês"}
                      {dateFilterType === "lastMonth" && "Mês passado"}
                      {dateFilterType === "month" && `Mês: ${filterMonth}`}
                      {dateFilterType === "custom" && "Período personalizado"}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSales.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-tire-500 mx-auto mb-3" />
                  <p className="text-tire-400">
                    {hasActiveFilters
                      ? "Nenhuma venda encontrada com os filtros aplicados"
                      : "Nenhuma venda de pneu defeituoso registrada"}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="mt-2 text-tire-300 hover:text-white"
                    >
                      Limpar filtros para ver todas as vendas
                    </Button>
                  )}
                </div>
              ) : (
                filteredSales
                  .sort(
                    (a, b) =>
                      new Date(b.sale_date).getTime() -
                      new Date(a.sale_date).getTime(),
                  )
                  .map((sale) => (
                    <div
                      key={sale.id}
                      className="p-4 bg-factory-700/30 rounded-lg border border-tire-600/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="h-5 w-5 text-orange-400" />
                          <div>
                            <h4 className="text-white font-medium">
                              {sale.tire_name}
                            </h4>
                            <div className="flex flex-wrap gap-4 text-sm">
                              <p className="text-tire-400">
                                Qtd:{" "}
                                <span className="text-neon-blue font-medium">
                                  {sale.quantity}
                                </span>
                              </p>
                              <p className="text-tire-400">
                                Preço/Un:{" "}
                                <span className="text-orange-400 font-medium">
                                  {formatCurrency(sale.unit_price)}
                                </span>
                              </p>
                              <p className="text-tire-400">
                                Data:{" "}
                                <span className="text-neon-purple font-medium">
                                  {new Date(sale.sale_date).toLocaleDateString(
                                    "pt-BR",
                                  )}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-neon-green font-bold text-lg">
                              {formatCurrency(sale.sale_value)}
                            </div>
                            <div className="text-tire-400 text-sm">Total</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(sale)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-8 w-8"
                            title="Deletar venda"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {sale.description && (
                        <p className="text-tire-400 text-sm mt-2">
                          {sale.description}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
            {filteredSales.length > 0 && (
              <div className="mt-4 p-3 bg-factory-700/20 rounded border border-tire-600/20">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-tire-300">Nº de vendas:</span>
                    <span className="text-white font-medium">
                      {filteredSales.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-tire-300">Qtd. total pneus:</span>
                    <span className="text-neon-blue font-bold">
                      {totalQuantity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-tire-300">Valor total:</span>
                    <span className="text-neon-green font-bold">
                      {formatCurrency(totalSales)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-tire-300">Preço médio/un:</span>
                    <span className="text-purple-400 font-bold">
                      {formatCurrency(averageUnitPrice)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DefectiveTireSalesManager;
