import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Cria o contexto injetado no router, para que loaders de rota possam
 * chamar queryClient.ensureQueryData() antes do componente montar.
 */
export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Evita refetch imediato ao remontar componentes.
        staleTime: 1000 * 60,
        retry: 1,
      },
    },
  });

  return { queryClient };
}

export function Provider({
  children,
  queryClient,
}: {
  children: ReactNode;
  queryClient: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
