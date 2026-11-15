function siteForUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    return;
  }
  if (!["http:", "https:"].includes(url.protocol) || url.port || url.username || url.password
      || !/^[a-z0-9.-]+$/i.test(url.hostname)) return;

  const adapter = customNavSites.find(site => url.protocol === "https:" && site.hosts.includes(url.hostname));
  const origin = url.origin;
  const match = `${origin}/*`;
  if (adapter) return { ...adapter, origin, match };
  const openArt = origin === "https://openart.ai";
  return {
    id: `web:${url.origin}`,
    name: url.hostname,
    home: `${url.origin}/`,
    hosts: [url.hostname],
    origin,
    match,
    generic: true,
    ...(openArt ? {
      scanSidebar: {
        selector: "aside.bg-background-container-panel-base",
        sections: ["Agents", "Tools", "Inspire"]
      },
      tabTheme: {
        attributes: ["class", "data-theme", "data-color-scheme", "data-mode"],
        surfaces: ["--color-background-container-panel-base"],
        accents: ["--color-text-icon-brand-primary"],
        foregrounds: ["--color-text-icon-neutral-primary"]
      }
    } : {})
  };
}

function siteAccessKey(site) {
  return site.generic ? `access:${site.id}` : `access:${site.id}:${site.origin}`;
}

function siteScriptId(site) {
  const scope = site.generic ? site.id : `${site.id}:${site.origin}`;
  return "site-" + btoa(scope).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
