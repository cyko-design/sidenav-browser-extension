importScripts("sites/higgsfield.js", "sites/website.js", "website-links.js", "navigation.js", "discovery.js");

const pageScripts = [
  "sites/higgsfield.js", "sites/website.js", "website-links.js", "navigation.js",
  "discovery.js", "website-scan.js", "scan-page.js", "tab-theme.js", "sidebar.js"
];
const pageStyles = ["sidebar.css"];

chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (sender.id !== chrome.runtime.id || sender.url !== chrome.runtime.getURL("popup.html")) return;
  const site = siteForUrl(message?.origin);
  if (!site || site.origin !== message.origin) return;

  let work;
  switch (message.type) {
    case "clear-navigation":
      work = () => clearNavigation(site);
      break;
    case "connect-site":
    case "prepare-site":
      if (Number.isInteger(message.tabId)) work = () => prepareSite(site, message.tabId, message.type === "connect-site");
      break;
    case "scan-site":
      if (Number.isInteger(message.tabId)) work = () => scanSite(site, message.tabId);
      break;
    case "disconnect-site":
      work = () => disconnectSite(site);
      break;
  }
  if (!work) return;
  navigator.locks.request(navigationLockName(site), work).then(reply, () => reply({ error: true }));
  return true;
});

async function clearNavigation(site) {
  const keys = [navigationKey(site), scanTimeKey(site)];
  const links = await readSavedLinks(site);
  await chrome.storage.local.remove(keys);
  const remaining = await chrome.storage.local.get(keys);
  if (keys.some(key => Object.hasOwn(remaining, key))) throw new Error("Saved navigation is still present.");
  return { removed: links.length };
}

async function prepareSite(site, tabId, connect = false) {
  const tab = await chrome.tabs.get(tabId);
  const accessKey = siteAccessKey(site);
  if (siteForUrl(tab.url)?.origin !== site.origin
      || !await chrome.permissions.contains({ origins: [site.match] })
      || (!connect && (await chrome.storage.local.get(accessKey))[accessKey] === false)) {
    throw new Error("Site access is unavailable.");
  }
  await registerSite(site);
  if (connect) await enableOnFirstGrant(site);

  const [probe] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => ({
      origin: location.origin,
      ready: globalThis.sidebarNavReceiverReady === true && globalThis.sidebarNavSidebarReady === true
    })
  });
  if (probe?.result?.origin !== site.origin || !probe.documentId) {
    throw new Error("The page changed before Sidebar Nav could load.");
  }
  if (!probe.result.ready) {
    const target = { tabId, documentIds: [probe.documentId] };
    await chrome.scripting.insertCSS({ target, files: pageStyles });
    await chrome.scripting.executeScript({ target, files: pageScripts });
  }
  return { connected: true, documentId: probe.documentId };
}

async function scanSite(site, tabId) {
  const { documentId } = await prepareSite(site, tabId);
  const response = await chrome.tabs.sendMessage(tabId, {
    type: "scan-navigation", site: site.id
  }, { documentId });
  if (response?.error || !Array.isArray(response?.results)) {
    return { error: response?.error || "Couldn’t read navigation on this page." };
  }

  const prior = await readSavedLinks(site);
  let discoveries;
  let added;
  if (site.generic) {
    const newLinks = newWebsiteLinks(site, prior, response.results);
    discoveries = [...prior, ...newLinks];
    added = newLinks.length;
  } else {
    const bundled = normalizeItems(site, site.items);
    const existing = additionsToNavigation(site, bundled, prior);
    discoveries = additionsToNavigation(site, bundled, [...existing, ...response.results]);
    added = discoveries.length - existing.length;
  }
  const updates = { [scanTimeKey(site)]: new Date().toISOString() };
  if (added > 0) {
    updates[navigationKey(site)] = { schema: 3, source: site.generic ? "website" : "reviewed", discoveries };
  }
  await chrome.storage.local.set(updates);
  return { added };
}

async function registerSite(site, update = false) {
  const id = siteScriptId(site);
  const registration = { id, matches: [site.match], js: pageScripts, css: pageStyles, runAt: "document_idle" };
  const existing = await chrome.scripting.getRegisteredContentScripts({ ids: [id] });
  if (!existing.length) await chrome.scripting.registerContentScripts([{ ...registration, persistAcrossSessions: true }]);
  else if (update) await chrome.scripting.updateContentScripts([registration]);
  const key = siteAccessKey(site);
  if ((await chrome.storage.local.get(key))[key] !== true) await chrome.storage.local.set({ [key]: true });
}

async function enableOnFirstGrant(site) {
  const key = settingsKey(site, "enabled");
  if (!Object.hasOwn(await chrome.storage.local.get(key), key)) await chrome.storage.local.set({ [key]: true });
}

async function disconnectSite(site) {
  const permission = { origins: [site.match] };
  const { origins = [] } = await chrome.permissions.getAll();
  if (origins.includes(site.match)) await chrome.permissions.remove(permission);
  // A browser-wide grant can still cover this origin. Stop the extension here
  // without changing Chrome permissions that also cover other sites.
  await removeRegistration(site);
  return { connected: false, broaderAccess: await chrome.permissions.contains(permission) };
}

async function removeRegistration(site) {
  await chrome.storage.local.set({ [siteAccessKey(site)]: false });
  const id = siteScriptId(site);
  if ((await chrome.scripting.getRegisteredContentScripts({ ids: [id] })).length) {
    await chrome.scripting.unregisterContentScripts({ ids: [id] });
  }
}

chrome.permissions.onRemoved.addListener(() => {
  removeRevokedRegistrations().catch(error => console.warn("Sidebar Nav site access:", error));
});

async function removeRevokedRegistrations() {
  for (const script of await chrome.scripting.getRegisteredContentScripts()) {
    const site = siteForUrl(script.matches?.[0]);
    if (!site || siteScriptId(site) !== script.id) continue;
    await navigator.locks.request(navigationLockName(site), async () => {
      if (!await chrome.permissions.contains({ origins: [site.match] })) await removeRegistration(site);
    });
  }
}

// Chrome can dismiss the popup during the permission prompt.
chrome.permissions.onAdded.addListener(({ origins = [] }) => {
  registerGrantedOrigins(origins).catch(error => console.warn("Sidebar Nav site access:", error));
});

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason !== "update") return;
  chrome.permissions.getAll()
    .then(({ origins = [] }) => registerGrantedOrigins(origins, true))
    .catch(error => console.warn("Sidebar Nav site access:", error));
});

async function registerGrantedOrigins(origins, update = false) {
  for (const origin of origins) {
    const site = siteForUrl(origin);
    if (!site || site.match !== origin) continue;
    await navigator.locks.request(navigationLockName(site), async () => {
      if (!await chrome.permissions.contains({ origins: [site.match] })) return;
      const key = siteAccessKey(site);
      if (update && (await chrome.storage.local.get(key))[key] === false) return;
      await registerSite(site, update);
      if (!update) await enableOnFirstGrant(site);
    });
  }
}
