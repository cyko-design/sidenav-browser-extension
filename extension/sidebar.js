(() => {
  const site = siteForUrl(location.href);
  if (!site || globalThis.sidebarNavSidebarReady) return;
  globalThis.sidebarNavSidebarReady = true;
  // An earlier extension version can leave behind its mounted sidebar after an update.
  const previousRoot = document.getElementById("custom-nav-sidebar");
  if (previousRoot?.dataset.site === site.id) previousRoot.remove();

  let sidebar;
  let navigation;
  let latestSettings;

  watchSettings(site, applySettings, error => console.warn("Sidebar Nav settings:", error));
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !Object.hasOwn(changes, navigationKey(site))) return;
    navigation = undefined;
    sidebar?.remove();
    sidebar = undefined;
    if (latestSettings?.enabled) applySettings(latestSettings);
  });

  async function applySettings(settings) {
    latestSettings = settings;
    if (!settings.enabled) {
      sidebar?.remove();
      sidebar = undefined;
      return;
    }

    const request = navigation ??= loadNavigation(site);
    const items = await request;
    if (navigation !== request || latestSettings !== settings || (!site.generic && !items.length)) return;
    if (sidebar) {
      sidebar.updateSettings(settings);
      return;
    }
    sidebar = mountSidebar(site, items, settings);
  }

  function mountSidebar(site, items, { openOnWideScreens, tabPosition }) {
    const events = new AbortController();
    const { signal } = events;
    const wide = matchMedia("(min-width: 960px) and (min-height: 520px)");
    const root = document.createElement("div");
    root.id = "custom-nav-sidebar";
    root.dataset.site = site.id;

    const panel = document.createElement("section");
    panel.id = "custom-nav-panel";
    panel.setAttribute("aria-label", `${site.name} sidebar`);

    const toggle = iconButton("Open site navigation");
    toggle.className = "cn-launcher";
    toggle.setAttribute("aria-controls", panel.id);
    toggle.setAttribute("aria-description", "Drag up or down, or use the arrow keys to move this tab.");

    const header = document.createElement("div");
    header.className = "cn-header";
    const brand = document.createElement("a");
    brand.className = "cn-brand";
    brand.href = site.home;
    brand.setAttribute("aria-label", `${site.name} home`);
    if (site.logo) brand.append(icon(site.logo.viewBox, site.logo.path));
    brand.append(site.name);

    const close = iconButton("Close site navigation", site.sidebarIcon ?? "close");
    header.append(brand, close);
    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", `${site.name} sections`);
    const list = document.createElement("ul");
    if (!items.length) {
      const empty = document.createElement("li");
      empty.className = "cn-empty";
      empty.textContent = "Use Scan Navigation in Sidebar Nav to add links.";
      list.append(empty);
    }
    const destinations = [];
    let expandedGroup;
    items.forEach((item, index) => {
      const row = document.createElement("li");
      let control;
      if (item.children) {
        const children = document.createElement("ul");
        children.className = "cn-children";
        children.id = `custom-nav-children-${index}`;
        children.hidden = true;
        if (item.href) {
          const homeRow = document.createElement("li");
          const homeLink = createLink({ label: `${item.label} home`, href: item.href }, site);
          homeLink.classList.add("cn-section-home");
          if (site.homeIcon) homeLink.prepend(icon(site.homeIcon.viewBox, site.homeIcon.path));
          homeRow.append(homeLink);
          children.append(homeRow);
        }
        for (const child of item.children.filter(child => child.href !== item.href)) {
          const childRow = document.createElement("li");
          const link = createLink(child, site);
          childRow.append(link);
          if (site.generic) destinations.push({ control: link, url: new URL(child.href) });
          children.append(childRow);
        }
        const disclosure = iconButton(item.label, "chevron");
        disclosure.className = "cn-disclosure";
        disclosure.prepend(item.label);
        disclosure.setAttribute("aria-controls", children.id);
        disclosure.setAttribute("aria-expanded", "false");
        const group = { button: disclosure, children };
        disclosure.addEventListener("click", () => {
          expandGroup(expandedGroup === group ? undefined : group);
        }, { signal });
        control = disclosure;
        row.append(control, children);
      } else {
        control = createLink(item, site);
        row.append(control);
      }
      list.append(row);
      if (item.href) destinations.push({ control, url: new URL(item.href) });
    });

    nav.append(list);
    panel.append(header, nav);
    root.append(toggle, panel);

    function expandGroup(group) {
      if (group === expandedGroup) return;
      const top = group?.button.getBoundingClientRect().top;
      if (expandedGroup) {
        const { button, children } = expandedGroup;
        if (children.contains(document.activeElement)) button.focus({ preventScroll: true });
        children.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
      expandedGroup = group;
      if (!group) return;
      group.children.hidden = false;
      group.button.setAttribute("aria-expanded", "true");
      nav.scrollTop += group.button.getBoundingClientRect().top - top;
    }

    function updateCurrentLink() {
      if (site.generic && !root.isConnected) document.body?.prepend(root);
      const path = navigationPath(new URL(location.href));
      let current;
      for (const entry of destinations) {
        entry.control.removeAttribute("aria-current");
        if (!site.hosts.includes(entry.url.hostname)) continue;
        const destination = navigationPath(entry.url);
        const matches = destination === path || (destination && path.startsWith(destination + "/"));
        if (matches && (!current || destination.length > navigationPath(current.url).length)) {
          current = entry;
        }
      }
      current?.control.setAttribute("aria-current", navigationPath(current.url) === path ? "page" : "location");
    }

    function navigationPath(url) {
      return stripTrailingSlash(site.generic && url.hash.startsWith("#/") ? url.hash : url.pathname);
    }

    function setOpen(open) {
      if (!open) expandGroup();
      panel.hidden = !open;
      toggle.hidden = open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) updateCurrentLink();
    }

    function sectionTarget() {
      return site.sectionTargets?.[stripTrailingSlash(location.pathname) + location.hash];
    }

    function focusSectionTarget() {
      const selector = sectionTarget();
      if (!selector) return;
      setOpen(false);

      function focusWhenReady(remainingAttempts) {
        if (signal.aborted || sectionTarget() !== selector) return;
        const target = document.querySelector(selector);
        if (target?.getClientRects().length) {
          target.focus();
        } else if (remainingAttempts) {
          setTimeout(() => focusWhenReady(remainingAttempts - 1), 150);
        }
      }
      focusWhenReady(8);
    }

    function dismiss() {
      setOpen(false);
      toggle.focus({ preventScroll: true });
    }

    const updateTabPosition = bindEdgeTab(toggle, site, tabPosition, signal, () => {
      setOpen(true);
      brand.focus({ preventScroll: true });
    });

    close.addEventListener("click", dismiss, { signal });
    root.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) {
        event.preventDefault();
        event.stopPropagation();
        dismiss();
      }
    }, { signal });
    root.addEventListener("focusout", event => {
      if (event.relatedTarget && !root.contains(event.relatedTarget)) setOpen(false);
    }, { signal });
    document.addEventListener("pointerdown", event => {
      if (!panel.hidden && !root.contains(event.target)) setOpen(false);
    }, { capture: true, signal });
    wide.addEventListener("change", () => {
      if (!wide.matches && !panel.hidden) {
        if (panel.contains(document.activeElement)) dismiss();
        else setOpen(false);
      }
    }, { signal });
    window.navigation?.addEventListener("currententrychange", updateCurrentLink, { signal });
    window.addEventListener("popstate", updateCurrentLink, { signal });
    window.addEventListener("hashchange", focusSectionTarget, { signal });
    window.addEventListener("hashchange", updateCurrentLink, { signal });
    nav.addEventListener("click", event => {
      const link = event.target.closest("a");
      if (link?.href === location.href && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        // Selecting the same anchor again does not emit a hashchange.
        focusSectionTarget();
      }
    }, { signal });

    document.body.prepend(root);
    watchTabTheme(toggle, site.tabTheme, signal);
    setOpen(openOnWideScreens && wide.matches && !sectionTarget());
    focusSectionTarget();

    return {
      updateSettings({ openOnWideScreens: value, tabPosition }) {
        updateTabPosition(tabPosition);
        if (value === openOnWideScreens) return;
        openOnWideScreens = value;
        if (!value && !panel.hidden && panel.contains(document.activeElement)) dismiss();
        else setOpen(value && wide.matches);
      },
      remove() {
        events.abort();
        root.remove();
      }
    };
  }

  function bindEdgeTab(tab, site, position, signal, open) {
    let lastSaved = position;
    let gesture;
    let dragged = false;

    function showPosition(value) {
      position = Math.min(1, Math.max(0, value));
      tab.style.setProperty("--cn-tab-position", position);
    }

    function maxTravel() {
      return Math.max(1, window.innerHeight - tab.offsetHeight);
    }

    function savePosition() {
      chrome.storage.local.set({ [settingsKey(site, "tabPosition")]: position })
        .catch(error => console.warn("Sidebar Nav tab position:", error));
    }

    showPosition(position);
    tab.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0) return;
      dragged = false;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, start: position };
      tab.setPointerCapture(gesture.id);
    }, { signal });
    tab.addEventListener("pointermove", event => {
      if (gesture?.id !== event.pointerId) return;
      const dy = event.clientY - gesture.y;
      if (!dragged && Math.hypot(event.clientX - gesture.x, dy) < 5) return;
      dragged = true;
      tab.dataset.dragging = "";
      showPosition(gesture.start + dy / maxTravel());
    }, { signal });
    tab.addEventListener("pointerup", event => {
      if (gesture?.id !== event.pointerId) return;
      gesture = undefined;
      delete tab.dataset.dragging;
      if (dragged) savePosition();
    }, { signal });

    function cancelGesture(event) {
      if (gesture?.id !== event.pointerId) return;
      showPosition(lastSaved);
      gesture = undefined;
      delete tab.dataset.dragging;
    }
    tab.addEventListener("pointercancel", cancelGesture, { signal });
    tab.addEventListener("lostpointercapture", cancelGesture, { signal });
    tab.addEventListener("click", event => {
      if (dragged && event.detail > 0) {
        dragged = false;
        return;
      }
      open();
    }, { signal });
    tab.addEventListener("keydown", event => {
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
      event.preventDefault();
      event.stopPropagation();
      const step = event.key === "ArrowUp" ? -24 : 24;
      showPosition(position + step / maxTravel());
      savePosition();
    }, { signal });

    return value => {
      if (value === lastSaved) return;
      lastSaved = value;
      if (!gesture) showPosition(value);
    };
  }

  function stripTrailingSlash(path) {
    return path.replace(/\/+$/, "");
  }

  function createLink(item, site) {
    const link = document.createElement("a");
    link.className = ["cn-link", site.linkClasses].filter(Boolean).join(" ");
    link.href = item.href;
    link.textContent = item.label;
    return link;
  }

  function iconButton(label, kind) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("aria-label", label);

    const paths = {
      close: "M6 6l12 12 M18 6L6 18",
      chevron: "M9 6l6 6-6 6"
    };
    if (!kind) return button;
    const glyph = typeof kind === "string" ? icon("0 0 24 24", paths[kind]) : icon(kind.viewBox, kind.path);
    const path = glyph.firstElementChild;
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", typeof kind === "string" ? "1.7" : "1.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    button.append(glyph);
    return button;
  }

  function icon(viewBox, pathData) {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", viewBox);
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", "currentColor");
    svg.append(path);
    return svg;
  }
})();
