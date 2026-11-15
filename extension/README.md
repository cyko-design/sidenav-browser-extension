# Sidebar Nav for Chrome

Sidebar Nav makes website navigation easier with an expandable sidebar. Scan to discover additional feature links.

## Install or update

1. Unzip the download.
2. Open `chrome://extensions`, turn on **Developer mode**, and choose **Load unpacked**. Select the **extension** folder containing `manifest.json`.
3. To update an existing installation, replace files in the same unpacked folder and click **Reload** on the Sidebar Nav card. Keep that folder in place to retain your settings and saved links.

## Use

1. Open the site you want to use, then open **Sidebar Nav**. Choose **Allow Site Access** and approve the Chrome prompt. If Chrome closes the popup, reopen it. Updating from an older release may require granting Higgsfield access once.
2. Turn on **Enhanced Navigation** if needed. Click the left-edge tab to open the sidebar. Drag it vertically or use the up and down arrow keys to move it. Click a section arrow or use Enter or Space to open its links.
3. Click **Scan Navigation** to discover and save additional feature links on the current page. Each completed scan reports the number of new links added and updates **Last Scanned**.
4. **Clear Saved Navigation** asks for confirmation and removes saved scan links and the timestamp. Higgsfield’s bundled links stay available. **Remove Site Access** turns Sidebar Nav off on the current hostname and retains its links and settings. If Chrome has a broader grant, the extension stops running on that hostname and leaves the global Chrome setting intact.

## Scope

Scanning starts only when you click **Scan Navigation**. Granting access, loading a page, changing routes, and restarting Chrome never start a scan. Saved links, preferences, and timestamps remain on this device.

The scanner checks supported navigation menus in the current tab. Generic scans use same-origin feature links and exclude common personal and account routes, opaque IDs, and non-tracking query parameters. Generic menus dynamically created when opened need to be visible to the scan. The Higgsfield adapter keeps its built-in feature links and can use first-party menus in your existing signed-in session. Scanning only inspects menu links and does not open personal projects, files, assets, or chats.

The extension leaves the original menus in place. The drag tab follows the site’s native theme using its colours. On single-page apps the sidebar follows the current route and keeps using the saved list.

## Source layout

- `sites/website.js` maps each origin to its permission scope. `sites/higgsfield.js` supplies the built-in Higgsfield adapter.
- `background.js` registers content scripts per granted origin and handles explicit scan, clear, and disconnect actions.
- `website-scan.js`, `scan-page.js`, and `discovery.js` discover and validate feature links.
- `navigation.js` loads saved navigation. `sidebar.js` and `tab-theme.js` render the sidebar and handle tab appearance and interactions.
