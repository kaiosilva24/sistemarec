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
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Calendar,
  Filter,
  X,
  CalendarDays,
  Trash2,
} from "lucide-react";
import {
  CashFlowEntry,
  Employee,
  Supplier,
  Customer,
  FixedCost,
  VariableCost,
  Salesperson,
} from "@/types/financial";
import { useTranslation } from "react-i18next";

interface CashFlowManagerProps {
  cashFlowEntries?: CashFlowEntry[];
  employees?: Employee[];
  suppliers?: Supplier[];
  customers?: Customer[];
  fixedCosts?: FixedCost[];
  variableCosts?: VariableCost[];
  salespeople?: Salesperson[];
  onSubmit?: (entry: Omit<CashFlowEntry, "id" | "created_at">) => Promise<void>;
  onDelete: (id: string) => Promise<any>;
  isLoading?: boolean;
}

const CashFlowManager = ({
  cashFlowEntries = [],
  employees = [],
  suppliers = [],
  customers = [],
  fixedCosts = [],
  variableCosts = [],
  salespeople = [],
  onSubmit = async () => {},
  onDelete = async () => false,
  isLoading = false,
}: CashFlowManagerProps) => {
  const { t } = useTranslation();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [referenceName, setReferenceName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [filterMonth, setFilterMonth] = useState("");
  const [dateFilterType, setDateFilterType] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [filterCategory, setFilterCategory] = useState("all_categories");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // For income, category is not required; for expense, it is required
    const categoryRequired = type === "expense";

    if (
      (categoryRequired && !category) ||
      !referenceName.trim() ||
      !amount ||
      parseFloat(amount) <= 0
    )
      return;

    // Get category label in Portuguese for saving
    const categoryToSave =
      type === "expense" ? getCategoryLabel(category) : "Entrada de Caixa";

    await onSubmit({
      type,
      category: categoryToSave, // Save category name in Portuguese
      reference_id: referenceId || undefined,
      reference_name: referenceName.trim(),
      amount: parseFloat(amount),
      description: description.trim() || undefined,
      transaction_date: transactionDate,
    });

    // Reset form
    setCategory("");
    setReferenceId("");
    setReferenceName("");
    setAmount("");
    setDescription("");
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    setReferenceId("");
    setReferenceName("");
  };

  const handleReferenceChange = (value: string) => {
    setReferenceId(value);

    // Find the reference name based on category and ID
    let name = "";
    switch (category) {
      case "employees":
        name = employees.find((e) => e.id === value)?.name || "";
        break;
      case "suppliers":
        name = suppliers.find((s) => s.id === value)?.name || "";
        break;
      case "customers":
        name = customers.find((c) => c.id === value)?.name || "";
        break;
      case "salespeople":
        name = salespeople.find((s) => s.id === value)?.name || "";
        break;
      case "fixed_costs":
        name = fixedCosts.find((f) => f.id === value)?.name || "";
        break;
      case "variable_costs":
        name = variableCosts.find((v) => v.id === value)?.name || "";
        break;
    }
    setReferenceName(name);
  };

  const getExpenseCategories = () => [
    { value: "employees", label: "Funcionários", data: employees },
    { value: "suppliers", label: "Fornecedores", data: suppliers },
    { value: "salespeople", label: "Vendedores", data: salespeople },
    { value: "fixed_costs", label: "Custos Fixos", data: fixedCosts },
    { value: "variable_costs", label: "Custos Variáveis", data: variableCosts },
  ];

  const getIncomeCategories = () => [
    { value: "customers", label: "Clientes", data: customers },
    { value: "salespeople", label: "Vendedores", data: salespeople },
  ];

  const getCurrentCategoryData = () => {
    const allCategories = [...getExpenseCategories(), ...getIncomeCategories()];
    return allCategories.find((cat) => cat.value === category)?.data || [];
  };

  // Function to get category label in Portuguese
  const getCategoryLabel = (categoryValue: string) => {
    const allCategories = [...getExpenseCategories(), ...getIncomeCategories()];
    return (
      allCategories.find((cat) => cat.value === categoryValue)?.label ||
      categoryValue
    );
  };

  // Get all available categories for filter (same as selection categories)
  const getAllCategories = () => {
    const categories: string[] = [];

    // Add expense categories
    getExpenseCategories().forEach((cat) => {
      categories.push(cat.label);
    });

    // Add income category
    categories.push("Entrada de Caixa");

    // Add sales category for filtering
    categories.push("Venda");

    return categories;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredEntries = cashFlowEntries.filter((entry) => {
    const matchesSearch =
      entry.reference_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.description &&
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === "all" || entry.type === filterType;
    const matchesCategory =
      !filterCategory ||
      filterCategory === "all_categories" ||
      entry.category === filterCategory ||
      (filterCategory === "Venda" &&
        entry.category.toLowerCase().includes("venda"));

    // Advanced date filtering
    let matchesDate = true;
    const entryDate = new Date(entry.transaction_date);
    const today = new Date();

    switch (dateFilterType) {
      case "today":
        matchesDate =
          entry.transaction_date === today.toISOString().split("T")[0];
        break;
      case "last7days":
        const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = entryDate >= last7Days;
        break;
      case "last30days":
        const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = entryDate >= last30Days;
        break;
      case "thisMonth":
        const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        matchesDate = entry.transaction_date.startsWith(thisMonth);
        break;
      case "lastMonth":
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1,
        );
        const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
        matchesDate = entry.transaction_date.startsWith(lastMonthStr);
        break;
      case "month":
        matchesDate =
          !filterMonth || entry.transaction_date.startsWith(filterMonth);
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          matchesDate = entryDate >= startDate && entryDate <= endDate;
        } else if (customStartDate) {
          const startDate = new Date(customStartDate);
          matchesDate = entryDate >= startDate;
        } else if (customEndDate) {
          const endDate = new Date(customEndDate);
          matchesDate = entryDate <= endDate;
        }
        break;
      case "all":
      default:
        matchesDate = true;
        break;
    }

    return matchesSearch && matchesType && matchesDate && matchesCategory;
  });

  const totalIncome = filteredEntries
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const totalExpense = filteredEntries
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0);

  const balance = totalIncome - totalExpense;

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterMonth("");
    setDateFilterType("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setFilterCategory("all_categories");
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (entry: CashFlowEntry) => {
    console.log('🔥 [DEBUG] handleDeleteTransaction called with:', entry);
    const confirmMessage = `Tem certeza que deseja excluir esta transação?\n\nTipo: ${entry.type === "income" ? "Entrada" : "Saída"}\nValor: ${formatCurrency(entry.amount)}\nReferência: ${entry.reference_name}\nData: ${new Date(entry.transaction_date).toLocaleDateString("pt-BR")}`;

    if (confirm(confirmMessage)) {
      try {
        const success = await onDelete(entry.id);
        if (!success) {
          alert("Erro ao excluir a transação. Tente novamente.");
        }
      } catch (error) {
        console.error("Erro ao excluir transação:", error);
        alert(
          "Erro ao excluir a transação. Verifique o console para mais detalhes.",
        );
      }
    }
  };

  // Check if any filter is active
  const hasActiveFilters =
    searchTerm ||
    filterType !== "all" ||
    dateFilterType !== "all" ||
    filterMonth ||
    customStartDate ||
    customEndDate ||
    (filterCategory && filterCategory !== "all_categories");

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-factory-900/90 backdrop-blur-md rounded-2xl border border-tire-700/30">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-blue to-neon-green flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          Fluxo de Caixa
        </h2>
        <p className="text-tire-300 mt-2">
          Controle de entradas e saídas de caixa
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Total Entradas</p>
                <p className="text-2xl font-bold text-neon-green">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <div className="text-neon-green">
                <ArrowUpCircle className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Total Saídas</p>
                <p className="text-2xl font-bold text-red-400">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <div className="text-red-400">
                <ArrowDownCircle className="h-8 w-8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-factory-800/50 border-tire-600/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tire-300 text-sm">Saldo</p>
                <p
                  className={`text-2xl font-bold ${
                    balance >= 0 ? "text-neon-blue" : "text-red-400"
                  }`}
                >
                  {formatCurrency(balance)}
                </p>
              </div>
              <div className={balance >= 0 ? "text-neon-blue" : "text-red-400"}>
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
              Registrar Transação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-tire-300">Tipo de Transação *</Label>
                <Select
                  value={type}
                  onValueChange={(value: "income" | "expense") => {
                    setType(value);
                    setCategory("");
                    setReferenceId("");
                    setReferenceName("");
                  }}
                >
                  <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-factory-800 border-tire-600/30">
                    <SelectItem
                      value="expense"
                      className="text-white hover:bg-tire-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowDownCircle className="h-4 w-4 text-red-400" />
                        Saída de Caixa
                      </div>
                    </SelectItem>
                    <SelectItem
                      value="income"
                      className="text-white hover:bg-tire-700/50"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowUpCircle className="h-4 w-4 text-neon-green" />
                        Entrada de Caixa
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category selection - only for expenses */}
              {type === "expense" && (
                <div className="space-y-2">
                  <Label className="text-tire-300">Categoria *</Label>
                  <Select value={category} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-factory-800 border-tire-600/30">
                      {getExpenseCategories().map((cat) => (
                        <SelectItem
                          key={cat.value}
                          value={cat.value}
                          className="text-white hover:bg-tire-700/50"
                        >
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Reference selection for expenses (based on category) */}
              {type === "expense" && category && (
                <div className="space-y-2">
                  <Label className="text-tire-300">Pagar para *</Label>
                  <Select
                    value={referenceId}
                    onValueChange={handleReferenceChange}
                  >
                    <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="bg-factory-800 border-tire-600/30">
                      {getCurrentCategoryData()
                        .filter((item: any) => !item.archived)
                        .map((item: any) => (
                          <SelectItem
                            key={item.id}
                            value={item.id}
                            className="text-white hover:bg-tire-700/50"
                          >
                            {item.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Direct reference name input for income */}
              {type === "income" && (
                <div className="space-y-2">
                  <Label htmlFor="referenceName" className="text-tire-300">
                    Receber de *
                  </Label>
                  <Input
                    id="referenceName"
                    type="text"
                    value={referenceName}
                    onChange={(e) => setReferenceName(e.target.value)}
                    className="bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                    placeholder="Nome do cliente, empresa ou pessoa..."
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-tire-300">
                  Valor (R$) *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                  placeholder="0,00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-tire-300">
                  Data da Transação *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
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
                  placeholder="Detalhes da transação..."
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-neon-blue to-neon-green hover:from-neon-green hover:to-neon-blue text-white"
                disabled={
                  isLoading ||
                  (type === "expense" && !category) ||
                  !referenceName ||
                  !amount
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Registrar Transação
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="xl:col-span-2 bg-factory-800/50 border-tire-600/30">
          <CardHeader>
            <CardTitle className="text-tire-200 text-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-neon-blue" />
                Histórico de Transações
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

            {/* Filtros Organizados */}
            <div className="space-y-4">
              {/* Barra de Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-tire-400" />
                <Input
                  placeholder="Buscar por nome, categoria ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-factory-700/50 border-tire-600/30 text-white placeholder:text-tire-400"
                />
              </div>

              {/* Seção de Filtros */}
              <div className="p-4 bg-factory-700/30 rounded-lg border border-tire-600/20">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-neon-blue" />
                  <Label className="text-tire-200 font-medium">
                    Filtros Avançados
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Tipo de Transação */}
                  <div className="space-y-2">
                    <Label className="text-tire-300 text-sm">Tipo:</Label>
                    <Select
                      value={filterType}
                      onValueChange={(value: "all" | "income" | "expense") =>
                        setFilterType(value)
                      }
                    >
                      <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-factory-800 border-tire-600/30">
                        <SelectItem
                          value="all"
                          className="text-white hover:bg-tire-700/50"
                        >
                          Todas as transações
                        </SelectItem>
                        <SelectItem
                          value="income"
                          className="text-white hover:bg-tire-700/50"
                        >
                          <div className="flex items-center gap-2">
                            <ArrowUpCircle className="h-3 w-3 text-neon-green" />
                            Entradas
                          </div>
                        </SelectItem>
                        <SelectItem
                          value="expense"
                          className="text-white hover:bg-tire-700/50"
                        >
                          <div className="flex items-center gap-2">
                            <ArrowDownCircle className="h-3 w-3 text-red-400" />
                            Saídas
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro de Categoria */}
                  <div className="space-y-2">
                    <Label className="text-tire-300 text-sm">Categoria:</Label>
                    <Select
                      value={filterCategory}
                      onValueChange={setFilterCategory}
                    >
                      <SelectTrigger className="bg-factory-700/50 border-tire-600/30 text-white">
                        <SelectValue placeholder="Todas as categorias" />
                      </SelectTrigger>
                      <SelectContent className="bg-factory-800 border-tire-600/30">
                        <SelectItem
                          value="all_categories"
                          className="text-white hover:bg-tire-700/50"
                        >
                          Todas as categorias
                        </SelectItem>
                        {getAllCategories().map((category) => (
                          <SelectItem
                            key={category}
                            value={category}
                            className="text-white hover:bg-tire-700/50"
                          >
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Período */}
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

                  {/* Filtro de Mês Específico */}
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

                  {/* Filtros de Período Personalizado */}
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

                {/* Indicador de Filtros Ativos */}
                {hasActiveFilters && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {searchTerm && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-neon-blue/20 rounded text-neon-blue text-xs">
                        <Search className="h-3 w-3" />
                        Busca: "{searchTerm}"
                      </div>
                    )}
                    {filterType !== "all" && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-neon-green/20 rounded text-neon-green text-xs">
                        {filterType === "income" ? (
                          <ArrowUpCircle className="h-3 w-3" />
                        ) : (
                          <ArrowDownCircle className="h-3 w-3" />
                        )}
                        {filterType === "income" ? "Entradas" : "Saídas"}
                      </div>
                    )}
                    {dateFilterType !== "all" && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-neon-purple/20 rounded text-neon-purple text-xs">
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
                    {filterCategory && filterCategory !== "all_categories" && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded text-orange-300 text-xs">
                        <Filter className="h-3 w-3" />
                        Categoria: {filterCategory}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-tire-500 mx-auto mb-3" />
                  <p className="text-tire-400">
                    {hasActiveFilters
                      ? "Nenhuma transação encontrada com os filtros aplicados"
                      : "Nenhuma transação registrada"}
                  </p>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="mt-2 text-tire-300 hover:text-white"
                    >
                      Limpar filtros para ver todas as transações
                    </Button>
                  )}
                </div>
              ) : (
                filteredEntries
                  .sort(
                    (a, b) =>
                      new Date(b.transaction_date).getTime() -
                      new Date(a.transaction_date).getTime(),
                  )
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 bg-factory-700/30 rounded-lg border border-tire-600/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {entry.type === "income" ? (
                            <ArrowUpCircle className="h-5 w-5 text-neon-green" />
                          ) : (
                            <ArrowDownCircle className="h-5 w-5 text-red-400" />
                          )}
                          <div>
                            <h4 className="text-white font-medium">
                              {entry.reference_name}
                            </h4>
                            <p className="text-tire-400 text-sm">
                              {entry.category}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`text-lg font-bold ${
                                entry.type === "income"
                                  ? "text-neon-green"
                                  : "text-red-400"
                              }`}
                            >
                              {entry.type === "income" ? "+" : "-"}
                              {formatCurrency(entry.amount)}
                            </span>
                            <p className="text-tire-400 text-sm">
                              {new Date(
                                entry.transaction_date,
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTransaction(entry)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-8 w-8"
                            title="Excluir transação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {entry.description && (
                        <p className="text-tire-400 text-sm mt-2">
                          {entry.description}
                        </p>
                      )}
                    </div>
                  ))
              )}
            </div>
            {filteredEntries.length > 0 && (
              <div className="mt-4 p-3 bg-factory-700/20 rounded border border-tire-600/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-tire-300">Total de transações:</span>
                    <span className="text-white font-medium">
                      {filteredEntries.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-tire-300">Total entradas:</span>
                    <span className="text-neon-green font-bold">
                      {formatCurrency(totalIncome)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-tire-300">Total saídas:</span>
                    <span className="text-red-400 font-bold">
                      {formatCurrency(totalExpense)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-tire-600/30">
                  <span className="text-white font-medium">
                    Saldo do período:
                  </span>
                  <span
                    className={`font-bold text-lg ${
                      balance >= 0 ? "text-neon-blue" : "text-red-400"
                    }`}
                  >
                    {formatCurrency(balance)}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CashFlowManager;
