# Skill: /add-domain

Attach a custom domain to a deployed Vercel project using Cloudflare for DNS.

## Arguments
```
/add-domain domain=mybrand.com vercel-project=mybrand
```

| Argument        | Required | Description                          |
|-----------------|----------|--------------------------------------|
| domain          | yes      | The custom domain (e.g. mybrand.com) |
| vercel-project  | yes      | The Vercel project name              |

## Steps

### Step 1: Add domain to Vercel project
```bash
vercel domains add {domain} {vercel-project} --token $VERCEL_TOKEN
```

This registers the domain on the Vercel project and returns the DNS records needed.

### Step 2: Get Vercel DNS target
The output from step 1 includes a CNAME record like:
`cname.vercel-dns.com`

Parse this from the output.

### Step 3: Create DNS record on Cloudflare
```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "CNAME",
    "name": "{domain}",
    "content": "cname.vercel-dns.com",
    "ttl": 1,
    "proxied": true
  }'
```

### Step 4: Wait for propagation
Run `vercel domains inspect {domain} --token $VERCEL_TOKEN` every 10 seconds up to 60 seconds.
Stop when the status shows `VALID`.

### Step 5: Confirm SSL
Vercel auto-provisions SSL. Confirm by fetching `https://{domain}` and checking for a 200 response.

### Step 6: Return
Print:
```
🌐 Domain live: https://{domain}
🔒 SSL: Active
```

## Notes
- The `CLOUDFLARE_ZONE_ID` is per-domain. If the domain is new, it needs to be added to Cloudflare first via their dashboard.
- If you're using a subdomain (e.g. app.mybrand.com), the CNAME name field should be `app` not the full domain.
- Propagation can take up to 48 hours in rare cases but is usually under 5 minutes with Cloudflare proxied.
