#!/usr/bin/env node
/**
 * generate-content.js
 * Calls Claude API to generate a complete HTML website from a brief.
 * Usage: node scripts/generate-content.js output/sitename/brief.json
 */

const fs = require("fs");
const path = require("path");

const briefPath = process.argv[2];
if (!briefPath) {
  console.error("Usage: node generate-content.js <path-to-brief.json>");
  process.exit(1);
}

const brief = JSON.parse(fs.readFileSync(briefPath, "utf-8"));
const outDir = path.dirname(briefPath);

const COLOR_PALETTES = {
  blue:    { primary: "#2563EB", dark: "#1E40AF", light: "#EFF6FF", text: "#1E3A8A" },
  green:   { primary: "#16A34A", dark: "#15803D", light: "#F0FDF4", text: "#14532D" },
  purple:  { primary: "#9333EA", dark: "#7E22CE", light: "#FAF5FF", text: "#581C87" },
  orange:  { primary: "#EA580C", dark: "#C2410C", light: "#FFF7ED", text: "#7C2D12" },
  red:     { primary: "#DC2626", dark: "#B91C1C", light: "#FEF2F2", text: "#7F1D1D" },
  neutral: { primary: "#374151", dark: "#111827", light: "#F9FAFB", text: "#1F2937" },
};

const palette = COLOR_PALETTES[brief.colors] || COLOR_PALETTES.blue;

const SYSTEM_PROMPT = `You are an expert web designer and copywriter.
Generate a complete, production-ready HTML website.
Rules:
- Output ONLY raw HTML. No markdown, no code fences, no explanation.
- Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Mobile-first, fully responsive
- Include <meta> title, description, OG tags
- No placeholder text anywhere — all copy must be real and specific to the business
- Use semantic HTML (header, main, section, footer, nav, article)
- All images use src="images/hero.jpg" or src="images/feature.jpg" (will be replaced)
- All image tags must have descriptive alt attributes
- Include a sticky nav, hero section, features/services section, social proof/testimonials, CTA, and footer
- Primary color: ${palette.primary}
- Dark accent: ${palette.dark}
- Light background: ${palette.light}
- Text: ${palette.text}
- Tailwind config inline to register these custom colors`;

const USER_PROMPT = `Build a complete ${brief.type} website for:

Business name: ${brief.name}
Tagline: ${brief.tagline}
Industry: ${brief.industry || "general business"}
Color scheme: ${brief.colors || "blue"}

Requirements for this site type (${brief.type}):
${getSiteTypeRequirements(brief.type)}

Make it look premium, modern, and conversion-focused.`;

function getSiteTypeRequirements(type) {
  const requirements = {
    landing: `
- Single page, highly focused on one conversion goal
- Big hero with headline, subheadline, and CTA button
- 3-4 feature/benefit blocks with icons
- Social proof section (logos or testimonials)
- Final CTA section
- Minimal navigation (just logo + one CTA button)`,
    portfolio: `
- Personal brand feel
- Hero with name, title, and short bio
- Projects/work section with 3 card placeholders
- Skills or expertise section
- Contact section with email link
- Clean, minimal aesthetic`,
    blog: `
- Magazine-style layout
- Hero with latest featured post
- Grid of 3 recent post cards with placeholder titles and excerpts
- Sidebar with categories and about widget
- Newsletter signup section`,
    ecommerce: `
- Shop-first layout
- Hero banner with sale or featured product
- Product grid (6 product cards with placeholder prices)
- Trust badges (free shipping, returns, secure checkout)
- Featured categories section
- Testimonials`,
    business: `
- Professional services feel
- Hero with headline and two CTAs (primary + secondary)
- Services section (3-4 service cards)
- About/team section
- Process/how it works (3 steps)
- Testimonials
- Contact form (HTML only, no backend needed)
- Full navigation with multiple page links`,
  };
  return requirements[type] || requirements.landing;
}

async function generateSite() {
  console.log(`Generating ${brief.type} site for ${brief.name}...`);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: USER_PROMPT }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("Claude API error:", err);
    process.exit(1);
  }

  const data = await response.json();
  const html = data.content[0].text.trim();

  // For business sites, also generate sub-pages
  if (brief.type === "business") {
    await generateSubPages(brief, outDir, palette);
  }

  const outPath = path.join(outDir, "index.html");
  fs.writeFileSync(outPath, html);
  console.log(`Written to ${outPath}`);
}

async function generateSubPages(brief, outDir, palette) {
  const pages = ["about", "services", "contact"];
  for (const page of pages) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `Generate the ${page}.html page for ${brief.name} (${brief.tagline}). Same design system as the homepage. Link back to index.html in the nav.`,
        }],
      }),
    });
    const data = await response.json();
    const html = data.content[0].text.trim();
    fs.writeFileSync(path.join(outDir, `${page}.html`), html);
    console.log(`Written ${page}.html`);
  }
}

generateSite().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
