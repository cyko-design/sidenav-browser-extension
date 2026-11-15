(() => {
  if (globalThis.sidebarNavReceiverReady) return;
  globalThis.sidebarNavReceiverReady = true;
  let scanning = false;
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (message?.type !== "scan-navigation" || sender.id !== chrome.runtime.id || sender.tab
        || (sender.url && !["popup.html", "background.js"].some(path => sender.url === chrome.runtime.getURL(path)))) return;
    const site = siteForUrl(location.href);
    if (site?.id !== message.site || scanning) {
      reply({ error: "A scan is already running or this tab is unsupported." });
      return;
    }

    scanning = true;
    scanPage(site).then(reply, () => reply({ error: "Couldn’t read the feature navigation. Try scanning again." }))
      .finally(() => { scanning = false; });
    return true;
  });

  async function scanPage(site) {
    const key = siteAccessKey(site);
    if ((await chrome.storage.local.get(key))[key] !== true) return { error: "Allow access to this site first." };
    if (site.generic) {
      return scanWebsiteNavigation(site, document, location.href);
    }
    const path = location.pathname;
    const results = [];
    let inspected = 0;
    const dropdowns = [];
    for (const menu of site.scanMenus) {
      if (menu.trigger) {
        const trigger = document.querySelector(menu.trigger);
        if (trigger) dropdowns.push({ menu, trigger });
      } else if (menu.page.test(path)) {
        const region = document.querySelector(menu.selector);
        if (region) inspect(menu, region);
      }
    }

    // Only open known first-party dropdowns via their normal hover events.
    const original = dropdowns.find(({ trigger }) => trigger.getAttribute("aria-expanded") === "true");
    let lastOpened;
    try {
      for (const entry of dropdowns) {
        if (location.pathname !== path) return { error: "The page changed during the scan. Try again." };
        const { menu, trigger } = entry;
        let region = dropdownRegion(trigger);
        if (!region) {
          if (lastOpened) pointer(lastOpened, "pointerout");
          lastOpened = trigger;
          hover(trigger);
          region = await waitForMenu(trigger);
        }
        if (region) inspect(menu, region);
      }
    } finally {
      if (lastOpened && lastOpened !== original?.trigger) {
        pointer(lastOpened, "pointerout");
        if (original?.trigger.isConnected && !dropdownRegion(original.trigger)) hover(original.trigger);
      }
    }
    if (location.pathname !== path) return { error: "The page changed during the scan. Try again." };
    return { results: validatedDiscoveries(site, results), inspected };

    function inspect(menu, region) {
      inspected++;
      for (const anchor of region.querySelectorAll(menu.links ?? "a[href]")) {
        if (results.length >= 400) return;
        if (anchor.closest("[hidden], [aria-hidden='true'], [download]")) continue;
        const href = featureDestination(site, menu, anchor.getAttribute("href"));
        if (!href) continue;
        const names = [...anchor.querySelectorAll("p")];
        const title = names.find(node => !/^(top|new|soon|beta|pro)$/i.test(node.textContent.trim()));
        const label = title?.textContent ?? anchor.getAttribute("aria-label") ?? anchor.textContent;
        results.push({ menuId: menu.id, label, href });
      }
    }
  }

  function dropdownRegion(trigger) {
    if (trigger.getAttribute("aria-expanded") !== "true") return null;
    const menu = document.getElementById(trigger.getAttribute("aria-controls"));
    return menu?.querySelector("a[href]") ? menu : null;
  }

  function pointer(element, type) {
    element.dispatchEvent(new PointerEvent(type, { bubbles: true, pointerType: "mouse" }));
  }

  function hover(trigger) {
    pointer(trigger, "pointerover");
    pointer(trigger, "pointermove");
  }

  async function waitForMenu(trigger) {
    for (let attempt = 0; attempt < 16 && trigger.isConnected; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const region = dropdownRegion(trigger);
      if (region) return region;
    }
    return null;
  }
})();
