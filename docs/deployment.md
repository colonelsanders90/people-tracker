# Deployment

**TODO** — user will provide an `.md` file describing the deployment approach. Drop it here (replace this file, or merge the contents).

Until then, this file is a placeholder.

## What we need to know

The deployment decision drives what lives under `Pages/` and `Scripts/`:

- **SharePoint-hosted Add-in** — full app package with `AppManifest.xml`, feature definitions under `Features/`, and list schemas provisioned via XML under `Lists/*/`. Installable per-site.
- **Script Editor Web Part drop-in** — lists are created manually in SharePoint, then JS/HTML/CSS files are uploaded to a document library (e.g., `SiteAssets/manpower-tracker/`) and referenced from a Script Editor Web Part on an existing page. Faster to pilot, harder to govern.
- **Provider-hosted app** — app logic runs on an external server. Out of scope unless explicitly requested.

## Target environment (assumed)

- SharePoint 2013 on-premises.
- IE11-compatible output (no ES6+, no modern bundlers unless we transpile).
- REST API (`/_api/web/lists/...`) as the data access layer.

## Open items to capture in the real doc

- Target site URL and who owns it.
- Who has deploy rights (farm admin? site collection admin?).
- Whether custom master pages / site definitions are permitted.
- Backup / restore process for list data.
- Browser support expectations (IE11 only? Edge Legacy? Chrome?).
