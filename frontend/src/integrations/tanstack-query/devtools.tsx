import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

/** Ponto único de configuração dos devtools do Query. */
export default function TanStackQueryDevtools() {
  return <ReactQueryDevtools initialIsOpen={false} />;
}
