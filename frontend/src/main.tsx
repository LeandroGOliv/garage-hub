import { StrictMode } from "react";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { createRoot } from "react-dom/client";

import * as TanStackQuery from "@/integrations/tanstack-query/root-provider.tsx";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const context = TanStackQuery.getContext();

const router = createRouter({
  routeTree,
  context,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Elemento #root não encontrado em index.html");
}

createRoot(rootElement).render(
  <StrictMode>
    <TanStackQuery.Provider {...context}>
      <RouterProvider router={router} />
    </TanStackQuery.Provider>
  </StrictMode>,
);
