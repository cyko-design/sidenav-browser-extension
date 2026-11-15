// Feature routes are allowlisted per menu. Content, account and identity routes
// are excluded even when a site accidentally includes them in a feature menu.
var customNavPrivateRoute = /(?:^|[/-])(?:projects?|files?|assets?|chats?|folders?|generations?|history|profiles?|accounts?|uploads?|favorites?|elements?|library|workspaces?|users?|members?|billing|auth|settings?|my)(?:[/-]|$)/i;
var customNavFeatureQuery = new Set(["model", "mode", "tool", "toolModel", "tab", "voiceMode", "audioModel", "imageModel", "generationType", "video-inpaint", "image-inpaint", "modal-photo-dump", "type"]);
var customNavFeatureValue = /^[a-z0-9][a-z0-9_.-]{0,63}$/i;
var customNavOpaqueId = /^(?:\d{5,}|[a-f0-9]{16,}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i;

function featureDestination(site, menu, href) {
  if (typeof href !== "string" || !href.trim()) return null;
  let url;
  try {
    url = new URL(href, site.home);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !site.hosts.includes(url.hostname) || url.port || url.username || url.password || url.hash) return null;
  if (!menu.routes.test(url.pathname) || customNavPrivateRoute.test(url.pathname) || url.pathname.split("/").some(part => customNavOpaqueId.test(part))) return null;

  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (/^utm_/i.test(key)) continue;
    if (!customNavFeatureQuery.has(key) || !customNavFeatureValue.test(value) || customNavOpaqueId.test(value) || params.has(key)) return null;
    params.set(key, value);
  }
  params.sort();
  const result = new URL(url.pathname.replace(/\/$/, "") || "/", site.home);
  result.search = params.toString();
  return result.href;
}

function discoveryKey(site, href) {
  const url = new URL(href);
  if (site.hosts.includes(url.hostname)) url.hostname = new URL(site.home).hostname;
  url.pathname = url.pathname.replace(/\/$/, "") || "/";
  url.searchParams.sort();
  return url.href;
}

function validatedDiscoveries(site, results) {
  if (!Array.isArray(results)) return [];
  const menus = new Map(site.scanMenus.map(menu => [menu.id, menu]));
  return results.slice(0, 400).flatMap(result => {
    const menu = menus.get(result?.menuId);
    if (!menu || typeof result.label !== "string") return [];
    const label = result.label.replace(/\s+/g, " ").trim();
    if (!label || label.length > 100 || /^(?:my|your|new chat|new project)\b/i.test(label)) return [];
    const href = featureDestination(site, menu, result.href);
    return href ? [{ menuId: menu.id, parent: menu.parent, label, href }] : [];
  });
}

function additionsToNavigation(site, items, results) {
  const parents = new Map(items.map(item => [item.label, {
    destinations: new Set([item.href, ...(item.children ?? []).map(child => child.href)].map(href => discoveryKey(site, href))),
    available: 100 - (item.children?.length ?? 0)
  }]));
  return validatedDiscoveries(site, results).filter(entry => {
    const parent = parents.get(entry.parent);
    if (!parent || parent.available <= 0 || parent.destinations.has(entry.href)) return false;
    parent.destinations.add(entry.href);
    parent.available--;
    return true;
  });
}

function mergeDiscoveries(site, items, results) {
  const additions = additionsToNavigation(site, items, results);
  return items.map(item => {
    const children = additions.filter(entry => entry.parent === item.label).map(({ label, href }) => ({ label, href }));
    return children.length ? { ...item, children: [...(item.children ?? []), ...children] } : item;
  });
}

function scanTimeKey(site) {
  return `last-scan:${site.id}`;
}

function navigationLockName(site) {
  return `custom-nav:${site.id}`;
}

async function readSavedLinks(site) {
  const cacheKey = navigationKey(site);
  const record = (await chrome.storage.local.get(cacheKey))[cacheKey];
  if (site.generic) {
    return record?.schema === 3 && record.source === "website"
      ? validatedWebsiteLinks(site, record.discoveries) : [];
  }
  return record?.schema === 3 && record.source === "reviewed"
    ? validatedDiscoveries(site, record.discoveries)
    : [];
}
