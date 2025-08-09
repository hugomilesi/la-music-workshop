import { supabase } from '../lib/supabase';

/**
 * Remove todas as inscrições canceladas do sistema
 * Esta função deve ser executada por um administrador
 */
export async function cleanupCancelledEnrollments() {
  try {
    console.log('Iniciando limpeza de inscrições canceladas...');
    
    // 1. Buscar todas as inscrições canceladas
    const { data: cancelledEnrollments, error: fetchError } = await supabase
      .from('inscricoes')
      .select('id')
      .eq('status_inscricao', 'cancelada');
    
    if (fetchError) {
      throw new Error(`Erro ao buscar inscrições canceladas: ${fetchError.message}`);
    }
    
    if (!cancelledEnrollments || cancelledEnrollments.length === 0) {
      console.log('Nenhuma inscrição cancelada encontrada.');
      return { success: true, message: 'Nenhuma inscrição cancelada encontrada.', removed: 0 };
    }
    
    const cancelledIds = cancelledEnrollments.map(enrollment => enrollment.id);
    console.log(`Encontradas ${cancelledIds.length} inscrições canceladas para remover.`);
    
    // 2. Remover convidados das inscrições canceladas
    const { error: guestsError } = await supabase
      .from('convidados')
      .delete()
      .in('inscricao_id', cancelledIds);
    
    if (guestsError) {
      console.warn('Erro ao remover convidados:', guestsError.message);
    } else {
      console.log('Convidados das inscrições canceladas removidos.');
    }
    
    // 3. Remover as inscrições canceladas
    const { error: deleteError } = await supabase
      .from('inscricoes')
      .delete()
      .eq('status_inscricao', 'cancelada');
    
    if (deleteError) {
      throw new Error(`Erro ao remover inscrições canceladas: ${deleteError.message}`);
    }
    
    console.log(`${cancelledIds.length} inscrições canceladas removidas com sucesso.`);
    
    return {
      success: true,
      message: `${cancelledIds.length} inscrições canceladas removidas com sucesso.`,
      removed: cancelledIds.length
    };
    
  } catch (error) {
    console.error('Erro na limpeza de inscrições canceladas:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      removed: 0
    };
  }
}

/**
 * Remove convidados órfãos (sem inscrição válida)
 */
export async function cleanupOrphanGuests() {
  try {
    console.log('Iniciando limpeza de convidados órfãos...');
    
    // Buscar todos os convidados
    const { data: allGuests, error: fetchError } = await supabase
      .from('convidados')
      .select('id, inscricao_id');
    
    if (fetchError) {
      throw new Error(`Erro ao buscar convidados: ${fetchError.message}`);
    }
    
    if (!allGuests || allGuests.length === 0) {
      return { success: true, message: 'Nenhum convidado encontrado.', removed: 0 };
    }
    
    // Buscar todas as inscrições válidas
    const { data: validEnrollments, error: enrollmentsError } = await supabase
      .from('inscricoes')
      .select('id');
    
    if (enrollmentsError) {
      throw new Error(`Erro ao buscar inscrições válidas: ${enrollmentsError.message}`);
    }
    
    const validEnrollmentIds = new Set(validEnrollments?.map(e => e.id) || []);
    
    // Identificar convidados órfãos
    const orphanGuests = allGuests.filter(guest => !validEnrollmentIds.has(guest.inscricao_id));
    
    if (orphanGuests.length === 0) {
      return { success: true, message: 'Nenhum convidado órfão encontrado.', removed: 0 };
    }
    
    // Remover convidados órfãos
    const orphanIds = orphanGuests.map(guest => guest.id);
    const { error: deleteError } = await supabase
      .from('convidados')
      .delete()
      .in('id', orphanIds);
    
    if (deleteError) {
      throw new Error(`Erro ao remover convidados órfãos: ${deleteError.message}`);
    }
    
    console.log(`${orphanIds.length} convidados órfãos removidos com sucesso.`);
    
    return {
      success: true,
      message: `${orphanIds.length} convidados órfãos removidos com sucesso.`,
      removed: orphanIds.length
    };
    
  } catch (error) {
    console.error('Erro na limpeza de convidados órfãos:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      removed: 0
    };
  }
}

/**
 * Executa limpeza completa do sistema
 */
export async function performFullCleanup() {
  console.log('Iniciando limpeza completa do sistema...');
  
  const results = {
    cancelledEnrollments: await cleanupCancelledEnrollments(),
    orphanGuests: await cleanupOrphanGuests()
  };
  
  const totalRemoved = results.cancelledEnrollments.removed + results.orphanGuests.removed;
  
  console.log('Limpeza completa finalizada:', results);
  
  return {
    success: results.cancelledEnrollments.success && results.orphanGuests.success,
    message: `Limpeza completa: ${results.cancelledEnrollments.removed} inscrições canceladas e ${results.orphanGuests.removed} convidados órfãos removidos.`,
    totalRemoved,
    details: results
  };
}