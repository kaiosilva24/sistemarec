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
        const { data: insertedData, error } = await supabase
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
        const { data: updatedData, error } = await supabase
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
      const { data, error } = await supabase
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

  async deleteFromDatabase(tableName: string, id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from(tableName).delete().eq("id", id);

      if (error) throw error;

      console.log(`✅ [DataManager] Registro deletado de ${tableName}:`, id);
      return true;
    } catch (error) {
      console.error(`❌ [DataManager] Erro ao deletar de ${tableName}:`, error);
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
      const { data: stockItem, error: findError } = await supabase
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
        const { error: deleteError } = await supabase
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
      const { error: stockError } = await supabase
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
      const { error: materialError } = await supabase
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
      const { error: stockError } = await supabase
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
      const { error: productError } = await supabase
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

      const { data: insertedData, error } = await supabase
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
      const { data: existingItem, error: checkError } = await supabase
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

      const { data: updatedData, error } = await supabase
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
      const { error } = await supabase
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
      const { data, error } = await supabase
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
      const { error } = await supabase
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
    return this.saveToDatabase("cash_flow_entries", {
      ...entry,
      id: `temp_${Date.now()}`,
    });
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
      const { data: insertedData, error } = await supabase
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
            cleanSaleData,
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
        await supabase
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
      const { data: sales, error } = await supabase
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
      const { data: insertedData, error } = await supabase
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
      const { data: simulations, error } = await supabase
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

      const { data: updatedData, error } = await supabase
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
      const { data: insertedData, error } = await supabase
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
        await supabase
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
      const { data: warranties, error } = await supabase
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
      const { data, error } = await supabase
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
