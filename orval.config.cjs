/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");

const specsDir = path.resolve(__dirname, "../series-api/docs");
const outputDir = path.resolve(__dirname, "src/lib/api/generated");
const supportedExtensions = new Set([".json", ".yaml", ".yml"]);

const specFiles = fs
  .readdirSync(specsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((name) => supportedExtensions.has(path.extname(name).toLowerCase()));

if (specFiles.length === 0) {
  throw new Error(`No OpenAPI spec files found in ${specsDir}`);
}

module.exports = specFiles.reduce((config, specFile) => {
  const specName = path.parse(specFile).name;
  const key = `${specName}Api`;

  config[key] = {
    input: {
      target: path.join(specsDir, specFile),
    },
    output: {
      mode: "single",
      target: path.join(outputDir, `${specName}.ts`),
      schemas: path.join(outputDir, `${specName}-model`),
      client: "fetch",
      clean: true,
    },
  };

  return config;
}, {});
