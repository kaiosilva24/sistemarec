
import { supabase } from '../supabase/supabase';
import {
  RawMaterial,
  Product,
  Employee,
  FixedCost,
  VariableCost,
  StockItem,
  ProductionEntry,
  Customer,
  Supplier,
  CashFlowEntry,
  ProductionRecipe,
  DefectiveTireSale,
  CostSimulation,
  WarrantyEntry,
  ResaleProduct,
  ResaleProductStock,
  AccountsReceivableEntry
} from '../types/financial';

class DataManager {
  // Raw Materials
  async loadRawMaterials(): Promise<RawMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar matérias-primas:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadRawMaterials:', error);
      throw error;
    }
  }

  async saveRawMaterial(material: Omit<RawMaterial, 'id' | 'created_at'>): Promise<RawMaterial | null> {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .insert([material])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar matéria-prima:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveRawMaterial:', error);
      throw error;
    }
  }

  async updateRawMaterial(id: string, updates: Partial<RawMaterial>): Promise<RawMaterial | null> {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar matéria-prima:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateRawMaterial:', error);
      throw error;
    }
  }

  async deleteRawMaterial(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('raw_materials')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar matéria-prima:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteRawMaterial:', error);
      return false;
    }
  }

  // Products
  async loadProducts(): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar produtos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadProducts:', error);
      throw error;
    }
  }

  async saveProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar produto:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveProduct:', error);
      throw error;
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateProduct:', error);
      throw error;
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar produto:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteProduct:', error);
      return false;
    }
  }

  // Employees
  async loadEmployees(): Promise<Employee[]> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar funcionários:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadEmployees:', error);
      throw error;
    }
  }

  async saveEmployee(employee: Omit<Employee, 'id' | 'created_at'>): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([employee])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar funcionário:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveEmployee:', error);
      throw error;
    }
  }

  async updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee | null> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar funcionário:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateEmployee:', error);
      throw error;
    }
  }

  async deleteEmployee(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('employees')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar funcionário:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteEmployee:', error);
      return false;
    }
  }

  // Fixed Costs
  async loadFixedCosts(): Promise<FixedCost[]> {
    try {
      const { data, error } = await supabase
        .from('fixed_costs')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar custos fixos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadFixedCosts:', error);
      throw error;
    }
  }

  async saveFixedCost(cost: Omit<FixedCost, 'id' | 'created_at'>): Promise<FixedCost | null> {
    try {
      const { data, error } = await supabase
        .from('fixed_costs')
        .insert([cost])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar custo fixo:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveFixedCost:', error);
      throw error;
    }
  }

  async updateFixedCost(id: string, updates: Partial<FixedCost>): Promise<FixedCost | null> {
    try {
      const { data, error } = await supabase
        .from('fixed_costs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar custo fixo:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateFixedCost:', error);
      throw error;
    }
  }

  async deleteFixedCost(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('fixed_costs')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar custo fixo:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteFixedCost:', error);
      return false;
    }
  }

  // Variable Costs
  async loadVariableCosts(): Promise<VariableCost[]> {
    try {
      const { data, error } = await supabase
        .from('variable_costs')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar custos variáveis:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadVariableCosts:', error);
      throw error;
    }
  }

  async saveVariableCost(cost: Omit<VariableCost, 'id' | 'created_at'>): Promise<VariableCost | null> {
    try {
      const { data, error } = await supabase
        .from('variable_costs')
        .insert([cost])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar custo variável:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveVariableCost:', error);
      throw error;
    }
  }

  async updateVariableCost(id: string, updates: Partial<VariableCost>): Promise<VariableCost | null> {
    try {
      const { data, error } = await supabase
        .from('variable_costs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar custo variável:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateVariableCost:', error);
      throw error;
    }
  }

  async deleteVariableCost(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('variable_costs')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar custo variável:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteVariableCost:', error);
      return false;
    }
  }

  // Stock Items
  async loadStockItems(): Promise<StockItem[]> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .select('*')
        .eq('archived', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar itens do estoque:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadStockItems:', error);
      throw error;
    }
  }

  async saveStockItem(item: Omit<StockItem, 'id' | 'created_at' | 'updated_at'>): Promise<StockItem | null> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .insert([{ ...item, updated_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar item do estoque:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveStockItem:', error);
      throw error;
    }
  }

  async updateStockItem(id: string, updates: Partial<StockItem>): Promise<StockItem | null> {
    try {
      const { data, error } = await supabase
        .from('stock_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('item_id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar item do estoque:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateStockItem:', error);
      throw error;
    }
  }

  async deleteStockItem(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('stock_items')
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq('item_id', id);

      if (error) {
        console.error('Erro ao arquivar item do estoque:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteStockItem:', error);
      return false;
    }
  }

  // Production Entries
  async loadProductionEntries(): Promise<ProductionEntry[]> {
    try {
      const { data, error } = await supabase
        .from('production_entries')
        .select('*')
        .eq('archived', false)
        .order('production_date', { ascending: false });

      if (error) {
        console.error('Erro ao carregar entradas de produção:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadProductionEntries:', error);
      throw error;
    }
  }

  async saveProductionEntry(entry: Omit<ProductionEntry, 'id' | 'created_at'>): Promise<ProductionEntry | null> {
    try {
      const { data, error } = await supabase
        .from('production_entries')
        .insert([entry])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar entrada de produção:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveProductionEntry:', error);
      throw error;
    }
  }

  async updateProductionEntry(id: string, updates: Partial<ProductionEntry>): Promise<ProductionEntry | null> {
    try {
      const { data, error } = await supabase
        .from('production_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar entrada de produção:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateProductionEntry:', error);
      throw error;
    }
  }

  async deleteProductionEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('production_entries')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar entrada de produção:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteProductionEntry:', error);
      return false;
    }
  }

  // Customers
  async loadCustomers(): Promise<Customer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar clientes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadCustomers:', error);
      throw error;
    }
  }

  async saveCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar cliente:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveCustomer:', error);
      throw error;
    }
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | null> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar cliente:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateCustomer:', error);
      throw error;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar cliente:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteCustomer:', error);
      return false;
    }
  }

  // Suppliers
  async loadSuppliers(): Promise<Supplier[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar fornecedores:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadSuppliers:', error);
      throw error;
    }
  }

  async saveSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplier])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar fornecedor:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveSupplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar fornecedor:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateSupplier:', error);
      throw error;
    }
  }

  async deleteSupplier(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar fornecedor:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteSupplier:', error);
      return false;
    }
  }

  // Cash Flow Entries
  async loadCashFlowEntries(): Promise<CashFlowEntry[]> {
    try {
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .select('*')
        .eq('archived', false)
        .order('transaction_date', { ascending: false });

      if (error) {
        console.error('Erro ao carregar entradas do fluxo de caixa:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadCashFlowEntries:', error);
      throw error;
    }
  }

  async saveCashFlowEntry(entry: Omit<CashFlowEntry, 'id' | 'created_at'>): Promise<CashFlowEntry | null> {
    try {
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .insert([entry])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar entrada do fluxo de caixa:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveCashFlowEntry:', error);
      throw error;
    }
  }

  async updateCashFlowEntry(id: string, updates: Partial<CashFlowEntry>): Promise<CashFlowEntry | null> {
    try {
      const { data, error } = await supabase
        .from('cash_flow_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar entrada do fluxo de caixa:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateCashFlowEntry:', error);
      throw error;
    }
  }

  async deleteCashFlowEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cash_flow_entries')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar entrada do fluxo de caixa:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteCashFlowEntry:', error);
      return false;
    }
  }

  // Production Recipes
  async loadProductionRecipes(): Promise<ProductionRecipe[]> {
    try {
      const { data, error } = await supabase
        .from('production_recipes')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar receitas de produção:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadProductionRecipes:', error);
      throw error;
    }
  }

  async saveProductionRecipe(recipe: Omit<ProductionRecipe, 'id' | 'created_at'>): Promise<ProductionRecipe | null> {
    try {
      const { data, error } = await supabase
        .from('production_recipes')
        .insert([recipe])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar receita de produção:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveProductionRecipe:', error);
      throw error;
    }
  }

  async updateProductionRecipe(id: string, updates: Partial<ProductionRecipe>): Promise<ProductionRecipe | null> {
    try {
      const { data, error } = await supabase
        .from('production_recipes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar receita de produção:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateProductionRecipe:', error);
      throw error;
    }
  }

  async deleteProductionRecipe(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('production_recipes')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar receita de produção:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteProductionRecipe:', error);
      return false;
    }
  }

  // Defective Tire Sales
  async loadDefectiveTireSales(): Promise<DefectiveTireSale[]> {
    try {
      const { data, error } = await supabase
        .from('defective_tire_sales')
        .select('*')
        .eq('archived', false)
        .order('sale_date', { ascending: false });

      if (error) {
        console.error('Erro ao carregar vendas de pneus defeituosos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadDefectiveTireSales:', error);
      throw error;
    }
  }

  async saveDefectiveTireSale(sale: Omit<DefectiveTireSale, 'id' | 'created_at'>): Promise<DefectiveTireSale | null> {
    try {
      const { data, error } = await supabase
        .from('defective_tire_sales')
        .insert([sale])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar venda de pneu defeituoso:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveDefectiveTireSale:', error);
      throw error;
    }
  }

  async updateDefectiveTireSale(id: string, updates: Partial<DefectiveTireSale>): Promise<DefectiveTireSale | null> {
    try {
      const { data, error } = await supabase
        .from('defective_tire_sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar venda de pneu defeituoso:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateDefectiveTireSale:', error);
      throw error;
    }
  }

  async deleteDefectiveTireSale(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('defective_tire_sales')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar venda de pneu defeituoso:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteDefectiveTireSale:', error);
      return false;
    }
  }

  // Cost Simulations
  async loadCostSimulations(): Promise<CostSimulation[]> {
    try {
      const { data, error } = await supabase
        .from('cost_simulations')
        .select('*')
        .eq('archived', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar simulações de custo:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadCostSimulations:', error);
      throw error;
    }
  }

  async saveCostSimulation(simulation: Omit<CostSimulation, 'id' | 'created_at' | 'updated_at'>): Promise<CostSimulation | null> {
    try {
      const { data, error } = await supabase
        .from('cost_simulations')
        .insert([simulation])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar simulação de custo:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveCostSimulation:', error);
      throw error;
    }
  }

  async updateCostSimulation(id: string, updates: Partial<CostSimulation>): Promise<CostSimulation | null> {
    try {
      const { data, error } = await supabase
        .from('cost_simulations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar simulação de custo:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateCostSimulation:', error);
      throw error;
    }
  }

  async deleteCostSimulation(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cost_simulations')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar simulação de custo:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteCostSimulation:', error);
      return false;
    }
  }

  // Warranty Entries
  async loadWarrantyEntries(): Promise<WarrantyEntry[]> {
    try {
      const { data, error } = await supabase
        .from('warranty_entries')
        .select('*')
        .eq('archived', false)
        .order('warranty_date', { ascending: false });

      if (error) {
        console.error('Erro ao carregar entradas de garantia:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadWarrantyEntries:', error);
      throw error;
    }
  }

  async saveWarrantyEntry(entry: Omit<WarrantyEntry, 'id' | 'created_at'>): Promise<WarrantyEntry | null> {
    try {
      const { data, error } = await supabase
        .from('warranty_entries')
        .insert([entry])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar entrada de garantia:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveWarrantyEntry:', error);
      throw error;
    }
  }

  async updateWarrantyEntry(id: string, updates: Partial<WarrantyEntry>): Promise<WarrantyEntry | null> {
    try {
      const { data, error } = await supabase
        .from('warranty_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar entrada de garantia:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateWarrantyEntry:', error);
      throw error;
    }
  }

  async deleteWarrantyEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('warranty_entries')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar entrada de garantia:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteWarrantyEntry:', error);
      return false;
    }
  }

  // Resale Products
  async loadResaleProducts(): Promise<ResaleProduct[]> {
    try {
      const { data, error } = await supabase
        .from('resale_products')
        .select('*')
        .eq('archived', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar produtos de revenda:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadResaleProducts:', error);
      throw error;
    }
  }

  async saveResaleProduct(product: Omit<ResaleProduct, 'id' | 'created_at'>): Promise<ResaleProduct | null> {
    try {
      const { data, error } = await supabase
        .from('resale_products')
        .insert([product])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar produto de revenda:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveResaleProduct:', error);
      throw error;
    }
  }

  async updateResaleProduct(id: string, updates: Partial<ResaleProduct>): Promise<ResaleProduct | null> {
    try {
      const { data, error } = await supabase
        .from('resale_products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar produto de revenda:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateResaleProduct:', error);
      throw error;
    }
  }

  async deleteResaleProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resale_products')
        .update({ archived: true })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar produto de revenda:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteResaleProduct:', error);
      return false;
    }
  }

  // Resale Product Stock
  async loadResaleProductsStock(): Promise<ResaleProductStock[]> {
    try {
      const { data, error } = await supabase
        .from('resale_products_stock')
        .select('*')
        .eq('archived', false)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar estoque de produtos de revenda:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadResaleProductsStock:', error);
      throw error;
    }
  }

  async saveResaleProductStock(stock: Omit<ResaleProductStock, 'id' | 'created_at' | 'updated_at'>): Promise<ResaleProductStock | null> {
    try {
      const { data, error } = await supabase
        .from('resale_products_stock')
        .insert([{ ...stock, updated_at: new Date().toISOString() }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar estoque de produto de revenda:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveResaleProductStock:', error);
      throw error;
    }
  }

  async updateResaleProductStock(id: string, updates: Partial<ResaleProductStock>): Promise<ResaleProductStock | null> {
    try {
      const { data, error } = await supabase
        .from('resale_products_stock')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('product_id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar estoque de produto de revenda:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateResaleProductStock:', error);
      throw error;
    }
  }

  async deleteResaleProductStock(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resale_products_stock')
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq('product_id', id);

      if (error) {
        console.error('Erro ao arquivar estoque de produto de revenda:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteResaleProductStock:', error);
      return false;
    }
  }

  // Accounts Receivable
  async loadAccountsReceivableEntries(): Promise<AccountsReceivableEntry[]> {
    try {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .select('*')
        .eq('archived', false)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Erro ao carregar contas a receber:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Erro na função loadAccountsReceivableEntries:', error);
      throw error;
    }
  }

  async saveAccountsReceivableEntry(entry: Omit<AccountsReceivableEntry, 'id' | 'created_at' | 'updated_at'>): Promise<AccountsReceivableEntry | null> {
    try {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .insert([entry])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar conta a receber:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função saveAccountsReceivableEntry:', error);
      throw error;
    }
  }

  async updateAccountsReceivableEntry(id: string, updates: Partial<AccountsReceivableEntry>): Promise<AccountsReceivableEntry | null> {
    try {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar conta a receber:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro na função updateAccountsReceivableEntry:', error);
      throw error;
    }
  }

  async deleteAccountsReceivableEntry(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({ archived: true, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Erro ao arquivar conta a receber:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro na função deleteAccountsReceivableEntry:', error);
      return false;
    }
  }

  // Método para salvar custo médio por pneu (sincronização com TireCostManager)
  async saveAverageTireCost(averageCost: number): Promise<boolean> {
    try {
      // Upsert no sistema de configurações para manter o custo médio sincronizado
      const { error } = await supabase
        .from('system_settings')
        .upsert({ 
          key: 'average_tire_cost', 
          value: averageCost.toString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Erro ao salvar custo médio por pneu:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro na função saveAverageTireCost:', error);
      return false;
    }
  }

  // Método para carregar custo médio por pneu
  async loadAverageTireCost(): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'average_tire_cost')
        .single();

      if (error) {
        console.error('Erro ao carregar custo médio por pneu:', error);
        return 0;
      }

      return parseFloat(data.value) || 0;
    } catch (error) {
      console.error('Erro na função loadAverageTireCost:', error);
      return 0;
    }
  }
}

// Criar e exportar instância única do DataManager
const dataManagerInstance = new DataManager();

export { dataManagerInstance as dataManager };
export default dataManagerInstance;
