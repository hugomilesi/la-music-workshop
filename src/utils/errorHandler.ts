/**
 * Filtra mensagens de erro técnicas e retorna uma mensagem amigável ao usuário
 */
export function sanitizeErrorMessage(error: any): string {
  if (!error) {
    return 'Erro desconhecido. Tente novamente mais tarde.';
  }

  let message = '';
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'object' && error.message) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    return 'Erro interno do sistema. Tente novamente mais tarde.';
  }

  // Lista de mensagens técnicas que não devem ser exibidas ao usuário
  const technicalErrors = [
    'cannot extract elements from a scalar',
    'violates',
    'constraint',
    'foreign key',
    'syntax error',
    'permission denied',
    'duplicate key',
    'null value',
    'check constraint',
    'unique constraint',
    'not-null constraint',
    'exclusion constraint',
    'invalid input syntax',
    'relation does not exist',
    'column does not exist',
    'function does not exist',
    'operator does not exist',
    'type does not exist',
    'schema does not exist',
    'database does not exist',
    'role does not exist',
    'permission denied for',
    'must be owner of',
    'insufficient privilege',
    'connection refused',
    'timeout',
    'network error',
    'ssl error',
    'authentication failed',
    'invalid authorization',
    'token expired',
    'invalid token',
    'malformed',
    'unexpected token',
    'parse error',
    'serialization failure',
    'deadlock detected',
    'lock timeout',
    'statement timeout',
    'query canceled',
    'out of memory',
    'disk full',
    'too many connections',
    'connection limit exceeded'
  ];

  // Verificar se a mensagem contém algum erro técnico
  const isTechnicalError = technicalErrors.some(techError => 
    message.toLowerCase().includes(techError.toLowerCase())
  );

  if (isTechnicalError) {
    return 'Erro interno do sistema. Tente novamente mais tarde.';
  }

  // Mensagens específicas de validação que devem ser mantidas
  if (message.includes('Idade mínima') || 
      message.includes('Idade máxima') ||
      message.includes('já está inscrito') ||
      message.includes('não encontrado') ||
      message.includes('não permitido') ||
      message.includes('inválido') ||
      message.includes('obrigatório') ||
      message.includes('deve ser') ||
      message.includes('não pode ser')) {
    return message;
  }

  // Se chegou até aqui, é uma mensagem que pode ser exibida
  return message;
}

/**
 * Wrapper para toast de erro que sanitiza a mensagem automaticamente
 */
export function showSafeErrorToast(showToast: any, error: any, defaultTitle?: string) {
  const sanitizedMessage = sanitizeErrorMessage(error);
  showToast({ 
    type: 'error', 
    title: defaultTitle || sanitizedMessage 
  });
}