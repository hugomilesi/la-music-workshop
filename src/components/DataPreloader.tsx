/**
 * Componente para pré-carregar dados críticos da aplicação
 * Executa em background para melhorar a performance
 */
export default function DataPreloader() {
  // Este componente não renderiza nada visível
  return null;
}

/**
 * Hook para pré-carregar dados de forma condicional
 */
export function useConditionalPreload(condition: boolean, preloadFn: () => Promise<void>) {
  useEffect(() => {
    if (condition) {
      preloadFn().catch(error => {
        console.error('Erro no pré-carregamento condicional:', error);
      });
    }
  }, [condition, preloadFn]);
}

/**
 * Hook para pré-carregar dados com base na navegação
 */
export function useRoutePreload() {
  const { preloadAll } = usePreloadAllWorkshops();

  const preloadForRoute = async (route: string) => {
    switch (route) {
      case '/oficinas':
      case '/home':
        // Pré-carregar workshops para páginas que os utilizam
        await preloadAll();
        break;
      default:
        break;
    }
  };

  return { preloadForRoute };
}