import { exec, spawn } from "child_process";
import { argv } from "process";

// 获取进程的第一个参数
const mode = argv[2];

if (mode === "--help") {
  console.log(
    "Usage: node scripts.js [--build-package|--build-web|--build-all|--dev|--gen-types|--help]"
  );
  console.log("  --build-package: build package for nodejs");
  console.log("  --build-web: build web for webgpu");
  console.log("  --build-all: build all");
  console.log("  --dev: run dev server for webgpu");
  console.log("  --gen-types: generate types for package");
  console.log("  --help: show this help message");
  process.exit(0);
}

function buildPackage(options) {
  return new Promise((resolve, reject) => {
    const std = exec(
      "esbuild package/index.ts --outfile=dist/index.js --sourcemap --bundle --platform=node --packages=external --format=esm",
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Fail to build Package: ${error}`);
          reject(error);
        } else {
          console.log("Build Package successfully!");
          resolve(stdout);
        }
      }
    );
    std.stdout.pipe(process.stdout);
    std.stderr.pipe(process.stderr);
  });
}

function genTypes(options) {
  return new Promise((resolve, reject) => {
    let std = exec(
      "tsc --declaration --allowJs --emitDeclarationOnly --outDir types"
    );
    std.stdout.pipe(process.stdout);
    std.stderr.pipe(process.stderr);

    std.on("error", (error) => {
      console.error(`Fail to generate types: ${error}`);
      reject(error);
    });

    std.on("exit", (code) => {
      let std = exec(
        "npx api-extractor run --local --verbose --config api-extractor.json"
      );
      std.stdout.pipe(process.stdout);
      std.stderr.pipe(process.stderr);

      std.on("exit", (code) => {
        resolve(code);
      });

      std.on("error", (error) => {
        console.error(`Fail to generate types: ${error}`);
        reject(error);
      });
    });
  });
}

function buildWeb(options) {
  return new Promise((resolve, reject) => {
    const std = exec(
      "vite build --config ./vite.config.js",
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Fail to build web: ${error}`);
          reject(error);
        } else {
          console.log("Build Web successfully!");
          resolve(stdout);
        }
      }
    );
    std.stdout.pipe(process.stdout);
    std.stderr.pipe(process.stderr);
  });
}

async function dev(options) {
  await buildPackage(options);

  return new Promise((resolve, reject) => {
    const std = exec("vite --config ./vite.config.js");
    std.on("exit", (code) => {
      resolve(code);
    });
    std.stdout.pipe(process.stdout);
    std.stderr.pipe(process.stderr);
  });
}

(async () => {
  if (mode === "--build-package") {
    await buildPackage();
  } else if (mode === "--build-web") {
    await buildWeb();
  } else if (mode === "--build-all") {
    await buildPackage();
    await buildWeb();
  } else if (mode === "--dev") {
    await dev();
  } else if (mode === "--gen-types") {
    await genTypes();
  } else {
    console.log("Invalid argument. Use --help for more information.");
  }
})();
