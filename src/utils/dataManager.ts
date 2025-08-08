// Utility functions for data persistence and management with Supabase
import { supabase } from "../../supabase/supabase";
import type {
  RawMaterial,
  Product,
  Employee,
  Customer,
  Supplier,
  StockItem,
  ProductionRecipe,
  ProductionEntry,
  FixedCost,
  VariableCost,
  CashFlowEntry,
  Salesperson,
  DefectiveTireSale,
  CostSimulation,
  WarrantyEntry,
  ResaleProduct,
} from "@/types/financial";

export class DataManager {
  private static instance: DataManager;
  private listeners: Map<string, Set<() => void>> = new Map();

  // Access Supabase client from the imported instance
  private get supabase() {
    return supabase;
  }

  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager();
    }
    return DataManager.instance;
  }

  // Generic database operations
  async saveToDatabase<
    T extends {
      id?: string;
      created_at?: string;
      updated_at?: string;
      last_updated?: string;
    },
  >(tableName: string, data: T): Promise<T | null> {
    try {
      const { id, created_at, updated_at, last_updated, ...dataToSave } = data;

      console.log(`🔧 [DataManager] saveToDatabase para ${tableName}:`, {
        originalData: data,
        cleanedData: dataToSave,
        removedFields: { id, created_at, updated_at, last_updated },
      });

      if (id && id.startsWith("temp_")) {
        // Insert new record
        const { data: insertedData, error } = await this.supabase
          .from(tableName)
          .insert([dataToSave])
          .select()
          .single();

        if (error) {
          console.error(
            `❌ [DataManager] Erro detalhado ao inserir em ${tableName}:`,
            {
              error,
              dataToSave,
              originalData: data,
            },
          );
          throw error;
        }

        console.log(
          `✅ [DataManager] Dados inseridos em ${tableName}:`,
          insertedData,
        );
        return insertedData;
      } else if (id) {
        // Update existing record
        const { data: updatedData, error } = await this.supabase
          .from(tableName)
          .update(dataToSave)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error(
            `❌ [DataManager] Erro detalhado ao atualizar em ${tableName}:`,
            {
              error,
              dataToSave,
              originalData: data,
              id,
            },
          );
          throw error;
        }

        console.log(
          `✅ [DataManager] Dados atualizados em ${tableName}:`,
          updatedData,
        );
        return updatedData;
      }

      return null;
    } catch (error) {
      console.error(`❌ [DataManager] Erro ao salvar em ${tableName}:`, error);
      return null;
    }
  }

  async loadFromDatabase<T>(tableName: string): Promise<T[]> {
    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log(
        `✅ [DataManager] Dados carregados de ${tableName}:`,
        data?.length || 0,
      );
      return data || [];
    } catch (error) {
      console.error(
        `❌ [DataManager] Erro ao carregar de ${tableName}:`,
        error,
      );
      return [];
    }
  }

  private async updateInDatabase(tableName: string, id: string, updates: any): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error(`Erro ao atualizar ${tableName}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Erro ao atualizar ${tableName}:`, error);
      return false;
    }
  }

  private async deleteFromDatabase(tableName: string, id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`Erro ao deletar de ${tableName}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Erro ao deletar de ${tableName}:`, error);
      return false;
    }
  }

  // Remove stock item by item_id (for when products are archived)
  async removeStockItemByItemId(itemId: string): Promise<boolean> {
    try {
      console.log(
        `🗑️ [DataManager] Removendo item do estoque por item_id: ${itemId}`,
      );

      // First, find the stock item to get details for logging
      const { data: stockItem, error: findError } = await this.supabase
        .from("stock_items")
        .select("*")
        .eq("item_id", itemId)
        .single();

      if (findError) {
        if (findError.code === "PGRST116") {
          console.log(
            `ℹ️ [DataManager] Item não encontrado no estoque: ${itemId}`,
          );
          return true; // Not an error if item doesn't exist in stock
        }
        throw findError;
      }

      if (stockItem) {
        console.log(`📦 [DataManager] Item encontrado no estoque:`, {
          id: stockItem.id,
          item_name: stockItem.item_name,
          quantity: stockItem.quantity,
          total_value: stockItem.total_value,
        });

        // Delete the stock item
        const { error: deleteError } = await this.supabase
          .from("stock_items")
          .delete()
          .eq("item_id", itemId);

        if (deleteError) throw deleteError;

        console.log(`✅ [DataManager] Item removido do estoque com sucesso:`, {
          item_id: itemId,
          item_name: stockItem.item_name,
          quantidade_removida: stockItem.quantity,
        });
      }

      return true;
    } catch (error) {
      console.error(
        `❌ [DataManager] Erro ao remover item do estoque por item_id ${itemId}:`,
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      return false;
    }
  }

  // Specific methods for each entity type
  async saveMaterial(
    material: Omit<RawMaterial, "id" | "created_at" | "updated_at">,
  ): Promise<RawMaterial | null> {
    return this.saveToDatabase("raw_materials", {
      ...material,
      id: `temp_${Date.now()}`,
    });
  }

  async loadMaterials(): Promise<RawMaterial[]> {
    return this.loadFromDatabase<RawMaterial>("raw_materials");
  }

  async updateMaterial(
    id: string,
    updates: Partial<RawMaterial>,
  ): Promise<RawMaterial | null> {
    return this.saveToDatabase("raw_materials", { ...updates, id });
  }

  // Delete material permanently
  async deleteMaterial(id: string): Promise<boolean> {
    try {
      console.log(
        `🗑️ [DataManager] Deletando matéria-prima permanentemente: ${id}`,
      );

      // First, remove any related stock items
      console.log(
        `🗑️ [DataManager] Removendo itens de estoque relacionados à matéria-prima: ${id}`,
      );
      const { error: stockError } = await this.supabase
        .from("stock_items")
        .delete()
        .eq("item_id", id)
        .eq("item_type", "material");

      if (stockError) {
        console.warn(
          "⚠️ [DataManager] Erro ao remover itens de estoque (pode não existir):",
          stockError,
        );
        // Continue with material deletion even if stock removal fails
      } else {
        console.log("✅ [DataManager] Itens de estoque removidos com sucesso");
      }

      // Then delete the material
      const { error: materialError } = await this.supabase
        .from("raw_materials")
        .delete()
        .eq("id", id);

      if (materialError) {
        console.error(
          "❌ [DataManager] Erro ao deletar matéria-prima:",
          materialError,
        );
        return false;
      }

      console.log(
        "✅ [DataManager] Matéria-prima deletada permanentemente com sucesso",
      );
      return true;
    } catch (error) {
      console.error(
        "❌ [DataManager] Erro crítico ao deletar matéria-prima:",
        error,
      );
      return false;
    }
  }

  async saveProduct(
    product: Omit<Product, "id" | "created_at" | "updated_at">,
  ): Promise<Product | null> {
    return this.saveToDatabase("products", {
      ...product,
      id: `temp_${Date.now()}`,
    });
  }

  async loadProducts(): Promise<Product[]> {
    return this.loadFromDatabase<Product>("products");
  }

  async updateProduct(
    id: string,
    updates: Partial<Product>,
  ): Promise<Product | null> {
    return this.saveToDatabase("products", { ...updates, id });
  }

  // Delete product permanently
  async deleteProduct(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ [DataManager] Deletando produto permanentemente: ${id}`);

      // First, remove any related stock items
      console.log(
        `🗑️ [DataManager] Removendo itens de estoque relacionados ao produto: ${id}`,
      );
      const { error: stockError } = await this.supabase
        .from("stock_items")
        .delete()
        .eq("item_id", id)
        .eq("item_type", "product");

      if (stockError) {
        console.warn(
          "⚠️ [DataManager] Erro ao remover itens de estoque (pode não existir):",
          stockError,
        );
        // Continue with product deletion even if stock removal fails
      } else {
        console.log("✅ [DataManager] Itens de estoque removidos com sucesso");
      }

      // Then delete the product
      const { error: productError } = await this.supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (productError) {
        console.error(
          "❌ [DataManager] Erro ao deletar produto:",
          productError,
        );
        return false;
      }

      console.log(
        "✅ [DataManager] Produto deletado permanentemente com sucesso",
      );
      return true;
    } catch (error) {
      console.error("❌ [DataManager] Erro crítico ao deletar produto:", error);
      return false;
    }
  }

  async saveEmployee(
    employee: Omit<Employee, "id" | "created_at" | "updated_at">,
  ): Promise<Employee | null> {
    return this.saveToDatabase("employees", {
      ...employee,
      id: `temp_${Date.now()}`,
    });
  }

  async loadEmployees(): Promise<Employee[]> {
    return this.loadFromDatabase<Employee>("employees");
  }

  async updateEmployee(
    id: string,
    updates: Partial<Employee>,
  ): Promise<Employee | null> {
    return this.saveToDatabase("employees", { ...updates, id });
  }

  async saveCustomer(
    customer: Omit<Customer, "id" | "created_at" | "updated_at">,
  ): Promise<Customer | null> {
    return this.saveToDatabase("customers", {
      ...customer,
      id: `temp_${Date.now()}`,
    });
  }

  async loadCustomers(): Promise<Customer[]> {
    return this.loadFromDatabase<Customer>("customers");
  }

  async updateCustomer(
    id: string,
    updates: Partial<Customer>,
  ): Promise<Customer | null> {
    return this.saveToDatabase("customers", { ...updates, id });
  }

  async saveSupplier(
    supplier: Omit<Supplier, "id" | "created_at" | "updated_at">,
  ): Promise<Supplier | null> {
    return this.saveToDatabase("suppliers", {
      ...supplier,
      id: `temp_${Date.now()}`,
    });
  }

  async loadSuppliers(): Promise<Supplier[]> {
    return this.loadFromDatabase<Supplier>("suppliers");
  }

  async updateSupplier(
    id: string,
    updates: Partial<Supplier>,
  ): Promise<Supplier | null> {
    return this.saveToDatabase("suppliers", { ...updates, id });
  }

  async saveStockItem(
    stockItem: Omit<StockItem, "id" | "created_at">,
  ): Promise<StockItem | null> {
    try {
      // Remove fields that don't exist in the stock_items table
      const {
        last_updated,
        updated_at, // This field doesn't exist in stock_items table
        ...dataToSave
      } = stockItem;

      // Validar tipos aceitos
      const validItemTypes = ["material", "product", "resaleProduct"];
      if (!validItemTypes.includes(dataToSave.item_type)) {
        console.warn(`⚠️ [DataManager] Tipo de item não reconhecido: ${dataToSave.item_type}, convertendo para 'product'`);
        dataToSave.item_type = "product";
      }

      console.log(
        `🔧 [DataManager] Inserindo stock item com dados:`,
        dataToSave,
      );

      const { data: insertedData, error } = await this.supabase
        .from("stock_items")
        .insert([dataToSave])
        .select()
        .single();

      if (error) {
        console.error(
          `❌ [DataManager] Erro detalhado ao inserir stock item:`,
          {
            error,
            dataToSave,
            originalStockItem: stockItem,
          },
        );
        throw error;
      }

      console.log(
        `✅ [DataManager] Stock item inserido com sucesso:`,
        insertedData,
      );
      return insertedData;
    } catch (error) {
      console.error(`❌ [DataManager] Erro ao salvar stock item:`, error);
      return null;
    }
  }

  async loadStockItems(): Promise<StockItem[]> {
    return this.loadFromDatabase<StockItem>("stock_items");
  }

  async updateStockItem(
    id: string,
    updates: Partial<StockItem>,
  ): Promise<StockItem | null> {
    try {
      // First, check if the stock item exists
      const { data: existingItem, error: checkError } = await this.supabase
        .from("stock_items")
        .select("id, item_name, quantity")
        .eq("id", id)
        .single();

      if (checkError) {
        console.error(
          `❌ [DataManager] Erro ao verificar se stock item existe:`,
          {
            id,
            errorMessage: checkError.message,
            errorCode: checkError.code,
            errorDetails: checkError.details,
          },
        );
        throw new Error(
          `Stock item com ID ${id} não encontrado: ${checkError.message}`,
        );
      }

      if (!existingItem) {
        console.error(`❌ [DataManager] Stock item não encontrado:`, { id });
        throw new Error(`Stock item com ID ${id} não encontrado`);
      }

      console.log(`✅ [DataManager] Stock item encontrado:`, existingItem);

      // Create a clean object with only allowed fields for stock_items table
      const dataToUpdate: any = {};

      // Only include fields that exist in the stock_items table
      const allowedFields = [
        "item_id",
        "item_name",
        "item_type",
        "unit",
        "quantity",
        "unit_cost",
        "total_value",
        "min_level",
        "max_level",
        "last_updated",
      ];

      // Explicitly filter out any forbidden fields
      const forbiddenFields = ["updated_at", "created_at", "id"];

      Object.keys(updates).forEach((key) => {
        // Skip forbidden fields completely
        if (forbiddenFields.includes(key)) {
          console.warn(`🚫 [DataManager] Skipping forbidden field: ${key}`);
          return;
        }

        // Only include allowed fields with defined values
        if (
          allowedFields.includes(key) &&
          updates[key as keyof StockItem] !== undefined &&
          updates[key as keyof StockItem] !== null
        ) {
          dataToUpdate[key] = updates[key as keyof StockItem];
        }
      });

      console.log(`🔧 [DataManager] Atualizando stock item ${id} com dados:`, {
        originalUpdates: updates,
        dataToUpdate,
        allowedFields,
        forbiddenFields,
        filteredOutFields: Object.keys(updates).filter(
          (key) =>
            !allowedFields.includes(key) || forbiddenFields.includes(key),
        ),
        hasDataToUpdate: Object.keys(dataToUpdate).length > 0,
        dataToUpdateKeys: Object.keys(dataToUpdate),
        dataToUpdateValues: Object.values(dataToUpdate),
      });

      // Validate that we have data to update
      if (Object.keys(dataToUpdate).length === 0) {
        console.warn(
          `⚠️ [DataManager] Nenhum dado válido para atualizar no stock item ${id}`,
        );
        console.warn(`⚠️ [DataManager] Updates originais:`, updates);
        console.warn(`⚠️ [DataManager] Campos permitidos:`, allowedFields);
        return null;
      }

      // Validate that the ID exists and is not empty
      if (!id || id.trim() === "") {
        console.error(
          `❌ [DataManager] ID inválido para atualizar stock item:`,
          { id, type: typeof id },
        );
        return null;
      }

      console.log(
        `🚀 [DataManager] Executando query Supabase para stock item ${id}...`,
      );

      // Double-check that no forbidden fields made it through
      forbiddenFields.forEach((field) => {
        if (dataToUpdate.hasOwnProperty(field)) {
          console.error(
            `❌ [DataManager] CRITICAL: Forbidden field ${field} found in dataToUpdate!`,
          );
          delete dataToUpdate[field];
        }
      });

      // Validate data types before sending to Supabase
      const validatedData: any = {};
      Object.entries(dataToUpdate).forEach(([key, value]) => {
        if (
          key === "quantity" ||
          key === "unit_cost" ||
          key === "total_value" ||
          key === "min_level" ||
          key === "max_level"
        ) {
          // Ensure numeric fields are numbers
          const numValue =
            typeof value === "string" ? parseFloat(value) : value;
          if (isNaN(numValue)) {
            console.error(
              `❌ [DataManager] Valor inválido para campo numérico ${key}:`,
              value,
            );
            throw new Error(`Valor inválido para campo ${key}: ${value}`);
          }
          validatedData[key] = numValue;
        } else {
          // String fields
          validatedData[key] = value;
        }
      });

      console.log(`🔍 [DataManager] Dados validados para update:`, {
        original: dataToUpdate,
        validated: validatedData,
      });

      const { data: updatedData, error } = await this.supabase
        .from("stock_items")
        .update(validatedData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(
          `❌ [DataManager] Erro detalhado ao atualizar stock item:`,
          {
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            fullError: error,
            id,
            dataToUpdate,
            originalUpdates: updates,
            finalDataKeys: Object.keys(dataToUpdate),
            supabaseQuery: `UPDATE stock_items SET ${Object.keys(dataToUpdate)
              .map((key) => `${key} = ?`)
              .join(", ")} WHERE id = '${id}'`,
          },
        );
        throw error;
      }

      console.log(
        `✅ [DataManager] Stock item atualizado com sucesso:`,
        updatedData,
      );
      return updatedData;
    } catch (error) {
      console.error(`❌ [DataManager] Erro ao atualizar stock item:`, {
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorCode: (error as any)?.code,
        errorDetails: (error as any)?.details,
        errorHint: (error as any)?.hint,
        fullError: error,
        stackTrace: error instanceof Error ? error.stack : undefined,
      });
      return null;
    }
  }

  async saveRecipe(
    recipe: Omit<ProductionRecipe, "id" | "created_at" | "updated_at">,
  ): Promise<ProductionRecipe | null> {
    return this.saveToDatabase("production_recipes", {
      ...recipe,
      id: `temp_${Date.now()}`,
    });
  }

  async loadRecipes(): Promise<ProductionRecipe[]> {
    return this.loadFromDatabase<ProductionRecipe>("production_recipes");
  }

  async updateRecipe(
    id: string,
    updates: Partial<ProductionRecipe>,
  ): Promise<ProductionRecipe | null> {
    return this.saveToDatabase("production_recipes", { ...updates, id });
  }

  async saveProductionEntry(
    entry: Omit<ProductionEntry, "id" | "created_at">,
  ): Promise<ProductionEntry | null> {
    console.log("💾 [DataManager] Salvando entrada de produção:", {
      ...entry,
      production_date_formatted: new Date(
        entry.production_date,
      ).toLocaleDateString("pt-BR"),
    });

    try {
      const result = await this.saveToDatabase("production_entries", {
        ...entry,
        id: `temp_${Date.now()}`,
      });

      if (result) {
        console.log("✅ [DataManager] Entrada de produção salva com sucesso:", {
          id: result.id,
          product_name: result.product_name,
          production_date: result.production_date,
          production_date_formatted: new Date(
            result.production_date,
          ).toLocaleDateString("pt-BR"),
        });
      } else {
        console.error(
          "❌ [DataManager] Falha ao salvar entrada de produção - resultado nulo",
        );
      }

      return result;
    } catch (error) {
      console.error(
        "❌ [DataManager] Erro crítico ao salvar entrada de produção:",
        error,
      );
      return null;
    }
  }

  async loadProductionEntries(): Promise<ProductionEntry[]> {
    console.log("🔄 [DataManager] Carregando entradas de produção do banco...");

    try {
      const entries =
        await this.loadFromDatabase<ProductionEntry>("production_entries");

      console.log("✅ [DataManager] Entradas de produção carregadas:", {
        total: entries.length,
        entries: entries.map((e) => ({
          id: e.id,
          product_name: e.product_name,
          production_date: e.production_date,
          production_date_formatted: new Date(
            e.production_date,
          ).toLocaleDateString("pt-BR"),
        })),
      });

      return entries;
    } catch (error) {
      console.error(
        "❌ [DataManager] Erro ao carregar entradas de produção:",
        error,
      );
      return [];
    }
  }

  async deleteProductionEntry(id: string): Promise<boolean> {
    return this.deleteFromDatabase("production_entries", id);
  }

  async saveCustomUnit(unit: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("custom_units")
        .insert([{ unit_name: unit }]);

      if (error) throw error;

      console.log(`✅ [DataManager] Unidade customizada salva:`, unit);
      return true;
    } catch (error) {
      console.error(
        `❌ [DataManager] Erro ao salvar unidade customizada:`,
        error,
      );
      return false;
    }
  }

  async loadCustomUnits(): Promise<string[]> {
    try {
      const { data, error } = await this.supabase
        .from("custom_units")
        .select("unit_name")
        .order("unit_name");

      if (error) throw error;

      const units = data?.map((item) => item.unit_name) || [];
      console.log(
        `✅ [DataManager] Unidades customizadas carregadas:`,
        units.length,
      );
      return units;
    } catch (error) {
      console.error(
        `❌ [DataManager] Erro ao carregar unidades customizadas:`,
        error,
      );
      return [];
    }
  }

  async deleteCustomUnit(unit: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from("custom_units")
        .delete()
        .eq("unit_name", unit);

      if (error) throw error;

      console.log(`✅ [DataManager] Unidade customizada deletada:`, unit);
      return true;
    } catch (error) {
      console.error(
        `❌ [DataManager] Erro ao deletar unidade customizada:`,
        error,
      );
      return false;
    }
  }

  // Fixed Costs methods
  async saveFixedCost(
    fixedCost: Omit<FixedCost, "id" | "created_at" | "updated_at">,
  ): Promise<FixedCost | null> {
    return this.saveToDatabase("fixed_costs", {
      ...fixedCost,
      id: `temp_${Date.now()}`,
    });
  }

  async loadFixedCosts(): Promise<FixedCost[]> {
    return this.loadFromDatabase<FixedCost>("fixed_costs");
  }

  async updateFixedCost(
    id: string,
    updates: Partial<FixedCost>,
  ): Promise<FixedCost | null> {
    return this.saveToDatabase("fixed_costs", { ...updates, id });
  }

  // Variable Costs methods
  async saveVariableCost(
    variableCost: Omit<VariableCost, "id" | "created_at" | "updated_at">,
  ): Promise<VariableCost | null> {
    return this.saveToDatabase("variable_costs", {
      ...variableCost,
      id: `temp_${Date.now()}`,
    });
  }

  async loadVariableCosts(): Promise<VariableCost[]> {
    return this.loadFromDatabase<VariableCost>("variable_costs");
  }

  async updateVariableCost(
    id: string,
    updates: Partial<VariableCost>,
  ): Promise<VariableCost | null> {
    return this.saveToDatabase("variable_costs", { ...updates, id });
  }

  // Cash Flow methods
  async saveCashFlowEntry(
    entry: Omit<CashFlowEntry, "id" | "created_at">,
  ): Promise<CashFlowEntry | null> {
    console.log('💰 [DataManager] Salvando entrada de cash flow:', {
      type: entry.type,
      category: entry.category,
      reference_name: entry.reference_name,
      amount: entry.amount,
      transaction_date: entry.transaction_date,
      timestamp: new Date().toISOString()
    });

    const result = await this.saveToDatabase("cash_flow_entries", {
      ...entry,
      id: `temp_${Date.now()}`,
    });

    if (result) {
      console.log('✅ [DataManager] Entrada de cash flow salva com sucesso:', {
        id: result.id,
        type: result.type,
        category: result.category,
        amount: result.amount
      });

      // Disparar evento customizado para notificar sobre nova entrada de cash flow
      const cashFlowEvent = new CustomEvent('cashFlowEntryAdded', {
        detail: {
          entry: result,
          timestamp: Date.now(),
          source: 'DataManager-saveCashFlowEntry'
        }
      });
      window.dispatchEvent(cashFlowEvent);
    }

    return result;
  }

  async loadCashFlowEntries(): Promise<CashFlowEntry[]> {
    return this.loadFromDatabase<CashFlowEntry>("cash_flow_entries");
  }

  async deleteCashFlowEntry(id: string): Promise<boolean> {
    return this.deleteFromDatabase("cash_flow_entries", id);
  }

  // Salespeople methods
  async saveSalesperson(
    salesperson: Omit<Salesperson, "id" | "created_at" | "updated_at">,
  ): Promise<Salesperson | null> {
    return this.saveToDatabase("salespeople", {
      ...salesperson,
      id: `temp_${Date.now()}`,
    });
  }

  async loadSalespeople(): Promise<Salesperson[]> {
    return this.loadFromDatabase<Salesperson>("salespeople");
  }

  async updateSalesperson(
    id: string,
    updates: Partial<Salesperson>,
  ): Promise<Salesperson | null> {
    return this.saveToDatabase("salespeople", { ...updates, id });
  }

  // Defective Tire Sales methods
  async saveDefectiveTireSale(
    sale: Omit<DefectiveTireSale, "id" | "created_at">,
  ): Promise<DefectiveTireSale | null> {
    console.log(
      "💾 [DataManager] INICIANDO salvamento de venda de pneu defeituoso:",
      {
        ...sale,
        sale_date_formatted: new Date(sale.sale_date).toLocaleDateString(
          "pt-BR",
        ),
      },
    );

    try {
      // Validate required fields
      if (
        !sale.tire_name ||
        !sale.quantity ||
        !sale.unit_price ||
        !sale.sale_value ||
        !sale.sale_date
      ) {
        throw new Error(
          "Campos obrigatórios faltando na venda de pneu defeituoso",
        );
      }

      // Clean data with all required fields
      const cleanSaleData = {
        tire_name: sale.tire_name.trim(),
        quantity: Number(sale.quantity),
        unit_price: Number(sale.unit_price),
        sale_value: Number(sale.sale_value),
        description: sale.description?.trim() || null,
        sale_date: sale.sale_date,
      };

      console.log(
        "🔧 [DataManager] Dados limpos para inserção:",
        cleanSaleData,
      );

      // Validate numeric fields
      if (isNaN(cleanSaleData.quantity) || cleanSaleData.quantity <= 0) {
        throw new Error(`Quantidade inválida: ${sale.quantity}`);
      }
      if (isNaN(cleanSaleData.unit_price) || cleanSaleData.unit_price <= 0) {
        throw new Error(`Preço unitário inválido: ${sale.unit_price}`);
      }
      if (isNaN(cleanSaleData.sale_value) || cleanSaleData.sale_value <= 0) {
        throw new Error(`Valor de venda inválido: ${sale.sale_value}`);
      }

      // Validate date format
      const dateTest = new Date(cleanSaleData.sale_date);
      if (isNaN(dateTest.getTime())) {
        throw new Error(`Data de venda inválida: ${sale.sale_date}`);
      }

      // Use direct Supabase insertion for better error handling
      const { data: insertedData, error } = await this.supabase
        .from("defective_tire_sales")
        .insert([cleanSaleData])
        .select()
        .single();

      if (error) {
        console.error(
          "❌ [DataManager] Erro detalhado ao inserir venda de pneu defeituoso:",
          {
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            cleanSaleData,
            originalSale: sale,
          },
        );
        throw error;
      }

      if (!insertedData) {
        throw new Error("Supabase retornou dados nulos após inserção");
      }

      console.log(
        "✅ [DataManager] Venda de pneu defeituoso salva com SUCESSO:",
        {
          id: insertedData.id,
          tire_name: insertedData.tire_name,
          quantity: insertedData.quantity,
          unit_price: insertedData.unit_price,
          sale_value: insertedData.sale_value,
          sale_date: insertedData.sale_date,
          sale_date_formatted: new Date(
            insertedData.sale_date,
          ).toLocaleDateString("pt-BR"),
          created_at: insertedData.created_at,
        },
      );

      // Verify the data was actually saved by querying it back
      console.log(
        "🔍 [DataManager] Verificando se a venda foi realmente salva...",
      );
      const { data: verificationData, error: verificationError } =
        await this.supabase
          .from("defective_tire_sales")
          .select("*")
          .eq("id", insertedData.id)
          .single();

      if (verificationError || !verificationData) {
        console.error(
          "❌ [DataManager] ERRO na verificação - venda não encontrada após inserção:",
          {
            verificationError,
            insertedId: insertedData.id,
          },
        );
        throw new Error(
          "Venda não foi encontrada após inserção - possível problema de consistência",
        );
      }

      console.log(
        "✅ [DataManager] VERIFICAÇÃO CONCLUÍDA - Venda confirmada no banco:",
        {
          id: verificationData.id,
          tire_name: verificationData.tire_name,
          quantity: verificationData.quantity,
          unit_price: verificationData.unit_price,
          sale_value: verificationData.sale_value,
          created_at: verificationData.created_at,
        },
      );

      return insertedData;
    } catch (error) {
      console.error(
        "❌ [DataManager] ERRO CRÍTICO ao salvar venda de pneu defeituoso:",
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          originalSale: sale,
          table: "defective_tire_sales",
        },
      );
      return null;
    }
  }

  async loadDefectiveTireSales(): Promise<DefectiveTireSale[]> {
    console.log(
      "🔄 [DataManager] CARREGANDO vendas de pneus defeituosos do banco...",
    );

    try {
      // Use direct Supabase query for better error handling
      const { data: sales, error } = await this.supabase
        .from("defective_tire_sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ [DataManager] Erro detalhado ao carregar vendas:", {
          error,
          errorMessage: error.message,
          errorCode: error.code,
          errorDetails: error.details,
        });
        throw error;
      }

      const salesData = sales || [];

      console.log("✅ [DataManager] Vendas de pneus defeituosos CARREGADAS:", {
        total: salesData.length,
        tabela: "defective_tire_sales",
        primeiras_vendas: salesData.slice(0, 3).map((s) => ({
          id: s.id,
          tire_name: s.tire_name,
          quantity: s.quantity,
          unit_price: s.unit_price,
          sale_value: s.sale_value,
          sale_date: s.sale_date,
          sale_date_formatted: new Date(s.sale_date).toLocaleDateString(
            "pt-BR",
          ),
          created_at: s.created_at,
        })),
      });

      // Validate data structure
      const validSales = salesData.filter((sale) => {
        const isValid =
          sale.id &&
          sale.tire_name &&
          sale.quantity &&
          sale.unit_price &&
          sale.sale_value &&
          sale.sale_date;
        if (!isValid) {
          console.warn(
            "⚠️ [DataManager] Venda com dados inválidos encontrada:",
            sale,
          );
        }
        return isValid;
      });

      if (validSales.length !== salesData.length) {
        console.warn(
          `⚠️ [DataManager] ${salesData.length - validSales.length} vendas com dados inválidos foram filtradas`,
        );
      }

      return validSales;
    } catch (error) {
      console.error(
        "❌ [DataManager] ERRO CRÍTICO ao carregar vendas de pneus defeituosos:",
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      return [];
    }
  }

  async deleteDefectiveTireSale(id: string): Promise<boolean> {
    return this.deleteFromDatabase("defective_tire_sales", id);
  }

  // Cost Simulation methods
  async saveCostSimulation(
    simulation: Omit<CostSimulation, "id" | "created_at" | "updated_at">,
  ): Promise<CostSimulation | null> {
    console.log(
      "💾 [DataManager] INICIANDO salvamento de simulação de custo:",
      {
        name: simulation.name,
        simulation_type: simulation.simulation_type,
        cost_options: simulation.cost_options,
      },
    );

    try {
      // Validate required fields
      if (!simulation.name || !simulation.simulation_type) {
        throw new Error("Campos obrigatórios faltando na simulação de custo");
      }

      // Clean data with all required fields
      const cleanSimulationData = {
        name: simulation.name.trim(),
        description: simulation.description?.trim() || null,
        simulation_type: simulation.simulation_type,
        cost_options: simulation.cost_options,
        simulation_data: simulation.simulation_data,
        results: simulation.results || null,
      };

      console.log(
        "🔧 [DataManager] Dados limpos para inserção:",
        cleanSimulationData,
      );

      // Use direct Supabase insertion for better error handling
      const { data: insertedData, error } = await this.supabase
        .from("cost_simulations")
        .insert([cleanSimulationData])
        .select()
        .single();

      if (error) {
        console.error(
          "❌ [DataManager] Erro detalhado ao inserir simulação de custo:",
          {
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            cleanSimulationData,
            originalSimulation: simulation,
          },
        );
        throw error;
      }

      if (!insertedData) {
        throw new Error("Supabase retornou dados nulos após inserção");
      }

      console.log("✅ [DataManager] Simulação de custo salva com SUCESSO:", {
        id: insertedData.id,
        name: insertedData.name,
        simulation_type: insertedData.simulation_type,
        created_at: insertedData.created_at,
      });

      return insertedData;
    } catch (error) {
      console.error(
        "❌ [DataManager] ERRO CRÍTICO ao salvar simulação de custo:",
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          originalSimulation: simulation,
          table: "cost_simulations",
        },
      );
      return null;
    }
  }

  async loadCostSimulations(): Promise<CostSimulation[]> {
    console.log("🔄 [DataManager] CARREGANDO simulações de custo do banco...");

    try {
      // Use direct Supabase query for better error handling
      const { data: simulations, error } = await this.supabase
        .from("cost_simulations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "❌ [DataManager] Erro detalhado ao carregar simulações:",
          {
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
          },
        );
        throw error;
      }

      const simulationsData = simulations || [];

      console.log("✅ [DataManager] Simulações de custo CARREGADAS:", {
        total: simulationsData.length,
        tabela: "cost_simulations",
        primeiras_simulacoes: simulationsData.slice(0, 3).map((s) => ({
          id: s.id,
          name: s.name,
          simulation_type: s.simulation_type,
          created_at: s.created_at,
        })),
      });

      // Validate data structure
      const validSimulations = simulationsData.filter((simulation) => {
        const isValid =
          simulation.id &&
          simulation.name &&
          simulation.simulation_type &&
          simulation.cost_options &&
          simulation.simulation_data;
        if (!isValid) {
          console.warn(
            "⚠️ [DataManager] Simulação com dados inválidos encontrada:",
            simulation,
          );
        }
        return isValid;
      });

      if (validSimulations.length !== simulationsData.length) {
        console.warn(
          `⚠️ [DataManager] ${simulationsData.length - validSimulations.length} simulações com dados inválidos foram filtradas`,
        );
      }

      return validSimulations;
    } catch (error) {
      console.error(
        "❌ [DataManager] ERRO CRÍTICO ao carregar simulações de custo:",
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      return [];
    }
  }

  async updateCostSimulation(
    id: string,
    updates: Partial<CostSimulation>,
  ): Promise<CostSimulation | null> {
    console.log("🔄 [DataManager] ATUALIZANDO simulação de custo:", {
      id,
      updates,
    });

    try {
      // Remove fields that shouldn't be updated
      const { id: _, created_at, ...dataToUpdate } = updates;

      // Clean the data
      const cleanUpdates: any = {};
      Object.keys(dataToUpdate).forEach((key) => {
        if (dataToUpdate[key as keyof CostSimulation] !== undefined) {
          cleanUpdates[key] = dataToUpdate[key as keyof CostSimulation];
        }
      });

      if (Object.keys(cleanUpdates).length === 0) {
        console.warn(
          `⚠️ [DataManager] Nenhum dado válido para atualizar na simulação ${id}`,
        );
        return null;
      }

      const { data: updatedData, error } = await this.supabase
        .from("cost_simulations")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(
          "❌ [DataManager] Erro detalhado ao atualizar simulação de custo:",
          {
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            id,
            cleanUpdates,
            originalUpdates: updates,
          },
        );
        throw error;
      }

      console.log(
        "✅ [DataManager] Simulação de custo atualizada com sucesso:",
        updatedData,
      );
      return updatedData;
    } catch (error) {
      console.error(
        "❌ [DataManager] ERRO CRÍTICO ao atualizar simulação de custo:",
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          id,
          updates,
        },
      );
      return null;
    }
  }

  async deleteCostSimulation(id: string): Promise<boolean> {
    console.log("🗑️ [DataManager] DELETANDO simulação de custo:", id);
    return this.deleteFromDatabase("cost_simulations", id);
  }

  // Resale Products methods
  async saveResaleProduct(
    resaleProduct: Omit<ResaleProduct, "id" | "created_at" | "updated_at">,
  ): Promise<ResaleProduct | null> {
    return this.saveToDatabase("resale_products", {
      ...resaleProduct,
      id: `temp_${Date.now()}`,
    });
  }

  async loadResaleProducts(): Promise<ResaleProduct[]> {
    return this.loadFromDatabase<ResaleProduct>("resale_products");
  }

  async updateResaleProduct(
    id: string,
    updates: Partial<ResaleProduct>,
  ): Promise<ResaleProduct | null> {
    return this.saveToDatabase("resale_products", { ...updates, id });
  }

  // Warranty Entry methods
  async saveWarrantyEntry(
    warrantyEntry: Omit<WarrantyEntry, "id" | "created_at">,
  ): Promise<WarrantyEntry | null> {
    console.log(
      "💾 [DataManager] INICIANDO salvamento de entrada de garantia:",
      {
        customer_name: warrantyEntry.customer_name,
        product_name: warrantyEntry.product_name,
        quantity: warrantyEntry.quantity,
        warranty_date: warrantyEntry.warranty_date,
        warranty_date_formatted: new Date(
          warrantyEntry.warranty_date,
        ).toLocaleDateString("pt-BR"),
      },
    );

    try {
      // Validate required fields
      if (
        !warrantyEntry.customer_id ||
        !warrantyEntry.customer_name ||
        !warrantyEntry.product_name ||
        !warrantyEntry.salesperson_name ||
        !warrantyEntry.quantity ||
        !warrantyEntry.warranty_date
      ) {
        throw new Error("Campos obrigatórios faltando na entrada de garantia");
      }

      // Clean data with all required fields
      const cleanWarrantyData = {
        customer_id: warrantyEntry.customer_id.trim(),
        customer_name: warrantyEntry.customer_name.trim(),
        product_name: warrantyEntry.product_name.trim(),
        salesperson_name: warrantyEntry.salesperson_name.trim(),
        quantity: Number(warrantyEntry.quantity),
        warranty_date: warrantyEntry.warranty_date,
        description: warrantyEntry.description?.trim() || null,
      };

      console.log(
        "🔧 [DataManager] Dados limpos para inserção:",
        cleanWarrantyData,
      );

      // Validate numeric fields
      if (
        isNaN(cleanWarrantyData.quantity) ||
        cleanWarrantyData.quantity <= 0
      ) {
        throw new Error(`Quantidade inválida: ${warrantyEntry.quantity}`);
      }

      // Validate date format
      const dateTest = new Date(cleanWarrantyData.warranty_date);
      if (isNaN(dateTest.getTime())) {
        throw new Error(
          `Data de garantia inválida: ${warrantyEntry.warranty_date}`,
        );
      }

      // Use direct Supabase insertion for better error handling
      const { data: insertedData, error } = await this.supabase
        .from("warranty_entries")
        .insert([cleanWarrantyData])
        .select()
        .single();

      if (error) {
        console.error(
          "❌ [DataManager] Erro detalhado ao inserir entrada de garantia:",
          {
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
            errorHint: error.hint,
            cleanWarrantyData,
            originalWarrantyEntry: warrantyEntry,
          },
        );
        throw error;
      }

      if (!insertedData) {
        throw new Error("Supabase retornou dados nulos após inserção");
      }

      console.log("✅ [DataManager] Entrada de garantia salva com SUCESSO:", {
        id: insertedData.id,
        customer_name: insertedData.customer_name,
        product_name: insertedData.product_name,
        salesperson_name: insertedData.salesperson_name,
        quantity: insertedData.quantity,
        warranty_date: insertedData.warranty_date,
        warranty_date_formatted: new Date(
          insertedData.warranty_date,
        ).toLocaleDateString("pt-BR"),
        created_at: insertedData.created_at,
      });

      // Verify the data was actually saved by querying it back
      console.log(
        "🔍 [DataManager] Verificando se a garantia foi realmente salva...",
      );
      const { data: verificationData, error: verificationError } =
        await this.supabase
          .from("warranty_entries")
          .select("*")
          .eq("id", insertedData.id)
          .single();

      if (verificationError || !verificationData) {
        console.error(
          "❌ [DataManager] ERRO na verificação - garantia não encontrada após inserção:",
          {
            verificationError,
            insertedId: insertedData.id,
          },
        );
        throw new Error(
          "Garantia não foi encontrada após inserção - possível problema de consistência",
        );
      }

      console.log(
        "✅ [DataManager] VERIFICAÇÃO CONCLUÍDA - Garantia confirmada no banco:",
        {
          id: verificationData.id,
          customer_name: verificationData.customer_name,
          product_name: verificationData.product_name,
          quantity: verificationData.quantity,
          warranty_date: verificationData.warranty_date,
          created_at: verificationData.created_at,
        },
      );

      return insertedData;
    } catch (error) {
      console.error(
        "❌ [DataManager] ERRO CRÍTICO ao salvar entrada de garantia:",
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          originalWarrantyEntry: warrantyEntry,
          table: "warranty_entries",
        },
      );
      return null;
    }
  }

  async loadWarrantyEntries(): Promise<WarrantyEntry[]> {
    console.log("🔄 [DataManager] CARREGANDO entradas de garantia do banco...");

    try {
      // Use direct Supabase query for better error handling
      const { data: warranties, error } = await this.supabase
        .from("warranty_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "❌ [DataManager] Erro detalhado ao carregar garantias:",
          {
            error,
            errorMessage: error.message,
            errorCode: error.code,
            errorDetails: error.details,
          },
        );
        throw error;
      }

      const warrantiesData = warranties || [];

      console.log("✅ [DataManager] Entradas de garantia CARREGADAS:", {
        total: warrantiesData.length,
        tabela: "warranty_entries",
        primeiras_garantias: warrantiesData.slice(0, 3).map((w) => ({
          id: w.id,
          customer_name: w.customer_name,
          product_name: w.product_name,
          salesperson_name: w.salesperson_name,
          quantity: w.quantity,
          warranty_date: w.warranty_date,
          warranty_date_formatted: new Date(w.warranty_date).toLocaleDateString(
            "pt-BR",
          ),
          created_at: w.created_at,
        })),
      });

      // Validate data structure
      const validWarranties = warrantiesData.filter((warranty) => {
        const isValid =
          warranty.id &&
          warranty.customer_id &&
          warranty.customer_name &&
          warranty.product_name &&
          warranty.salesperson_name &&
          warranty.quantity &&
          warranty.warranty_date;
        if (!isValid) {
          console.warn(
            "⚠️ [DataManager] Garantia com dados inválidos encontrada:",
            warranty,
          );
        }
        return isValid;
      });

      if (validWarranties.length !== warrantiesData.length) {
        console.warn(
          `⚠️ [DataManager] ${warrantiesData.length - validWarranties.length} garantias com dados inválidos foram filtradas`,
        );
      }

      return validWarranties;
    } catch (error) {
      console.error(
        "❌ [DataManager] ERRO CRÍTICO ao carregar entradas de garantia:",
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        },
      );
      return [];
    }
  }

  async deleteWarrantyEntry(id: string): Promise<boolean> {
    console.log("🗑️ [DataManager] DELETANDO entrada de garantia:", id);
    return this.deleteFromDatabase("warranty_entries", id);
  }

  async loadWarrantyEntriesByCustomer(
    customerId: string,
  ): Promise<WarrantyEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from("warranty_entries")
        .select("*")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log(
        `✅ [DataManager] Garantias do cliente ${customerId} carregadas:`,
        data?.length || 0,
      );
      return data || [];
    } catch (error) {
      console.error(
        `❌ [DataManager] Erro ao carregar garantias do cliente ${customerId}:`,
        error,
      );
      return [];
    }
  }

  // Legacy localStorage methods for backward compatibility
  saveData<T>(key: string, data: T): boolean {
    try {
      const serializedData = JSON.stringify(data);
      localStorage.setItem(key, serializedData);
      localStorage.setItem(`${key}_backup`, serializedData);
      localStorage.setItem(`${key}_timestamp`, new Date().toISOString());

      console.log(`✅ [DataManager] Dados salvos localmente: ${key}`);
      this.notifyListeners(key);
      return true;
    } catch (error) {
      console.error(
        `❌ [DataManager] Erro ao salvar localmente ${key}:`,
        error,
      );
      return false;
    }
  }

  loadData<T>(key: string, defaultValue: T): T {
    try {
      let savedData = localStorage.getItem(key);

      if (!savedData) {
        savedData = localStorage.getItem(`${key}_backup`);
        if (savedData) {
          console.warn(`⚠️ [DataManager] Usando backup para ${key}`);
        }
      }

      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log(`✅ [DataManager] Dados carregados localmente: ${key}`);
        return parsedData;
      }
    } catch (error) {
      console.error(
        `❌ [DataManager] Erro ao carregar localmente ${key}:`,
        error,
      );
    }

    console.log(`🆕 [DataManager] Usando valor padrão para ${key}`);
    return defaultValue;
  }

  // Subscribe to data changes
  subscribe(key: string, callback: () => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  // Notify listeners of data changes
  private notifyListeners(key: string): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error(
            `❌ [DataManager] Erro no listener para ${key}:`,
            error,
          );
        }
      });
    }
  }

  // Get all stored keys
  getAllKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (
        key &&
        key.startsWith("tire-factory-") &&
        !key.includes("_backup") &&
        !key.includes("_timestamp")
      ) {
        keys.push(key);
      }
    }
    return keys;
  }

  // Export all data
  exportAllData(): Record<string, any> {
    const allData: Record<string, any> = {};
    const keys = this.getAllKeys();

    keys.forEach((key) => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          allData[key] = JSON.parse(data);
        }
      } catch (error) {
        console.error(`❌ [DataManager] Erro ao exportar ${key}:`, error);
      }
    });

    return allData;
  }

  // Import all data
  importAllData(data: Record<string, any>): boolean {
    try {
      Object.entries(data).forEach(([key, value]) => {
        this.saveData(key, value);
      });
      console.log(`✅ [DataManager] Dados importados com sucesso`);
      return true;
    } catch (error) {
      console.error(`❌ [DataManager] Erro ao importar dados:`, error);
      return false;
    }
  }

  // Clear all data
  clearAllData(): void {
    const keys = this.getAllKeys();
    keys.forEach((key) => {
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_backup`);
      localStorage.removeItem(`${key}_timestamp`);
    });
    console.log(`🗑️ [DataManager] Todos os dados foram limpos`);
  }

  // Get storage usage info
  getStorageInfo(): { used: number; available: number; keys: string[] } {
    let used = 0;
    const keys = this.getAllKeys();

    keys.forEach((key) => {
      const data = localStorage.getItem(key);
      if (data) {
        used += data.length;
      }
    });

    // Estimate available space (localStorage limit is usually 5-10MB)
    const estimated = 5 * 1024 * 1024; // 5MB

    return {
      used,
      available: estimated - used,
      keys,
    };
  }

  /**
   * Busca o custo médio por pneu do Supabase
   */
  async loadAverageTireCost(): Promise<number> {
    try {
      console.log('🔄 [DataManager] Carregando custo médio por pneu do Supabase...');

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value, updated_at')
        .eq('key', 'average_tire_cost')
        .single();

      if (error || !data) {
        console.warn('⚠️ [DataManager] Custo médio por pneu não encontrado no Supabase, usando valor padrão');
        return 101.09; // Valor padrão
      }

      const cost = Number(data.value) || 101.09;
      console.log(`✅ [DataManager] Custo médio por pneu carregado do Supabase: R$ ${cost.toFixed(2)}`);

      return cost;

    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar custo médio por pneu:', error);
      return 101.09; // Valor padrão em caso de erro
    }
  }

  /**
   * Subscreve às mudanças do custo médio por pneu em tempo real
   */
  subscribeToTireCostChanges(callback: (cost: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para custo médio por pneu...');

    const subscription = this.supabase
      .channel('tire-cost-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.average_tire_cost'
        },
        (payload) => {
          console.log('🔄 [DataManager] Mudança detectada no custo médio por pneu:', payload);

          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const newCost = Number(payload.new.value) || 101.09;
            console.log(`💰 [DataManager] Novo custo médio por pneu recebido: R$ ${newCost.toFixed(2)}`);

            // Chama callback
            callback(newCost);
          }
        }
      )
      .subscribe();

    // Retorna função para cancelar subscription
    return () => {
      console.log('🔕 [DataManager] Cancelando subscription do custo médio por pneu');
      subscription.unsubscribe();
    };
  }

  /**
   * Salva o lucro médio por pneu no Supabase e localStorage
   */
  async saveAverageTireProfit(profit: number): Promise<boolean> {
    try {
      console.log(`💰 [DataManager] Salvando lucro médio por pneu: R$ ${profit.toFixed(2)}`);

      // Tenta salvar no Supabase usando upsert
      const { error: supabaseError } = await this.supabase
        .from('system_settings')
        .upsert({
          key: 'average_tire_profit',
          value: profit,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (supabaseError) {
        console.warn('⚠️ [DataManager] Erro ao salvar no Supabase (tabela pode não existir):', supabaseError);
        console.log('📱 [DataManager] Salvando apenas no localStorage como fallback');
      } else {
        console.log('✅ [DataManager] Lucro médio por pneu salvo no Supabase com sucesso');
      }

      return true;

    } catch (error) {
      console.error('❌ [DataManager] Erro crítico ao salvar lucro médio por pneu:', error);
      return false;
    }
  }
  /**
   * Busca o lucro médio por pneu do Supabase com fallback para localStorage
   */
  async loadAverageTireProfit(): Promise<number> {
    try {
      console.log('🔄 [DataManager] Carregando lucro médio por pneu do Supabase...');

      // Tenta carregar do Supabase primeiro
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value, updated_at')
        .eq('key', 'average_tire_profit')
        .single();

      if (!error && data && data.value !== null) {
        const profit = Number(data.value);
        if (!isNaN(profit) && profit > 0) {
          console.log(`✅ [DataManager] Lucro médio por pneu carregado do Supabase: R$ ${profit.toFixed(2)}`);
          return profit;
        }
      }

      console.warn('⚠️ [DataManager] Supabase não retornou valor válido, usando valor padrão');
      return 78.77; // Valor padrão

    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar lucro médio por pneu:', error);
      return 78.77; // Valor padrão em caso de erro
    }
  }

  /**
   * Configura subscription em tempo real para mudanças no lucro médio por pneu
  subscribeToTireProfitChanges(callback: (newProfit: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para lucro médio por pneu...');

    const subscription = this.supabase
      .channel('tire_profit_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.average_tire_profit'
        },
        (payload) => {
          console.log('🔄 [DataManager] Mudança detectada no lucro médio por pneu:', payload);

          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const newProfit = Number(payload.new.value) || 78.77;
            console.log(`📡 [DataManager] Novo lucro médio por pneu recebido: R$ ${newProfit.toFixed(2)}`);

            // Chama callback
            callback(newProfit);
          }
        }
      )
      .subscribe();

    // Retorna função para cancelar subscription
    return () => {
      console.log('🔕 [DataManager] Cancelando subscription do lucro médio por pneu');
      subscription.unsubscribe();
    };
  }

  /**
   * Salva o lucro médio de produtos de revenda no Supabase e localStorage
   */
  async saveAverageResaleProfit(profit: number): Promise<boolean> {
    try {
      console.log(`💰 [DataManager] Salvando lucro médio de produtos de revenda: R$ ${profit.toFixed(2)}`);

      // Tenta salvar no Supabase usando upsert
      const { error: supabaseError } = await this.supabase
        .from('system_settings')
        .upsert({
          key: 'average_resale_profit',
          value: profit,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (supabaseError) {
        console.warn('⚠️ [DataManager] Erro ao salvar no Supabase (tabela pode não existir):', supabaseError);
        console.log('📱 [DataManager] Salvando apenas no localStorage como fallback');
      } else {
        console.log('✅ [DataManager] Lucro médio de produtos de revenda salvo no Supabase com sucesso');
      }

      return true;

    } catch (error) {
      console.error('❌ [DataManager] Erro crítico ao salvar lucro médio de produtos de revenda:', error);
      return false;
    }
  }

  /**
   * Salva o lucro médio de produtos de revenda apenas no Supabase (sem localStorage)
   */
  async saveAverageResaleProfit(profit: number): Promise<boolean> {
    try {
      console.log(`💾 [DataManager] Salvando lucro médio de produtos de revenda: R$ ${profit.toFixed(2)}`);

      const { error } = await this.supabase
        .from('system_settings')
        .upsert({
          key: 'average_resale_profit',
          value: profit.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ [DataManager] Erro ao salvar no Supabase:', error);
        return false;
      }

      console.log('✅ [DataManager] Lucro médio de produtos de revenda salvo no Supabase com sucesso');
      return true;

    } catch (error) {
      console.error('❌ [DataManager] Erro ao salvar lucro médio de produtos de revenda:', error);
      return false;
    }
  }

  /**
   * Busca o lucro médio de produtos de revenda apenas do Supabase (sem localStorage)
   */
  async loadAverageResaleProfit(): Promise<number> {
    try {
      console.log('🔄 [DataManager] Carregando lucro médio de produtos de revenda do Supabase...');

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value, updated_at')
        .eq('key', 'average_resale_profit')
        .single();

      if (error) {
        console.warn('⚠️ [DataManager] Erro ao carregar do Supabase:', error.message);
        return 0; // Valor padrão
      }

      const profit = Number(data.value) || 0;
      console.log(`✅ [DataManager] Lucro médio de produtos de revenda carregado do Supabase: R$ ${profit.toFixed(2)}`);

      return profit;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar lucro médio de produtos de revenda:', error);
      return 0; // Valor padrão em caso de erro
    }
  }

  /**
   * Configura subscription em tempo real para mudanças no lucro médio de produtos de revenda
   */
  subscribeToResaleProfitChanges(callback: (newProfit: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para lucro médio de produtos de revenda...');

    const subscription = this.supabase
      .channel('resale_profit_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.average_resale_profit'
        },
        (payload) => {
          console.log('🔄 [DataManager] Mudança detectada no lucro médio de produtos de revenda:', payload);

          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const newProfit = Number(payload.new.value) || 23.61;
            console.log(`📡 [DataManager] Novo lucro médio de produtos de revenda recebido: R$ ${newProfit.toFixed(2)}`);

            // Chama callback
            callback(newProfit);
          }
        }
      )
      .subscribe();

    // Retorna função para cancelar subscription
    return () => {
      console.log('🔕 [DataManager] Cancelando subscription do lucro médio de produtos de revenda');
      subscription.unsubscribe();
    };
  }

  /**
   * Salva o lucro médio por pneu no Supabase
   */
  async saveAverageTireProfit(profit: number): Promise<boolean> {
    try {
      console.log(`💾 [DataManager] Salvando lucro médio por pneu: R$ ${profit.toFixed(2)}`);

      // Tenta salvar no Supabase
      const { error } = await this.supabase
        .from('system_settings')
        .upsert({
          key: 'average_tire_profit',
          value: profit.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ [DataManager] Erro ao salvar no Supabase (usando localStorage como fallback):', error);
        // Salva no localStorage como fallback
        localStorage.setItem('dashboard_tireProfitValue_unified', JSON.stringify({
          value: profit,
          timestamp: Date.now()
        }));
        return true; // Retorna true porque localStorage funcionou
      }

      // Também salva no localStorage como backup
      localStorage.setItem('dashboard_tireProfitValue_unified', JSON.stringify({
        value: profit,
        timestamp: Date.now()
      }));

      console.log('✅ [DataManager] Lucro médio por pneu salvo no Supabase com sucesso');
      return true;

    } catch (error) {
      console.error('❌ [DataManager] Erro ao salvar lucro médio por pneu:', error);
      // Fallback para localStorage
      try {
        localStorage.setItem('dashboard_tireProfitValue_unified', JSON.stringify({
          value: profit,
          timestamp: Date.now()
        }));
        return true;
      } catch (localError) {
        console.error('❌ [DataManager] Erro também no localStorage:', localError);
        return false;
      }
    }
  }

  /**
   * Busca o lucro médio por pneu do Supabase com fallback para localStorage
   */
  async loadAverageTireProfit(): Promise<number> {
    try {
      console.log('🔄 [DataManager] Carregando lucro médio por pneu do Supabase...');

      // Tenta carregar do Supabase primeiro
      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value, updated_at')
        .eq('key', 'average_tire_profit')
        .single();

      if (!error && data && data.value !== null) {
        const profit = Number(data.value);
        if (!isNaN(profit) && profit > 0) {
          console.log(`✅ [DataManager] Lucro médio por pneu carregado do Supabase: R$ ${profit.toFixed(2)}`);
          return profit;
        }
      }

      console.warn('⚠️ [DataManager] Supabase não retornou valor válido, tentando localStorage...');

      // Fallback para localStorage
      const localData = localStorage.getItem('dashboard_tireProfitValue_unified');
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed && typeof parsed.value === 'number' && parsed.value > 0) {
            console.log(`✅ [DataManager] Lucro médio por pneu carregado do localStorage: R$ ${parsed.value.toFixed(2)}`);
            return parsed.value;
          }
        } catch (parseError) {
          console.error('❌ [DataManager] Erro ao parsear dados do localStorage:', parseError);
        }
      }

      console.warn('⚠️ [DataManager] Nenhum valor válido encontrado, usando valor padrão');
      return 78.77; // Valor padrão baseado no exemplo do usuário

    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar lucro médio por pneu:', error);

      // Fallback final para localStorage
      try {
        const localData = localStorage.getItem('dashboard_tireProfitValue_unified');
        if (localData) {
          const parsed = JSON.parse(localData);
          if (parsed && typeof parsed.value === 'number' && parsed.value > 0) {
            console.log(`✅ [DataManager] Lucro médio por pneu carregado do localStorage (fallback): R$ ${parsed.value.toFixed(2)}`);
            return parsed.value;
          }
        }
      } catch (fallbackError) {
        console.error('❌ [DataManager] Erro também no fallback localStorage:', fallbackError);
      }

      return 78.77; // Valor padrão em caso de erro total
    }
  }

  /**
   * Configura subscription em tempo real para mudanças no lucro médio por pneu
   */
  subscribeToTireProfitChanges(callback: (newProfit: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para lucro médio por pneu...');

    const subscription = this.supabase
      .channel('tire_profit_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.average_tire_profit'
        },
        (payload) => {
          console.log('🔄 [DataManager] Mudança detectada no lucro médio por pneu:', payload);

          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const newProfit = Number(payload.new.value) || 78.77;
            console.log(`📡 [DataManager] Novo lucro médio por pneu recebido: R$ ${newProfit.toFixed(2)}`);

            // Chama callback
            callback(newProfit);
          }
        }
      )
      .subscribe();

    // Retorna função para cancelar subscription
    return () => {
      console.log('🔕 [DataManager] Cancelando subscription do lucro médio por pneu');
      subscription.unsubscribe();
    };
  }

  /**
   * Salva o saldo de produtos finais apenas no Supabase (sem localStorage)
   */
  async saveFinalProductStockBalance(balance: number): Promise<boolean> {
    try {
      console.log(`📦 [DataManager] Salvando saldo de produtos finais: R$ ${balance.toFixed(2)}`);

      // Salvar no Supabase usando upsert
      const { error } = await this.supabase
        .from('system_settings')
        .upsert({
          key: 'final_product_stock_balance',
          value: balance.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ [DataManager] Erro ao salvar saldo de produtos finais no Supabase:', error);
        return false;
      }

      console.log(`✅ [DataManager] Saldo de produtos finais salvo com sucesso: R$ ${balance.toFixed(2)}`);
      return true;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao salvar saldo de produtos finais:', error);
      return false;
    }
  }

  /**
   * Carrega o saldo de produtos finais apenas do Supabase (sem localStorage)
   */
  async loadFinalProductStockBalance(): Promise<number> {
    try {
      console.log('🔍 [DataManager] Carregando saldo de produtos finais do Supabase...');

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'final_product_stock_balance')
        .single();

      if (error) {
        console.warn('⚠️ [DataManager] Erro ao carregar do Supabase:', error.message);
        return 0; // Valor padrão
      }

      const balance = Number(data.value) || 0;
      console.log(`✅ [DataManager] Saldo de produtos finais carregado do Supabase: R$ ${balance.toFixed(2)}`);

      return balance;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar saldo de produtos finais:', error);
      return 0; // Valor padrão em caso de erro
    }
  }

  /**
   * Configura subscription em tempo real para mudanças no saldo de produtos finais
   */
  subscribeToFinalProductStockChanges(callback: (newBalance: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para mudanças no saldo de produtos finais...');

    const subscription = this.supabase
      .channel('final_product_stock_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.final_product_stock_balance'
        },
        (payload) => {
          console.log('📡 [DataManager] Mudança detectada no saldo de produtos finais:', payload);

          if (payload.new && payload.new.value) {
            const newBalance = Number(payload.new.value) || 0;

            if (newBalance >= 0) {
              console.log(`💰 [DataManager] Novo saldo de produtos finais: R$ ${newBalance.toFixed(2)}`);
              callback(newBalance);
            }
          }
        }
      )
      .subscribe();

    console.log('✅ [DataManager] Subscription ativa para mudanças no saldo de produtos finais');

    // Retornar função de cleanup
    return () => {
      console.log('🔌 [DataManager] Cancelando subscription do saldo de produtos finais');
      this.supabase.removeChannel(subscription);
    };
  }

  /**
   * Salva o saldo de matéria-prima apenas no Supabase (sem localStorage)
   */
  async saveRawMaterialStockBalance(balance: number): Promise<boolean> {
    try {
      console.log(`💾 [DataManager] Salvando saldo de matéria-prima: R$ ${balance.toFixed(2)}`);

      // Salvar no Supabase usando upsert
      const { error } = await this.supabase
        .from('system_settings')
        .upsert({
          key: 'raw_material_stock_balance',
          value: balance.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ [DataManager] Erro ao salvar saldo de matéria-prima no Supabase:', error);
        return false;
      }

      console.log(`✅ [DataManager] Saldo de matéria-prima salvo com sucesso: R$ ${balance.toFixed(2)}`);
      return true;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao salvar saldo de matéria-prima:', error);
      return false;
    }
  }

  /**
   * Carrega o saldo de matéria-prima apenas do Supabase (sem localStorage)
   */
  async loadRawMaterialStockBalance(): Promise<number> {
    try {
      console.log('🔍 [DataManager] Carregando saldo de matéria-prima do Supabase...');

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'raw_material_stock_balance')
        .single();

      if (error) {
        console.warn('⚠️ [DataManager] Erro ao carregar saldo de matéria-prima do Supabase:', error.message);
        return 0; // Valor padrão
      }

      const balance = Number(data.value) || 0;
      console.log(`✅ [DataManager] Saldo de matéria-prima carregado do Supabase: R$ ${balance.toFixed(2)}`);

      return balance;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar saldo de matéria-prima:', error);
      return 0; // Valor padrão em caso de erro
    }
  }

  /**
   * Configura subscription em tempo real para mudanças no saldo de matéria-prima
   */
  subscribeToRawMaterialStockChanges(callback: (newBalance: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para mudanças no saldo de matéria-prima...');

    console.log('⚠️ [DataManager] TEMPORÁRIO: Subscription desabilitada (tabela system_settings não existe)');

    // TODO: Implementar Supabase Realtime quando tabela system_settings for criada
    // Por enquanto, retornar função vazia
    return () => {
      console.log('🔌 [DataManager] Cleanup de subscription de matéria-prima (vazia)');
    };
  }

  /**
   * Salva uma configuração do sistema no Supabase
   */
  async saveSystemSetting(key: string, value: string): Promise<boolean> {
    try {
      console.log(`💾 [DataManager] Salvando configuração do sistema: ${key}`);

      const { data: existingData, error: selectError } = await this.supabase
        .from('system_settings')
        .select('id, value')
        .eq('key', key)
        .single();

      // Handle case where the table might not exist yet
      if (selectError && selectError.code === '42P01') { // '42P01' is Undefined_table error code
          console.warn(`⚠️ [DataManager] Tabela 'system_settings' não encontrada. Tentando criar.`);
          // Attempt to create the table (this is a simplified example, actual DDL should be managed separately)
          // In a real app, you'd run migrations. For this example, we'll log a message.
          console.warn(`⚠️ [DataManager] Please ensure the 'system_settings' table exists with 'key' (TEXT, PRIMARY KEY), 'value' (TEXT), and 'updated_at' (TIMESTAMP WITH TIME ZONE) columns.`);
          // Proceed as if trying to insert, it might work if the table is implicitly created by some setups or will error again.
      } else if (selectError) {
          console.error(`❌ [DataManager] Erro ao verificar configuração ${key}:`, selectError);
          return false;
      }

      if (existingData) {
        // Atualizar registro existente
        const { error: updateError } = await this.supabase
          .from('system_settings')
          .update({
            value: value,
            updated_at: new Date().toISOString()
          })
          .eq('key', key);

        if (updateError) {
          console.error(`❌ [DataManager] Erro ao atualizar configuração ${key}:`, updateError);
          return false;
        }
      } else {
        // Inserir novo registro
        const { error: insertError } = await this.supabase
          .from('system_settings')
          .insert({
            key: key,
            value: value,
            description: `Configuração do sistema: ${key}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (insertError) {
          console.error(`❌ [DataManager] Erro ao inserir configuração ${key}:`, insertError);
          return false;
        }
      }

      console.log(`✅ [DataManager] Configuração ${key} salva com sucesso`);
      return true;
    } catch (error) {
      console.error(`❌ [DataManager] Erro ao salvar configuração ${key}:`, error);
      return false;
    }
  }

  /**
   * Carrega uma configuração do sistema do Supabase
   */
  async loadSystemSetting(key: string): Promise<string | null> {
    try {
      console.log(`🔍 [DataManager] Carregando configuração do sistema: ${key}`);

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          console.log(`⚠️ [DataManager] Configuração ${key} não encontrada`);
          return null;
        }
        console.error(`❌ [DataManager] Erro ao carregar configuração ${key}:`, error);
        return null;
      }

      console.log(`✅ [DataManager] Configuração ${key} carregada: ${data.value}`);
      return data.value;
    } catch (error) {
      console.error(`❌ [DataManager] Erro ao carregar configuração ${key}:`, error);
      return null;
    }
  }

  // ===== PRODUCT UNIT COST METHODS =====

  /**
   * Salva o custo unitário de um produto específico no Supabase
   */
  async saveProductUnitCost(productName: string, unitCost: number): Promise<boolean> {
    try {
      const key = `product_unit_cost_${productName.toLowerCase().replace(/\s+/g, '_')}`;
      console.log(`💰 [DataManager] Salvando custo unitário para ${productName}: R$ ${unitCost.toFixed(2)}`);

      const success = await this.saveSystemSetting(key, unitCost.toString());

      if (success) {
        // Salvar também no localStorage para fallback
        const productKey = `tireAnalysis_${productName.toLowerCase().replace(/\s+/g, '_')}`;
        const existingData = localStorage.getItem(productKey);
        let analysisData: any = {};

        if (existingData) {
          try {
            analysisData = JSON.parse(existingData);
          } catch (e) {
            console.warn(`⚠️ [DataManager] Erro ao parsear dados existentes para ${productName}`);
          }
        }

        analysisData.costPerTire = unitCost;
        analysisData.lastUpdated = Date.now();
        analysisData.source = 'DataManager-saveProductUnitCost';

        localStorage.setItem(productKey, JSON.stringify(analysisData));
        console.log(`✅ [DataManager] Custo unitário para ${productName} salvo no Supabase e localStorage`);
      }

      return success;
    } catch (error) {
      console.error(`❌ [DataManager] Erro ao salvar custo unitário para ${productName}:`, error);
      return false;
    }
  }

  /**
   * Carrega o custo unitário de um produto específico do Supabase
   */
  async loadProductUnitCost(productName: string): Promise<number | null> {
    try {
      const key = `product_unit_cost_${productName.toLowerCase().replace(/\s+/g, '_')}`;
      console.log(`🔍 [DataManager] Carregando custo unitário para ${productName}`);

      const costStr = await this.loadSystemSetting(key);

      if (costStr) {
        const cost = Number(costStr) || 0;
        console.log(`✅ [DataManager] Custo unitário para ${productName} carregado do Supabase: R$ ${cost.toFixed(2)}`);
        return cost;
      }

      // Fallback: tentar carregar do localStorage
      const productKey = `tireAnalysis_${productName.toLowerCase().replace(/\s+/g, '_')}`;
      const localData = localStorage.getItem(productKey);

      if (localData) {
        try {
          const analysis = JSON.parse(localData);
          if (analysis.costPerTire && analysis.costPerTire > 0) {
            console.log(`📦 [DataManager] Custo unitário para ${productName} carregado do localStorage: R$ ${analysis.costPerTire.toFixed(2)}`);

            // Sincronizar com Supabase para próximas consultas
            await this.saveProductUnitCost(productName, analysis.costPerTire);

            return analysis.costPerTire;
          }
        } catch (e) {
          console.warn(`⚠️ [DataManager] Erro ao parsear dados do localStorage para ${productName}`);
        }
      }

      console.log(`⚠️ [DataManager] Custo unitário para ${productName} não encontrado`);
      return null;
    } catch (error) {
      console.error(`❌ [DataManager] Erro ao carregar custo unitário para ${productName}:`, error);
      return null;
    }
  }

  /**
   * Carrega todos os custos unitários de produtos do Supabase
   */
  async loadAllProductUnitCosts(): Promise<{ [productName: string]: number }> {
    try {
      console.log('🔍 [DataManager] Carregando todos os custos unitários de produtos...');

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('key, value')
        .like('key', 'product_unit_cost_%');

      if (error) {
        console.error('❌ [DataManager] Erro ao carregar custos unitários:', error);
        return {};
      }

      const costs: { [productName: string]: number } = {};

      if (data) {
        data.forEach(item => {
          const productName = item.key.replace('product_unit_cost_', '').replace(/_/g, ' ');
          const cost = Number(item.value) || 0;
          if (cost > 0) {
            costs[productName] = cost;
          }
        });
      }

      console.log(`✅ [DataManager] ${Object.keys(costs).length} custos unitários carregados do Supabase`);
      return costs;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar custos unitários:', error);
      return {};
    }
  }

  /**
   * Configura subscription em tempo real para mudanças nos custos unitários
   */
  subscribeToProductCostChanges(callback: (productName: string, newCost: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para mudanças nos custos unitários...');

    const subscription = this.supabase
      .channel('product_costs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=like.product_unit_cost_%'
        },
        (payload) => {
          console.log('📡 [DataManager] Mudança detectada nos custos unitários:', payload);

          if (payload.new && payload.new.key && payload.new.value) {
            const productName = payload.new.key.replace('product_unit_cost_', '').replace(/_/g, ' ');
            const newCost = Number(payload.new.value) || 0;

            if (newCost > 0) {
              console.log(`💰 [DataManager] Novo custo unitário para ${productName}: R$ ${newCost.toFixed(2)}`);
              callback(productName, newCost);
            }
          }
        }
      )
      .subscribe();

    console.log('✅ [DataManager] Subscription ativa para mudanças nos custos unitários');

    // Retornar função de cleanup
    return () => {
      console.log('🔌 [DataManager] Cancelando subscription dos custos unitários');
      this.supabase.removeChannel(subscription);
    };
  }

  // ===== FINAL PRODUCT TOTAL QUANTITY METHODS =====

  /**
   * Salva a quantidade total de produtos finais apenas no Supabase (sem localStorage)
   */
  async saveFinalProductTotalQuantity(quantity: number): Promise<boolean> {
    try {
      console.log(`📦 [DataManager] Salvando quantidade total de produtos finais: ${quantity}`);

      const { error } = await this.supabase
        .from('system_settings')
        .upsert({
          key: 'final_product_total_quantity',
          value: quantity.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ [DataManager] Erro ao salvar quantidade total de produtos finais no Supabase:', error);
        return false;
      }

      console.log(`✅ [DataManager] Quantidade total de produtos finais salva com sucesso: ${quantity}`);
      return true;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao salvar quantidade total de produtos finais:', error);
      return false;
    }
  }

  /**
   * Carrega a quantidade total de produtos finais apenas do Supabase (sem localStorage)
   */
  async loadFinalProductTotalQuantity(): Promise<number> {
    try {
      console.log('🔍 [DataManager] Carregando quantidade total de produtos finais do Supabase...');

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'final_product_total_quantity')
        .single();

      if (error) {
        console.warn('⚠️ [DataManager] Erro ao carregar quantidade total de produtos finais do Supabase:', error.message);
        return 0; // Valor padrão
      }

      const quantity = Number(data.value) || 0;
      console.log(`✅ [DataManager] Quantidade total de produtos finais carregada do Supabase: ${quantity}`);

      return quantity;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar quantidade total de produtos finais:', error);
      return 0; // Valor padrão em caso de erro
    }
  }

  /**
   * Configura subscription em tempo real para mudanças na quantidade total de produtos finais
   */
  subscribeToFinalProductTotalQuantityChanges(callback: (newQuantity: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para mudanças na quantidade total de produtos finais...');

    const subscription = this.supabase
      .channel('final_product_quantity_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.final_product_total_quantity'
        },
        (payload) => {
          console.log('🔄 [DataManager] Mudança detectada na quantidade total de produtos finais:', payload);

          if (payload.new && typeof payload.new === 'object' && 'value' in payload.new) {
            const newQuantity = Number(payload.new.value) || 0;
            console.log(`📦 [DataManager] Nova quantidade total de produtos finais recebida: ${newQuantity}`);

            callback(newQuantity);
          }
        }
      )
      .subscribe();

    console.log('✅ [DataManager] Subscription ativa para mudanças na quantidade total de produtos finais');

    // Retornar função de cleanup
    return () => {
      console.log('🔌 [DataManager] Cancelando subscription da quantidade total de produtos finais');
      this.supabase.removeChannel(subscription);
    };
  }

  /**
   * Salva a quantidade unitária de matéria-prima apenas no Supabase (sem localStorage)
   */
  async saveRawMaterialUnitaryQuantity(quantity: number): Promise<boolean> {
    try {
      console.log(`💾 [DataManager] Salvando quantidade unitária de matéria-prima: ${quantity}`);

      // Salvar no Supabase usando upsert
      const { error } = await this.supabase
        .from('system_settings')
        .upsert({
          key: 'raw_material_unitary_quantity',
          value: quantity.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ [DataManager] Erro ao salvar quantidade unitária de matéria-prima no Supabase:', error);
        return false;
      }

      console.log(`✅ [DataManager] Quantidade unitária de matéria-prima salva com sucesso: ${quantity}`);
      return true;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao salvar quantidade unitária de matéria-prima:', error);
      return false;
    }
  }

  /**
   * Carrega a quantidade unitária de matéria-prima apenas do Supabase (sem localStorage)
   */
  async loadRawMaterialUnitaryQuantity(): Promise<number> {
    try {
      console.log('🔍 [DataManager] Carregando quantidade unitária de matéria-prima do Supabase...');

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'raw_material_unitary_quantity')
        .single();

      if (error) {
        console.warn('⚠️ [DataManager] Erro ao carregar quantidade unitária de matéria-prima do Supabase:', error.message);
        return 0; // Valor padrão
      }

      const quantity = Number(data.value) || 0;
      console.log(`✅ [DataManager] Quantidade unitária de matéria-prima carregada do Supabase: ${quantity}`);

      return quantity;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar quantidade unitária de matéria-prima:', error);
      return 0; // Valor padrão em caso de erro
    }
  }

  /**
   * Configura subscription em tempo real para mudanças na quantidade unitária de matéria-prima
   */
  subscribeToRawMaterialUnitaryQuantityChanges(callback: (newQuantity: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para mudanças na quantidade unitária de matéria-prima...');

    const subscription = this.supabase
      .channel('raw_material_unitary_quantity_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.raw_material_unitary_quantity'
        },
        (payload) => {
          console.log('📡 [DataManager] Mudança detectada na quantidade unitária de matéria-prima:', payload);

          if (payload.new && payload.new.value) {
            const newQuantity = Number(payload.new.value) || 0;

            if (newQuantity >= 0) {
              console.log(`📦 [DataManager] Nova quantidade unitária de matéria-prima: ${newQuantity}`);
              callback(newQuantity);
            }
          }
        }
      )
      .subscribe();

    console.log('✅ [DataManager] Subscription ativa para mudanças na quantidade unitária de matéria-prima');

    // Retornar função de cleanup
    return () => {
      console.log('🔌 [DataManager] Cancelando subscription da quantidade unitária de matéria-prima');
      this.supabase.removeChannel(subscription);
    };
  }

  /**
   * Salva a quantidade total de produtos revenda apenas no Supabase (sem localStorage)
   */
  async saveResaleProductTotalQuantity(quantity: number): Promise<boolean> {
    try {
      console.log(`💾 [DataManager] Salvando quantidade total de produtos revenda: ${quantity}`);

      // Salvar no Supabase usando upsert
      const { error } = await this.supabase
        .from('system_settings')
        .upsert({
          key: 'resale_product_total_quantity',
          value: quantity.toString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) {
        console.error('❌ [DataManager] Erro ao salvar quantidade total de produtos revenda no Supabase:', error);
        return false;
      }

      console.log(`✅ [DataManager] Quantidade total de produtos revenda salva com sucesso: ${quantity}`);
      return true;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao salvar quantidade total de produtos revenda:', error);
      return false;
    }
  }

  /**
   * Carrega a quantidade total de produtos revenda apenas do Supabase (sem localStorage)
   */
  async loadResaleProductTotalQuantity(): Promise<number> {
    try {
      console.log('🔍 [DataManager] Carregando quantidade total de produtos revenda do Supabase...');

      const { data, error } = await this.supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'resale_product_total_quantity')
        .single();

      if (error) {
        console.warn('⚠️ [DataManager] Erro ao carregar quantidade total de produtos revenda do Supabase:', error.message);
        return 0; // Valor padrão
      }

      const quantity = Number(data.value) || 0;
      console.log(`✅ [DataManager] Quantidade total de produtos revenda carregada do Supabase: ${quantity}`);

      return quantity;
    } catch (error) {
      console.error('❌ [DataManager] Erro ao carregar quantidade total de produtos revenda:', error);
      return 0; // Valor padrão em caso de erro
    }
  }

  /**
   * Configura subscription em tempo real para mudanças na quantidade total de produtos revenda
   */
  subscribeToResaleProductTotalQuantityChanges(callback: (newQuantity: number) => void): () => void {
    console.log('🔔 [DataManager] Iniciando subscription para mudanças na quantidade total de produtos revenda...');

    const subscription = this.supabase
      .channel('resale_product_total_quantity_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings',
          filter: 'key=eq.resale_product_total_quantity'
        },
        (payload) => {
          console.log('📡 [DataManager] Mudança detectada na quantidade total de produtos revenda:', payload);

          if (payload.new && payload.new.value) {
            const newQuantity = Number(payload.new.value) || 0;

            if (newQuantity >= 0) {
              console.log(`🛍️ [DataManager] Nova quantidade total de produtos revenda: ${newQuantity}`);
              callback(newQuantity);
            }
          }
        }
      )
      .subscribe();

    console.log('✅ [DataManager] Subscription ativa para mudanças na quantidade total de produtos revenda');

    // Retornar função de cleanup
    return () => {
      console.log('🔌 [DataManager] Cancelando subscription da quantidade total de produtos revenda');
      this.supabase.removeChannel(subscription);
    };
  }
}

// Export singleton instance
export const dataManager = DataManager.getInstance();

// Storage keys constants
export const STORAGE_KEYS = {
  MATERIALS: "tire-factory-materials",
  EMPLOYEES: "tire-factory-employees",
  CUSTOMERS: "tire-factory-customers",
  PRODUCTS: "tire-factory-products",
  SUPPLIERS: "tire-factory-suppliers",
  CUSTOM_UNITS: "tire-factory-custom-units",
  STOCK_ITEMS: "tire-factory-stock-items",
  RECIPES: "tire-factory-recipes",
  PRODUCTION_ENTRIES: "tire-factory-production-entries",
} as const;