# Skill: /generate-site

Generate a complete website from a brief and deploy it live.

## Arguments
Pass as key=value pairs after the command:
```
/generate-site name=BrandName type=landing tagline="Your tagline here" colors=blue industry=tech domain=optional.com
```

| Argument   | Required | Values                                      |
|------------|----------|---------------------------------------------|
| name       | yes      | Brand/business name (used for folder + title)|
| type       | yes      | landing / portfolio / blog / ecommerce / business |
| tagline    | yes      | One sentence describing the business        |
| colors     | no       | blue / green / purple / orange / red / neutral |
| industry   | no       | tech / food / health / retail / creative / services |
| domain     | no       | custom domain to attach (e.g. mybrand.com)  |

## Pipeline — run every step in order

### Step 1: Parse and plan
- Extract all arguments from $ARGUMENTS
- Choose the base template from `templates/` matching the type
- Create the output folder: `output/{name-lowercase}/`
- Write a `brief.json` to that folder with all parsed arguments

### Step 2: Generate the site content
Run `node scripts/generate-content.js` with the brief as input.

This script calls Claude API and returns:
- Page sections with headlines and body copy
- SEO meta title and description
- OG tags
- Full HTML with Tailwind CSS
- All copy written for the specific industry and tagline

Write the output to `output/{name}/index.html`.

For multi-page sites (business type), also generate:
- `output/{name}/about.html`
- `output/{name}/contact.html`
- `output/{name}/services.html`

### Step 3: Generate images
Run `node scripts/generate-images.js output/{name}/brief.json`

This script:
- Reads the brief
- Calls DALL-E 3 to generate a hero image (1792x1024)
- Calls DALL-E 3 to generate a secondary feature image (1024x1024)
- Saves them to `output/{name}/images/`
- Updates the HTML to reference the real image paths

If DALL-E fails, fall back to relevant Unsplash URLs using the industry tag.

### Step 4: Validate
Run `npx html-validate output/{name}/index.html`

If validation fails:
- Read the errors
- Fix them directly in the HTML file
- Re-run validation until it passes

### Step 5: Deploy
Run `/deploy-vercel` skill with the output folder path.

### Step 6: Attach domain (if provided)
If a `domain` argument was passed, run `/add-domain` skill.

### Step 7: Print summary
```
✅ Site: {name}
🌐 Live URL: {url}
📁 Local: output/{name}/
🖼  Images: {count} generated
⏱  Time: {seconds}s
```

## Multi-site mode
If $ARGUMENTS contains a JSON array of briefs (from a CSV or batch file), spawn one subagent per brief and run them in parallel. Collect all URLs and write to `output/results.txt`.
