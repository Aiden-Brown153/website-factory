#!/usr/bin/env node
/**
 * batch.js
 * Generate multiple websites in parallel from a CSV or JSON file.
 * Usage: node scripts/batch.js briefs.json
 *        node scripts/batch.js briefs.csv
 */

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

const inputFile = process.argv[2];
if (!inputFile) {
  console.error("Usage: node batch.js <briefs.json|briefs.csv>");
  console.error("\nExample briefs.json:");
  console.error(JSON.stringify([
    { name: "TechFlow", type: "landing", tagline: "Ship software faster", colors: "blue", industry: "tech" },
    { name: "BakersHouse", type: "blog", tagline: "Artisan bread and pastries", colors: "orange", industry: "food" },
    { name: "SaltWater", type: "ecommerce", tagline: "Premium surf gear", colors: "blue", industry: "retail" },
  ], null, 2));
  process.exit(1);
}

function loadBriefs(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  if (filePath.endsWith(".json")) {
    return JSON.parse(content);
  }

  if (filePath.endsWith(".csv")) {
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
    });
  }

  throw new Error("Unsupported file format. Use .json or .csv");
}

function runSite(brief) {
  return new Promise((resolve) => {
    const outDir = `output/${brief.name.toLowerCase().replace(/\s+/g, "-")}`;
    fs.mkdirSync(outDir, { recursive: true });

    const briefPath = path.join(outDir, "brief.json");
    fs.writeFileSync(briefPath, JSON.stringify(brief, null, 2));

    const startTime = Date.now();
    console.log(`🚀 Starting: ${brief.name} (${brief.type})`);

    // Run content generation
    try {
      execSync(`node scripts/generate-content.js ${briefPath}`, {
        env: { ...process.env },
        stdio: "pipe",
      });
    } catch (err) {
      console.error(`❌ Content failed for ${brief.name}: ${err.message}`);
      resolve({ name: brief.name, success: false, error: "content generation failed" });
      return;
    }

    // Run image generation
    try {
      execSync(`node scripts/generate-images.js ${briefPath}`, {
        env: { ...process.env },
        stdio: "pipe",
      });
    } catch (err) {
      console.warn(`⚠️  Images failed for ${brief.name}, continuing...`);
    }

    // Deploy to Vercel
    let url = null;
    try {
      const projectName = brief.name.toLowerCase().replace(/\s+/g, "-");
      const output = execSync(
        `vercel deploy ${outDir} --name ${projectName} --token $VERCEL_TOKEN --yes --prod`,
        { env: { ...process.env }, encoding: "utf-8" }
      );
      url = output.trim().split("\n").pop();
    } catch (err) {
      console.warn(`⚠️  Deploy failed for ${brief.name}: ${err.message}`);
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    resolve({
      name: brief.name,
      type: brief.type,
      url: url || "deploy failed",
      local: outDir,
      elapsed,
      success: !!url,
    });
  });
}

async function main() {
  const briefs = loadBriefs(inputFile);
  console.log(`\n📋 Batch processing ${briefs.length} sites...\n`);

  // Run all sites in parallel
  const results = await Promise.all(briefs.map(runSite));

  // Write results file
  const resultsPath = "output/results.txt";
  const lines = [
    `Website Factory — Batch Results`,
    `Generated: ${new Date().toISOString()}`,
    ``,
    ...results.map((r) =>
      r.success
        ? `✅ ${r.name} (${r.type}) → ${r.url} [${r.elapsed}s]`
        : `❌ ${r.name} → FAILED: ${r.error}`
    ),
    ``,
    `Total: ${results.filter((r) => r.success).length}/${results.length} succeeded`,
  ];

  fs.writeFileSync(resultsPath, lines.join("\n"));

  console.log("\n" + lines.join("\n"));
  console.log(`\nResults saved to ${resultsPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
