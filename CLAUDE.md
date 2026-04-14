# Website Factory — Claude Code Instructions

You are an automated website generation system. Every session follows these rules exactly.

## Your job
Given a brief, generate a complete, production-ready website, deploy it live, and return a URL. No partial work. No placeholders left in the final output.

## Environment
- Node.js + npm available
- Vercel CLI installed globally (`vercel`)
- `.env` file at project root contains all API keys (see below)
- All generated sites go in `output/{site-name}/`
- Templates are in `templates/`

## Required env vars (.env)
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=           # for DALL-E image generation
VERCEL_TOKEN=             # from vercel.com/account/tokens
CLOUDFLARE_API_TOKEN=     # from dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_ZONE_ID=       # per domain, from Cloudflare dashboard
SHOPIFY_ACCESS_TOKEN=     # if building Shopify sites
SHOPIFY_STORE_DOMAIN=     # yourstore.myshopify.com
WORDPRESS_URL=            # if building WordPress sites
WORDPRESS_USER=
WORDPRESS_PASSWORD=
```

## Site types you support
| type flag       | What to build                      | Deploy target         |
|-----------------|------------------------------------|-----------------------|
| `landing`       | Single-page marketing site         | Vercel (static)       |
| `portfolio`     | Multi-section personal site        | Vercel (static)       |
| `blog`          | WordPress blog with 3 starter posts| WordPress REST API    |
| `ecommerce`     | Shopify store with sample products | Shopify + Vercel      |
| `business`      | Multi-page business site           | Vercel (static)       |

## Skills (custom commands)
- `/generate-site` — full pipeline: generate → images → deploy → return URL
- `/deploy-vercel` — deploy an existing output folder to Vercel
- `/add-domain` — attach a custom domain via Cloudflare

## Quality standards (enforced by hooks)
- All HTML must pass `html-validate`
- All sites must score 90+ on Lighthouse mobile
- No placeholder text (`Lorem ipsum`, `TODO`, `PLACEHOLDER`) in final output
- All images must have alt text
- Meta title, description, and OG tags required on every page

## Code style
- Tailwind CSS via CDN for styling (no build step needed)
- Vanilla JS unless React is explicitly requested
- Mobile-first, responsive by default
- Single `index.html` for static sites (self-contained, no external dependencies except CDN)

## When something fails
- If a deploy fails, retry once with verbose logging
- If image generation fails, use a high-quality Unsplash URL as fallback
- Always report what succeeded and what failed at the end
- Never silently skip a step

## After every site is built
Print a summary:
```
✅ Site: {name}
🌐 Live URL: {url}
📁 Local: output/{name}/
🖼  Images: {count} generated
⏱  Time: {seconds}s
```
