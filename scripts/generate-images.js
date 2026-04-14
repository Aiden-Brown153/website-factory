#!/usr/bin/env node
/**
 * generate-images.js
 * Generates hero + feature images using DALL-E 3, with Unsplash fallback.
 * Usage: node scripts/generate-images.js output/sitename/brief.json
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const briefPath = process.argv[2];
if (!briefPath) {
  console.error("Usage: node generate-images.js <path-to-brief.json>");
  process.exit(1);
}

const brief = JSON.parse(fs.readFileSync(briefPath, "utf-8"));
const outDir = path.join(path.dirname(briefPath), "images");
fs.mkdirSync(outDir, { recursive: true });

const INDUSTRY_PROMPTS = {
  tech:      "modern tech office with screens showing dashboards, clean minimal aesthetic, professional",
  food:      "beautiful food photography, restaurant ambience, warm lighting, appetizing",
  health:    "wellness and health lifestyle, bright natural light, energetic and positive",
  retail:    "modern retail store interior, product displays, clean and inviting",
  creative:  "creative studio workspace, design tools, artistic and inspiring",
  services:  "professional business meeting, confident team, modern office environment",
  general:   "professional business setting, modern and clean, inspiring",
};

const industryContext = INDUSTRY_PROMPTS[brief.industry] || INDUSTRY_PROMPTS.general;

const IMAGE_CONFIGS = [
  {
    filename: "hero.jpg",
    size: "1792x1024",
    prompt: `Hero image for a ${brief.type} website called "${brief.name}". ${brief.tagline}. ${industryContext}. Wide cinematic composition, photorealistic, high quality, suitable as a website hero background. No text overlays.`,
  },
  {
    filename: "feature.jpg",
    size: "1024x1024",
    prompt: `Feature image for "${brief.name}". ${industryContext}. Square composition, clean, modern, photorealistic. Bright and professional.`,
  },
];

async function generateImage(config) {
  console.log(`Generating ${config.filename}...`);

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: config.prompt,
        n: 1,
        size: config.size,
        quality: "standard",
        response_format: "url",
      }),
    });

    if (!response.ok) {
      throw new Error(`DALL-E API error: ${response.statusText}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    await downloadImage(imageUrl, path.join(outDir, config.filename));
    console.log(`✅ Generated ${config.filename}`);
    return true;
  } catch (err) {
    console.warn(`⚠️  DALL-E failed for ${config.filename}: ${err.message}`);
    console.log(`   Falling back to Unsplash...`);
    return await fallbackUnsplash(config);
  }
}

async function fallbackUnsplash(config) {
  const query = encodeURIComponent(`${brief.industry || "business"} ${brief.type}`);
  const [w, h] = config.size.split("x");
  const url = `https://source.unsplash.com/${w}x${h}/?${query}`;

  try {
    await downloadImage(url, path.join(outDir, config.filename));
    console.log(`✅ Fallback image saved: ${config.filename}`);
    return true;
  } catch (err) {
    console.error(`❌ Fallback also failed: ${err.message}`);
    return false;
  }
}

function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      // Handle redirects (Unsplash uses them)
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        return downloadImage(response.headers.location, dest)
          .then(resolve)
          .catch(reject);
      }
      response.pipe(file);
      file.on("finish", () => file.close(resolve));
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  let generated = 0;
  for (const config of IMAGE_CONFIGS) {
    const success = await generateImage(config);
    if (success) generated++;
  }
  console.log(`\n🖼  Images complete: ${generated}/${IMAGE_CONFIGS.length}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
