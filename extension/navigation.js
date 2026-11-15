var customNavSettings = {
  enabled: false,
  openOnWideScreens: false
};
var customNavDefaultTabPosition = 0.5;

function settingsKey(site, name) {
  return `settings:${site.id}:${name}`;
}

function siteSettings(site, values) {
  const settings = Object.fromEntries(Object.entries(customNavSettings).map(([name, defaultValue]) => {
    const value = values[settingsKey(site, name)];
    return [name, typeof value === "boolean" ? value : defaultValue];
  }));
  const position = values[settingsKey(site, "tabPosition")];
  settings.tabPosition = Number.isFinite(position) && position >= 0 && position <= 1
    ? position
    : customNavDefaultTabPosition;
  if (values[siteAccessKey(site)] !== true) settings.enabled = false;
  return settings;
}

function watchSettings(site, callback, onError) {
  const keys = [...Object.keys(customNavSettings), "tabPosition"].map(name => settingsKey(site, name));
  keys.push(siteAccessKey(site));
  const values = {};
  const changedKeys = new Set();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const relevant = keys.filter(key => Object.hasOwn(changes, key));
    if (!relevant.length) return;

    for (const key of relevant) {
      values[key] = changes[key].newValue;
      changedKeys.add(key);
    }
    callback(siteSettings(site, values));
  });

  chrome.storage.local.get(keys).then(saved => {
    for (const key of keys) {
      if (!changedKeys.has(key)) values[key] = saved[key];
    }
    callback(siteSettings(site, values));
  }).catch(onError);
}

function normalizeItems(site, items, childList = false) {
  if (!Array.isArray(items) || !items.length || items.length > 100) return null;
  const allowedOrigins = new Set([
    ...site.hosts.map(host => `https://${host}`),
    ...site.externalOrigins
  ]);
  const normalized = [];
  const destinations = new Set();
  for (const item of items) {
    if (typeof item?.label !== "string") return null;
    const label = item.label.trim();
    if (!label || label.length > 100) return null;

    if (typeof item.href !== "string" || !item.href.trim()) return null;

    let url;
    try {
      url = new URL(item.href, site.home);
    } catch {
      return null;
    }
    if (!allowedOrigins.has(url.origin) || url.username || url.password) return null;
    const key = childList ? JSON.stringify([label, url.href]) : url.href;
    if (destinations.has(key)) return null;
    destinations.add(key);

    const entry = { label, href: url.href };
    if (!childList && item.children !== undefined) {
      const children = normalizeItems(site, item.children, true);
      if (!children) return null;
      entry.children = children;
    }
    normalized.push(entry);
  }
  return normalized;
}

function navigationKey(site) {
  return `navigation:${site.id}`;
}

async function loadNavigation(site) {
  const key = navigationKey(site);
  const bundled = normalizeItems(site, site.items) ?? [];
  try {
    const record = (await chrome.storage.local.get(key))[key];
    if (site.generic) {
      return record?.schema === 3 && record.source === "website"
        ? websiteNavigation(validatedWebsiteLinks(site, record.discoveries)) : [];
    }
    if (record?.schema === 3 && record.source === "reviewed") {
      return mergeDiscoveries(site, bundled, record.discoveries);
    }
    if (record?.schema === 3 && record.revision === site.revision && record.source === "bundled") {
      const cached = normalizeItems(site, record.items);
      if (cached) return cached;
    }
  } catch {
    // A valid bundled list still works if local storage is temporarily unavailable.
  }
  return bundled;
}
