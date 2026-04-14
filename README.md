# Website Factory 🏭

Generate complete, deployed websites with a single Claude Code command.

## What it does
- Takes a short brief (name, type, tagline)
- Generates full HTML/CSS/JS via Claude API
- Creates hero images via DALL-E 3
- Deploys live to Vercel
- Optionally attaches a custom domain via Cloudflare
- Runs quality checks automatically via hooks

## Setup

### 1. Install Claude Code
```bash
npm install -g @anthropic-ai/claude-code
claude  # authenticate with your Anthropic account
```
Requires Claude Pro or Max plan.

### 2. Install project dependencies
```bash
cd website-factory
npm run setup
```

### 3. Configure your API keys
```bash
cp .env.example .env
# Edit .env and fill in all values
```

You need:
- Anthropic API key → [console.anthropic.com](https://console.anthropic.com)
- OpenAI API key → [platform.openai.com](https://platform.openai.com) (for images)
- Vercel token → [vercel.com/account/tokens](https://vercel.com/account/tokens)
- Cloudflare token → [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) (optional, for custom domains)

### 4. Open Claude Code in this folder
```bash
claude
```

---

## Usage

### Generate a single site
```bash
/generate-site name=TechFlow type=landing tagline="Ship software faster" colors=blue industry=tech
```

### Generate with a custom domain
```bash
/generate-site name=TechFlow type=landing tagline="Ship software faster" domain=techflow.com
```

### Batch generate multiple sites
```bash
# Edit briefs.json with your list of sites, then:
claude -p "run batch mode with briefs.json"

# Or run directly:
node scripts/batch.js briefs.json
```

### Just deploy an existing folder
```bash
/deploy-vercel path=output/techflow name=techflow
```

### Attach a domain to an existing deployment
```bash
/add-domain domain=mybrand.com vercel-project=mybrand
```

---

## Site types

| Type | What's generated |
|------|-----------------|
| `landing` | Single-page conversion site |
| `portfolio` | Personal showcase site |
| `blog` | Blog with starter posts (WordPress) |
| `ecommerce` | Product store (Shopify or static) |
| `business` | Multi-page business site |

## Color options
`blue` `green` `purple` `orange` `red` `neutral`

## Industry options
`tech` `food` `health` `retail` `creative` `services`

---

## Project structure
```
website-factory/
├── CLAUDE.md                     ← Claude's standing instructions
├── .claude/
│   ├── hooks.json                ← Auto quality checks
│   └── skills/
│       ├── generate-site/        ← /generate-site command
│       ├── deploy-vercel/        ← /deploy-vercel command
│       └── add-domain/           ← /add-domain command
├── scripts/
│   ├── generate-content.js       ← Calls Claude API for HTML
│   ├── generate-images.js        ← Calls DALL-E 3 for images
│   └── batch.js                  ← Parallel multi-site mode
├── briefs.json                   ← Example batch input
├── .env.example                  ← API key template
└── output/                       ← All generated sites land here
    ├── techflow/
    │   ├── index.html
    │   ├── brief.json
    │   ├── deploy-url.txt
    │   └── images/
    └── results.txt               ← Batch run summary
```

---

## How the automation works

```
You type one command
       ↓
Claude Code reads CLAUDE.md + skill file
       ↓
Runs generate-content.js → Claude API writes full HTML
       ↓
Runs generate-images.js → DALL-E 3 generates images
       ↓
hooks.json auto-validates the HTML
       ↓
Runs: vercel deploy --prod
       ↓
Returns live URL in < 2 minutes
```

## Tips
- Run `claude -p "/generate-site ..."` for fully headless (no interaction) mode
- Add more skills in `.claude/skills/` for things like SEO audits, A/B variants, etc.
- Use `briefs.json` + batch mode to generate entire client portfolios at once
