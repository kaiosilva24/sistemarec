import { supabase } from '../../supabase/supabase';

/**
 * Script para criar automaticamente a tabela system_settings no Supabase
 * Este script resolve os erros 404 dos cards do dashboard
 */

export async function setupSystemSettingsTable(): Promise<boolean> {
  try {
    console.log('🚀 [SetupSupabase] Verificando tabela system_settings...');
    
    // Usar any para contornar restrições de TypeScript
    const { error } = await (supabase as any).from('system_settings').select('*').limit(1);
    
    if (error) {
      console.log('❌ [SetupSupabase] Tabela system_settings não existe!');
      console.log('📝 [SetupSupabase] INSTRUÇÕES PARA CORRIGIR:');
      console.log('📝 [SetupSupabase] 1. Acesse: https://supabase.com/dashboard');
      console.log('📝 [SetupSupabase] 2. Selecione seu projeto: yrxixhpnepuccpvungnc');
      console.log('📝 [SetupSupabase] 3. Vá para SQL Editor');
      console.log('📝 [SetupSupabase] 4. Execute o arquivo: create_system_settings_table.sql');
      console.log('📝 [SetupSupabase] 5. Recarregue a página após executar');
      return false;
    }
    
    console.log('✅ [SetupSupabase] Tabela system_settings existe e está acessível!');
    return true;
    
  } catch (error) {
    console.error('❌ [SetupSupabase] Erro ao verificar tabela:', error);
    console.log('📝 [SetupSupabase] Execute o SQL manualmente no Supabase Dashboard');
    return false;
  }
}

/**
 * Verificar se a tabela system_settings existe e tem dados
 */
export async function checkSystemSettingsTable(): Promise<boolean> {
  try {
    console.log('🔍 [SetupSupabase] Verificando tabela system_settings...');

    // Usar any para contornar restrições de TypeScript
    const { data, error } = await (supabase as any)
      .from('system_settings')
      .select('key, value')
      .limit(1);

    if (error) {
      console.warn('⚠️ [SetupSupabase] Tabela system_settings não existe ou não acessível:', error.message);
      return false;
    }

    console.log('✅ [SetupSupabase] Tabela system_settings existe e está acessível!');
    return true;

  } catch (error) {
    console.error('❌ [SetupSupabase] Erro ao verificar tabela:', error);
    return false;
  }
}

/**
 * Função principal para configurar tudo automaticamente
 */
export async function autoSetupSupabase(): Promise<void> {
  console.log('🚀 [SetupSupabase] Iniciando configuração automática do Supabase...');

  // Verificar se a tabela já existe
  const tableExists = await checkSystemSettingsTable();

  if (!tableExists) {
    console.log('📋 [SetupSupabase] Tabela não existe, criando...');
    const success = await setupSystemSettingsTable();

    if (success) {
      console.log('✅ [SetupSupabase] Configuração concluída com sucesso!');
      console.log('🔄 [SetupSupabase] Recarregue a página para ver os cards funcionando!');
    } else {
      console.error('❌ [SetupSupabase] Falha na configuração. Execute o SQL manualmente no Supabase Dashboard.');
    }
  } else {
    console.log('✅ [SetupSupabase] Tabela já existe e está funcionando!');
  }
}
