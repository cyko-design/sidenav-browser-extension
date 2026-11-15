var customNavExcludedWebsiteRoute = /(?:^|[/_-])(?:account|admin|assets?|auth|billing|cart|channels?|chats?|checkout|conversations?|dashboard|downloads?|drafts?|drive|favorites?|files?|folders?|history|inbox|library|login|logout|members?|messages?|my|notifications?|orders?|password|profiles?|projects?|sessions?|settings|sign-?in|sign-?out|sign-?up|threads?|tokens?|uploads?|users?|workspaces?)(?:[/_-]|$)/i;

function websiteDestination(site, href, base = site.home) {
  if (typeof href !== "string" || !href.trim()) return null;
  try {
    const url = new URL(href, base);
    if (url.origin !== new URL(site.home).origin || url.username || url.password || url.href.endsWith("#")) return null;
    for (const key of [...url.searchParams.keys()]) {
      if (!/^utm_/i.test(key)) return null;
      url.searchParams.delete(key);
    }
    if (!safeWebsitePath(url.pathname) || (url.hash && !(url.hash.startsWith("#/") && safeWebsitePath(url.hash.slice(1))))) return null;
    return url.href;
  } catch {
    return null;
  }
}

function safeWebsitePath(path) {
  const segments = path.split("/").filter(Boolean).map(value => decodeURIComponent(value));
  return segments.length <= 10 && path.length <= 240 && !customNavExcludedWebsiteRoute.test(segments.join("/"))
    && segments.every(segment => /^[\p{L}\p{N}._~-]{1,64}$/u.test(segment)
      && !/^(?:\d{5,}|[a-f0-9]{16,}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/i.test(segment));
}

function websiteLinkKey(href) {
  const url = new URL(href);
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  if (url.hash.startsWith("#/")) url.hash = url.hash.replace(/\/+$/, "") || "#/";
  return url.href;
}

function websiteLabel(value) {
  if (typeof value !== "string") return "";
  const label = value.replace(/\s+/g, " ").trim();
  if (label.length > 100 || /^(?:my |your |user |account|sign in|sign out|log in|log out|skip to|search\b)/i.test(label)) return "";
  return label;
}

function validatedWebsiteLinks(site, entries) {
  if (!Array.isArray(entries)) return [];
  const seen = new Set([websiteLinkKey(site.home)]);
  return entries.slice(0, 400).flatMap(entry => {
    const href = websiteDestination(site, entry?.href);
    const label = websiteLabel(entry?.label);
    if (!href || !label || seen.has(websiteLinkKey(href))) return [];
    seen.add(websiteLinkKey(href));

    const parentHref = websiteDestination(site, entry.parentHref);
    const parent = websiteLabel(entry.parent);
    return [{
      href, label,
      ...(parent && (!parentHref || websiteLinkKey(parentHref) !== websiteLinkKey(href))
        ? { parent, ...(parentHref ? { parentHref } : {}) } : {})
    }];
  });
}

function newWebsiteLinks(site, saved, incoming) {
  const existing = new Set(saved.map(entry => websiteLinkKey(entry.href)));
  return validatedWebsiteLinks(site, incoming)
    .filter(entry => !existing.has(websiteLinkKey(entry.href)))
    .slice(0, Math.max(0, 400 - saved.length));
}

function websiteNavigation(entries) {
  const items = new Map();
  const groupsByLabel = new Map();
  for (const entry of entries) {
    if (entry.parentHref) groupsByLabel.set(entry.parent.toLowerCase(), websiteLinkKey(entry.parentHref));
  }
  for (const {label, href, parent, parentHref} of entries) {
    if (parent) {
      const parentKey = parentHref ? websiteLinkKey(parentHref)
        : groupsByLabel.get(parent.toLowerCase()) ?? `label:${parent.toLowerCase()}`;
      let group = items.get(parentKey);
      if (!group) {
        group = { label: parent, ...(parentHref ? { href: parentHref } : {}), children: [] };
        items.set(parentKey, group);
      }
      group.children ??= [];
      group.children.push({ label, href });
    } else {
      const key = websiteLinkKey(href);
      const group = items.get(key);
      if (!group) items.set(key, { label, href });
      else group.href = href;
    }
  }
  return [...items.values()];
}
