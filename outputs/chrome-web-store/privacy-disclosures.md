# Developer Dashboard privacy fields

## Single purpose

Give users a left-edge navigation sidebar of feature links on websites where they choose to enable it.

## Permission justifications

| Permission | Text for the Dashboard |
| --- | --- |
| `activeTab` | When the user opens Sidebar Nav, it reads the active tab’s address to identify the current site and show that site’s permission controls. This also lets the user choose a site before granting persistent access. |
| `storage` | Store permission state, site settings, tab position, scanned navigation labels and URLs, and the last scan time on this device with Chrome local extension storage. |
| `scripting` | Insert the packaged sidebar and its styling into an approved current tab and register them for future pages on that approved site. |
| Optional HTTPS and HTTP host access | Users choose which websites to enable at runtime. The extension requests only the current scheme and hostname through **Allow Site Access**. Access is used to show the sidebar across page loads and read navigation when the user clicks **Scan Navigation**. No site access is required at install. |

## Remote code and data use

- Remote code answer: **No**. All executable code ships in the ZIP.
- Data types to disclose: **Website content** (navigation link labels and structure) and **Web history** (the current tab address, site identity and scanned navigation URLs used for this feature). Chrome’s Web history category is broader than a browser-history log. Sidebar Nav does not read the browser-history database or keep a timeline of visited pages.
- Processing and storage occur on the device. The extension does not send data to the developer or third parties, sell it, use it for unrelated purposes, or use it for lending or creditworthiness.
- Review and affirm the Dashboard’s Limited Use certifications.
- Host the supplied privacy policy at a public HTTPS address, verify it opens while signed out, then enter that address in the Dashboard. The private source repository cannot serve as the public policy URL.

[Privacy tab](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) · [Google’s local-data disclosure guidance](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq) · [Limited Use policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use)
