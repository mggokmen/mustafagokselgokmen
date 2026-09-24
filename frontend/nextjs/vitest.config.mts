import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // The `@/*` imports come from tsconfig.json; Vite reads them itself.
    tsconfigPaths: true,
    alias: {
      // Server modules guard themselves with `import "server-only"`, which throws unless the
      // importer is a server module. Tests run them as the server does, so the marker resolves to
      // the same empty module React's server build uses.
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: {
    // Everything tested here runs on the server. Component tests will add the jsdom environment
    // and the React plugin when the first component arrives; async Server Components are covered
    // by end-to-end tests instead, as the Next.js testing guide recommends.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
