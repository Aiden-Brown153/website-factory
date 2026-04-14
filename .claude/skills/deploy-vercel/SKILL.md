# Skill: /deploy-vercel

Deploy a local folder to Vercel and return a live URL.

## Arguments
```
/deploy-vercel path=output/mybrand name=mybrand
```

| Argument | Required | Description                        |
|----------|----------|------------------------------------|
| path     | yes      | Local folder to deploy             |
| name     | yes      | Project name on Vercel             |

## Steps

### Step 1: Check Vercel CLI
Run `vercel --version` to confirm CLI is installed.
If not found, run `npm install -g vercel` first.

### Step 2: Check auth
Run `vercel whoami`.
If not authenticated, run `vercel login --token $VERCEL_TOKEN`.

### Step 3: Deploy
```bash
vercel deploy {path} \
  --name {name} \
  --token $VERCEL_TOKEN \
  --yes \
  --prod
```

The `--yes` flag skips all interactive prompts.
The `--prod` flag deploys to the production URL (not a preview URL).

### Step 4: Extract URL
Parse the deploy output to find the production URL.
It will look like: `https://{name}.vercel.app`

Store it in `output/{name}/deploy-url.txt`.

### Step 5: Return
Return the URL so the calling skill can use it.

## On failure
- If deploy fails with auth error: re-run with explicit `--token`
- If deploy fails with file error: check the path exists and has an index.html
- If deploy fails for any other reason: run with `--debug` flag and report the full error
