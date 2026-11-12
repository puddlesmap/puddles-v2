# Privacy and contact requests (manual process)

Parents submit through **`/contact`** (no sign-in). The server emails the monitored inbox (`CONTACT_INBOX_EMAIL`) via Resend and stores a **Contact** row in Admin Submissions when GitHub deploy credentials are available.

**Never** put `puddlesmap@gmail.com` (or any personal inbox) in frontend code, the Privacy Policy, or API responses. Set it only as a Netlify env var.

## Environment (Netlify)

| Variable | Purpose |
| --- | --- |
| `CONTACT_INBOX_EMAIL` | Monitored inbox (server-only) |
| `RESEND_API_KEY` | Same key as Social Studio alerts |
| `CONTACT_FROM_EMAIL` | Optional From line (defaults to `SOCIAL_ALERT_FROM` / alerts@puddlesmap.com) |

Local: with `CONTACT_INBOX_EMAIL` + `RESEND_API_KEY` in `.env.local`, Vite `/api/contact` middleware sends mail. Without them, messages can still save to Admin submissions if `GITHUB_DEPLOY_TOKEN` is set.

## Handling a privacy / data request

1. Open the email or Admin → Submissions (type **Contact**, source `privacy_request`).
2. **Verify identity** — ask the parent to confirm the email on the account / newsletter before access or deletion.
3. Check and act on each store that may hold their data:
   - **Clerk** — account / auth identity
   - **Audience blob** (Saved + parent records) via Admin Audience
   - **Loops** — newsletter / contacts
   - Related **Share** / Expansion Watch submissions if needed
4. Reply from the inbox confirming what was done.
5. Mark the Contact submission Solved / Archived in Admin when finished.

v1 is **manual fulfill**. Do not build automated cross-system deletion until volume requires it.
