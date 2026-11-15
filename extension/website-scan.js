// Inspect existing navigation markup in the current document. In particular, a
// responsive menu may be hidden but already rendered. No page controls are run.
function scanWebsiteNavigation(site, doc, pageUrl) {
  const excluded = "footer, article, form, dialog, [role='dialog'], #custom-nav-sidebar";
  const privateName = /\b(?:account|assets?|breadcrumbs?|cart|channels?|chats?|conversations?|drafts?|files?|folders?|inbox|language|messages?|notifications?|on this page|pagination|profile|projects?|recent|search|table of contents|user menu|workspaces?)\b/i;
  const inNavigation = element => !element.closest(excluded);
  const label = element => websiteLabel(element.getAttribute("aria-label") || element.innerText || element.textContent);
  const regions = [...doc.querySelectorAll("nav, [role='navigation']")]
    .filter(region => inNavigation(region) && !privateName.test(region.getAttribute("aria-label") || ""))
    .slice(0, 12);

  if (!regions.length) {
    const header = doc.querySelector("header, [role='banner']");
    if (header) regions.push(header);
  }

  const owners = new Map();
  const sidebar = site.scanSidebar && doc.querySelector(site.scanSidebar.selector);
  if (sidebar && inNavigation(sidebar)) {
    const sectionNames = new Map(site.scanSidebar.sections.map(name => [name.toLowerCase(), name]));
    for (const trigger of sidebar.querySelectorAll("button[aria-controls]")) {
      const name = sectionNames.get(label(trigger).toLowerCase());
      if (!name) continue;
      const panel = doc.getElementById(trigger.getAttribute("aria-controls"));
      if (!panel?.matches("[role='region']") || !sidebar.contains(panel) || panel.contains(trigger)) continue;
      regions.push(panel);
      owners.set(panel, { parent: name });
    }
  }
  for (const region of regions) {
    for (const trigger of [...region.querySelectorAll("button[aria-controls], a[aria-controls][aria-expanded], a[href='#'][aria-controls]")].slice(0, 80)) {
      const target = trigger.getAttribute("href");
      const href = websiteDestination(site, target, pageUrl);
      // A placeholder anchor can control a dropdown without a destination of its own.
      if (target !== null && target !== "#" && !href) continue;
      const name = label(trigger);
      const panel = doc.getElementById(trigger.getAttribute("aria-controls"));
      if (!name || privateName.test(name) || !panel || !inNavigation(panel) || panel.contains(region)
          || privateName.test(panel.getAttribute("aria-label") || "")) continue;
      if (!regions.includes(panel) && regions.length < 32) regions.push(panel);
      if (!/^(?:(?:toggle|open|close)\s+)?(?:site\s+|main\s+|mobile\s+)?(?:navigation|menu)(?:\s+(?:menu|sidebar))?$/i.test(name)) {
        owners.set(panel, { parent: name, parentHref: href });
      }
    }
  }

  const anchors = new Set();
  for (const region of regions) {
    for (const anchor of [...region.querySelectorAll("a[href]")].slice(0, 400)) anchors.add(anchor);
  }

  const current = new URL(pageUrl).pathname.replace(/\/$/, "");
  const primary = [];
  const candidates = [];
  for (const anchor of anchors) {
    if (!inNavigation(anchor) || anchor.hasAttribute("download")) continue;
    const namedRegion = anchor.closest("[aria-label]");
    if (namedRegion && privateName.test(namedRegion.getAttribute("aria-label"))) continue;
    const href = websiteDestination(site, anchor.getAttribute("href"), pageUrl);
    if (!href) continue;
    const name = label(anchor);
    if (!name) continue;
    const aside = anchor.closest("aside");
    const own = controllingGroup(anchor, href);
    const entry = { label: name, href, aside, group: own };
    candidates.push(entry);
    if (!aside && !own) {
      const path = new URL(href).pathname.replace(/\/$/, "");
      if (path && (path === current || current.startsWith(path + "/"))) primary.push({ entry, path });
    }
  }

  primary.sort((a, b) => b.path.length - a.path.length);
  const routeParent = primary[0]?.entry;
  const best = new Map();
  for (const entry of candidates) {
    const key = websiteLinkKey(entry.href);
    const group = entry.group ?? (entry.aside && routeParent && routeParent.href !== entry.href
      ? { parent: routeParent.label, parentHref: routeParent.href } : undefined);
    const previous = best.get(key);
    if (!previous || (!previous.parent && group && entry.aside == null)) {
      best.set(key, { label: entry.label, href: entry.href, ...group });
    }
  }
  return { results: validatedWebsiteLinks(site, [...best.values()]), inspected: regions.length };

  function controllingGroup(anchor, href) {
    let passedItem = false;
    for (let node = anchor.parentElement; node && node !== doc.body; node = node.parentElement) {
      if (owners.has(node)) return owners.get(node);
      if (node.matches("details")) {
        const summary = node.querySelector(":scope > summary");
        const name = summary && label(summary);
        if (name && !privateName.test(name)) return { parent: name };
      }
      if (!node.matches("li")) continue;
      if (passedItem) {
        const parentLink = node.querySelector(":scope > a[href], :scope > button[aria-expanded]");
        if (parentLink && parentLink !== anchor) {
          const parentHref = websiteDestination(site, parentLink.getAttribute("href"), pageUrl);
          if (parentLink.hasAttribute("href") && !parentHref) continue;
          const name = label(parentLink);
          if (name && !privateName.test(name) && parentHref !== href) return { parent: name, parentHref };
        }
      }
      passedItem = true;
    }
  }
}
