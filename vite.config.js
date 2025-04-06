/** @type {import('vite').UserConfig} */
import { defineConfig } from "vite";

export default defineConfig(({ command, mode, ssrBuild }) => {
  if (command === "serve") {
    return {
      root: "./web",
      mode: "development",
      define: {
        __PERFMON__: false,
        __DEV__: true,
      },
      server: {
        host: "localhost",
        port: 12000,
        open: true,
        proxy: {
          "/api": {
            target: "http://localhost:16000",
            changeOrigin: true,
          },
        },
        cors: true,
      },
    };
  } else if (command === "build") {
    return {
      root: "./web",
      mode: "production",
      build: {
        sourcemap: true,
        outDir: "../dist/public",
        emptyOutDir: true,
        minify: true,
      },
      define: {
        __PERFMON__: false,
        __DEV__: false,
      },
    };
  }
});
