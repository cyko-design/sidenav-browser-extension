# Sidebar Nav 0.5.0 submission checklist

## Policy and package audit

Reviewed November 15, 2026.

| Area | Result |
| --- | --- |
| Single purpose | The popup, manifest, listing and privacy policy describe the same on-site navigation feature. |
| Least privilege | All existing permissions are necessary for current behavior. Keep `activeTab` for the current address on toolbar invocation, `storage` for local settings and cache, and `scripting` for approved-site injection and registration. Optional HTTPS/HTTP patterns let users select any supported site. Each request names the current scheme and host. The clean install starts with no granted hosts. |
| Local data | The code uses `chrome.storage.local` for navigation, settings and scan timestamps. The shipped code has no analytics, telemetry, external service requests, cloud sync or remotely executed code. The privacy drafts describe local access to site addresses and navigation content. |
| Manifest V3 | The upload ZIP contains `manifest.json` at its root, a packaged service worker and local UI files. It uses Chrome’s default MV3 extension-page security policy. It contains no third-party runtime dependencies, test fixtures, keys or debug logging. Error-only diagnostics remain. |
| Graphics | The store icon is a transparent 128 × 128 PNG with the existing mark fitted within 96 × 96 pixels. The 1280 × 800 screenshot shows the production extension on a fictional site. The 440 × 280 promo tile is a separate branding image. |
| Update compatibility | Release 0.5.0 keeps the existing settings and navigation keys and schemas. To retain data, update the same unpacked installation or keep the same store listing for store updates. |

[Program policies](https://developer.chrome.com/docs/webstore/program-policies/policies) · [Manifest V3 requirements](https://developer.chrome.com/docs/webstore/program-policies/mv3-requirements) · [Preparing the ZIP](https://developer.chrome.com/docs/webstore/prepare) · [Image requirements](https://developer.chrome.com/docs/webstore/images)

## Chrome verification

- Chrome 157 accepted the exact extracted production ZIP as a fresh unpacked install. The toolbar identified the active site, Scan Navigation stayed disabled, Last Scanned showed Never, and no sidebar or host grants were present.
- The fixture test provisioned one test-site grant in the disposable profile, scanned six links and updated the same unpacked path from 0.4.2 to the exact 0.5.0 payload. Chrome retained the extension ID, the site grant, scanned links, timestamp, enabled preference and tab position.
- In the production build, a repeat scan returned zero new links. The edge tab opened the sidebar and grouped tool links were usable. Removing access revoked the Chrome host grant and removed the sidebar from the open page. Confirmed clearing removed scanned links and the timestamp while retaining preferences.
- Saved local data was checked after restarting Chrome and reattaching the temporary unpacked test extension. Chrome reported no extension console warnings or JavaScript exceptions during the passing fixture tests.
- Manual smoke test still required for the first native permission prompt and normal restart without test reattachment. A public webpage is enough for these checks. The test fixture did not use a signed-in site.

## Manual handoff

1. Verify that a fresh unpacked install shows Chrome’s native prompt when you click **Allow Site Access**. Deny once and check the sidebar stays off. Grant on a second attempt, scan, then close and restart Chrome. Check that the sidebar and saved links return and **Last Scanned** stays the same.
2. Review and host [the privacy policy](privacy-policy.md) at a publicly accessible HTTPS URL. Check that the URL opens when signed out and that the store listing has a working support contact.
3. In the Chrome Web Store Developer Dashboard, upload `sidebar-nav-0.5.0.zip` as the extension package. Copy in [the listing](listing.md) and [privacy disclosures](privacy-disclosures.md), add the public policy URL, and upload the icon, screenshot and small promo tile from `assets/`.
4. Review the Dashboard preview and submit when ready. If the Dashboard offers deferred publication, use it to keep publication under your control after review.

[Developer Dashboard submission guide](https://developer.chrome.com/docs/webstore/publish)
