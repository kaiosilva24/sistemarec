import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CashFlowManager from "./CashFlowManager";
import FixedCostsManager from "./FixedCostsManager";
import TireCostManager from "./TireCostManager";
import VariableCostsManager from "./VariableCostsManager";
import DefectiveTireSalesManager from "./DefectiveTireSalesManager";
import PresumedProfitManager from "./PresumedProfitManager";
import ResaleProductProfitManager from "./ResaleProductProfitManager";

import RawMaterialDashboard from "./RawMaterialDashboard";
import {
  useEmployees,
  useCustomers,
  useSuppliers,
  useFixedCosts,
  useVariableCosts,
  useCashFlow,
  useSalespeople,
  useMaterials,
  useStockItems,
  useProductionEntries,
  useProducts,
  useRecipes,
  useDefectiveTireSales,
  useCostSimulations,
  useWarrantyEntries,
  useResaleProducts,
} from "@/hooks/useDataPersistence";
import type {
  DefectiveTireSale,
  CashFlowEntry,
  FixedCost,
  VariableCost,
} from "@/types/financial";

interface FinancialDashboardProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

const FinancialDashboard = ({
  onRefresh = () => {},
  isLoading = false,
}: FinancialDashboardProps) => {
  const [activeTab, setActiveTab] = useState("cashflow");

  // Use database hooks for financial data
  const { employees, isLoading: employeesLoading } = useEmployees();
  const { customers, isLoading: customersLoading } = useCustomers();
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { materials, isLoading: materialsLoading } = useMaterials();
  const { stockItems, isLoading: stockItemsLoading } = useStockItems();
  const { productionEntries, isLoading: productionLoading } =
    useProductionEntries();
  const { products, isLoading: productsLoading } = useProducts();
  const { recipes, isLoading: recipesLoading } = useRecipes();

  // Use financial hooks
  const {
    fixedCosts,
    addFixedCost,
    updateFixedCost,
    isLoading: fixedCostsLoading,
  } = useFixedCosts();
  const {
    variableCosts,
    addVariableCost,
    updateVariableCost,
    isLoading: variableCostsLoading,
  } = useVariableCosts();
  const {
    cashFlowEntries,
    addCashFlowEntry,
    deleteCashFlowEntry,
    isLoading: cashFlowLoading,
  } = useCashFlow();
  const {
    salespeople,
    addSalesperson,
    updateSalesperson,
    isLoading: salespeopleLoading,
  } = useSalespeople();
  const {
    defectiveTireSales,
    addDefectiveTireSale,
    deleteDefectiveTireSale,
    refreshDefectiveTireSales,
    isLoading: defectiveTireSalesLoading,
  } = useDefectiveTireSales();
  const { warrantyEntries, isLoading: warrantyEntriesLoading } =
    useWarrantyEntries();
  const { resaleProducts, isLoading: resaleProductsLoading } =
    useResaleProducts();

  // Wrapper handlers to satisfy Promise<void> types
  const handleAddCashFlowEntry = async (
    entryData: Omit<CashFlowEntry, "id" | "created_at">,
  ) => {
    await addCashFlowEntry(entryData);
  };

  const handleAddFixedCost = async (
    costData: Omit<FixedCost, "id" | "created_at" | "updated_at">,
  ) => {
    await addFixedCost(costData);
  };

  const handleAddVariableCost = async (
    costData: Omit<VariableCost, "id" | "created_at" | "updated_at">,
  ) => {
    await addVariableCost(costData);
  };

  const handleDeleteDefectiveTireSale = async (saleId: string) => {
    await deleteDefectiveTireSale(saleId);
  };

  const handleDeleteCashFlowEntry = async (id: string) => {
    await deleteCashFlowEntry(id);
  };

  // Enhanced defective tire sale handler that ensures immediate UI update
  const handleAddDefectiveTireSale = async (
    saleData: Omit<DefectiveTireSale, "id" | "created_at">,
  ) => {
    console.log(
      "🏭 [FinancialDashboard] INICIANDO registro de venda de pneu defeituoso:",
      {
        ...saleData,
        sale_date_formatted: new Date(saleData.sale_date).toLocaleDateString(
          "pt-BR",
        ),
        timestamp: new Date().toISOString(),
      },
    );

    try {
      console.log("🔄 [FinancialDashboard] Chamando addDefectiveTireSale...");
      const result = await addDefectiveTireSale(saleData);

      if (!result) {
        throw new Error(
          "addDefectiveTireSale retornou null - falha no registro",
        );
      }

      console.log("✅ [FinancialDashboard] Venda registrada com SUCESSO:", {
        id: result.id,
        tire_name: result.tire_name,
        quantity: result.quantity,
        sale_value: result.sale_value,
        sale_date: result.sale_date,
        sale_date_formatted: new Date(result.sale_date).toLocaleDateString(
          "pt-BR",
        ),
        created_at: result.created_at,
      });

      // Refresh data after successful addition
      console.log("🔄 [FinancialDashboard] Atualizando a lista de vendas...");
      await refreshDefectiveTireSales();
      console.log("✨ [FinancialDashboard] Lista de vendas atualizada.");

      // Optional: Trigger a general refresh if provided
      onRefresh();
    } catch (error) {
      console.error(
        "❌ [FinancialDashboard] ERRO CRÍTICO ao registrar venda:",
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          saleData,
        },
      );
      throw error;
    }
  };

  // Financial archive handlers
  const handleArchiveFixedCost = async (costId: string) => {
    const cost = fixedCosts.find((c) => c.id === costId);
    if (cost) {
      await updateFixedCost(costId, { archived: !cost.archived });
    }
  };

  const handleArchiveVariableCost = async (costId: string) => {
    const cost = variableCosts.find((c) => c.id === costId);
    if (cost) {
      await updateVariableCost(costId, { archived: !cost.archived });
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-neon-green to-neon-blue flex items-center justify-center">
            <span className="text-white font-bold text-lg">💰</span>
          </div>
          Sistema Financeiro
        </h2>
        <p className="text-tire-300 mt-2">
          Controle completo das finanças da empresa
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center w-full">
        <TabsList className="inline-flex flex-wrap items-center justify-evenly gap-2 bg-factory-800/50 p-2 border border-tire-600/30 mx-auto h-auto w-11/12">
          <TabsTrigger
            value="cashflow"
            className="text-tire-300 data-[state=active]:text-white data-[state=active]:bg-neon-green/20"
          >
            Fluxo de Caixa
          </TabsTrigger>


          <TabsTrigger
            value="fixed-costs"
            className="text-tire-300 data-[state=active]:text-white data-[state=active]:bg-neon-green/20"
          >
            Custos Fixos
          </TabsTrigger>
          <TabsTrigger
            value="variable-costs"
            className="text-tire-300 data-[state=active]:text-white data-[state=active]:bg-neon-green/20"
          >
            Custos Variáveis
          </TabsTrigger>
          <TabsTrigger
            value="tire-cost"
            className="text-tire-300 data-[state=active]:text-white data-[state=active]:bg-neon-green/20"
          >
            Custo por Pneu
          </TabsTrigger>
          <TabsTrigger
            value="defective-tire-sales"
            className="text-tire-300 data-[state=active]:text-white data-[state=active]:bg-neon-green/20"
          >
            Venda Pneus com Defeito
          </TabsTrigger>
          <TabsTrigger
            value="presumed-profit"
            className="text-tire-300 data-[state=active]:text-white data-[state=active]:bg-neon-green/20"
          >
            Lucro Produtos Finais
          </TabsTrigger>
          <TabsTrigger
            value="resale-product-profit"
            className="text-tire-300 data-[state=active]:text-white data-[state=active]:bg-neon-green/20"
          >
            Lucro Produto Revenda
          </TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="cashflow">
          <CashFlowManager
            isLoading={
              cashFlowLoading ||
              employeesLoading ||
              suppliersLoading ||
              customersLoading ||
              fixedCostsLoading ||
              variableCostsLoading ||
              salespeopleLoading
            }
            cashFlowEntries={cashFlowEntries}
            employees={employees}
            suppliers={suppliers}
            customers={customers}
            fixedCosts={fixedCosts}
            variableCosts={variableCosts}
            salespeople={salespeople}
            onSubmit={handleAddCashFlowEntry}
            onDelete={handleDeleteCashFlowEntry}
          />
        </TabsContent>





        <TabsContent value="fixed-costs">
          <FixedCostsManager
            isLoading={fixedCostsLoading}
            fixedCosts={fixedCosts}
            onSubmit={handleAddFixedCost}
            onArchive={handleArchiveFixedCost}
          />
        </TabsContent>

        <TabsContent value="variable-costs">
          <VariableCostsManager
            isLoading={variableCostsLoading}
            variableCosts={variableCosts}
            onSubmit={handleAddVariableCost}
            onArchive={handleArchiveVariableCost}
          />
        </TabsContent>

        <TabsContent value="tire-cost">
          <TireCostManager
            isLoading={
              materialsLoading ||
              employeesLoading ||
              fixedCostsLoading ||
              variableCostsLoading ||
              stockItemsLoading ||
              productionLoading ||
              productsLoading ||
              cashFlowLoading ||
              recipesLoading ||
              defectiveTireSalesLoading ||
              warrantyEntriesLoading
            }
            materials={materials}
            employees={employees}
            fixedCosts={fixedCosts}
            variableCosts={variableCosts}
            stockItems={stockItems}
            productionEntries={productionEntries}
            products={products}
            cashFlowEntries={cashFlowEntries}
            recipes={recipes}
            defectiveTireSales={defectiveTireSales}
            warrantyEntries={warrantyEntries}
          />
        </TabsContent>

        <TabsContent value="defective-tire-sales">
          <DefectiveTireSalesManager
            isLoading={defectiveTireSalesLoading}
            defectiveTireSales={defectiveTireSales}
            onSubmit={handleAddDefectiveTireSale}
            onDelete={handleDeleteDefectiveTireSale}
          />
        </TabsContent>

        <TabsContent value="presumed-profit">
          <PresumedProfitManager
            isLoading={
              materialsLoading ||
              employeesLoading ||
              fixedCostsLoading ||
              variableCostsLoading ||
              stockItemsLoading ||
              productionLoading ||
              productsLoading ||
              cashFlowLoading ||
              recipesLoading ||
              defectiveTireSalesLoading ||
              warrantyEntriesLoading
            }
            materials={materials}
            employees={employees}
            fixedCosts={fixedCosts}
            variableCosts={variableCosts}
            stockItems={stockItems}
            productionEntries={productionEntries}
            products={products}
            cashFlowEntries={cashFlowEntries}
            recipes={recipes}
            defectiveTireSales={defectiveTireSales}
            warrantyEntries={warrantyEntries}
          />
        </TabsContent>

        <TabsContent value="resale-product-profit">
          <ResaleProductProfitManager
            isLoading={
              cashFlowLoading || stockItemsLoading || resaleProductsLoading
            }
            cashFlowEntries={cashFlowEntries}
            stockItems={stockItems}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;
