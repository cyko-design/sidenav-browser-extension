const siteList = document.getElementById("sites");
const template = document.getElementById("site-settings");

chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
  const site = siteForUrl(tab?.url);
  if (site && Number.isInteger(tab.id)) renderSite(site, tab.id);
  else siteList.textContent = "Open the website you want to use with Sidebar Nav.";
}).catch(() => { siteList.textContent = "Couldn’t identify the current tab."; });

function renderSite(site, tabId) {
  const section = template.content.firstElementChild.cloneNode(true);
  section.querySelector(".site-name").textContent = site.name;
  section.querySelector(".confirm-site").textContent = site.name;
  section.querySelector(".built-in-note").hidden = site.generic === true;

  const enabled = section.querySelector('[role="switch"]');
  const description = section.querySelector(".setting-description");
  description.id = "enhanced-navigation-description";
  enabled.setAttribute("aria-describedby", description.id);
  const access = section.querySelector(".site-access");
  const scan = section.querySelector(".scan");
  const scanHint = section.querySelector(".scan-hint");
  const clear = section.querySelector(".clear");
  const confirmation = section.querySelector(".confirmation");
  const cancel = section.querySelector(".cancel");
  const confirm = section.querySelector(".confirm");
  const timestamp = section.querySelector(".timestamp");
  const status = section.querySelector(".status");

  const cacheKey = navigationKey(site);
  const timeKey = scanTimeKey(site);
  const accessKey = siteAccessKey(site);
  const enabledKey = settingsKey(site, "enabled");
  const permission = { origins: [site.match] };
  let settings;
  let connected = false;
  let checkingAccess = true;
  let busy = false;
  let hasSavedLinks = false;

  function send(type) {
    return chrome.runtime.sendMessage({ type, origin: site.origin, tabId });
  }

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function renderControls() {
    const blocked = busy || checkingAccess || !confirmation.hidden;
    access.textContent = connected ? "Remove Site Access" : "Allow Site Access";
    access.disabled = blocked;
    enabled.disabled = blocked || !connected || !settings;
    scan.disabled = blocked || !connected;
    clear.disabled = blocked || !hasSavedLinks;
    scanHint.hidden = checkingAccess || connected;
  }

  function renderLastScan(value) {
    const date = value == null ? null : new Date(value);
    timestamp.textContent = date && Number.isFinite(date.getTime()) ? date.toLocaleString() : "Never";
  }

  function renderSavedLinks(record) {
    hasSavedLinks = ["reviewed", "website"].includes(record?.source) && record.discoveries?.length > 0;
    renderControls();
  }

  const changedKeys = new Set();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (Object.hasOwn(changes, timeKey)) {
      changedKeys.add(timeKey);
      renderLastScan(changes[timeKey].newValue);
    }
    if (Object.hasOwn(changes, cacheKey)) {
      changedKeys.add(cacheKey);
      renderSavedLinks(changes[cacheKey].newValue);
    }
    if (changes[accessKey]?.newValue === false) {
      connected = false;
      renderControls();
    }
  });

  chrome.storage.local.get([timeKey, cacheKey]).then(saved => {
    if (!changedKeys.has(timeKey)) renderLastScan(saved[timeKey]);
    if (!changedKeys.has(cacheKey)) renderSavedLinks(saved[cacheKey]);
  }).catch(() => showStatus("Couldn’t load saved navigation."));

  watchSettings(site, value => {
    settings = value;
    enabled.checked = settings.enabled;
    renderControls();
  }, () => showStatus("Couldn’t load settings. Reopen Sidebar Nav to try again."));

  Promise.all([chrome.permissions.contains(permission), chrome.storage.local.get(accessKey)])
    .then(([granted, saved]) => {
      connected = granted && saved[accessKey] !== false;
      if (connected) send("prepare-site").catch(() => {});
    })
    .catch(() => showStatus("Couldn’t check this site’s access."))
    .finally(() => {
      checkingAccess = false;
      renderControls();
    });

  access.addEventListener("click", async () => {
    busy = true;
    renderControls();
    showStatus("");
    try {
      if (connected) {
        const result = await send("disconnect-site");
        if (result?.connected !== false) throw new Error("Couldn’t remove site access.");
        connected = false;
        showStatus(result.broaderAccess
          ? "Sidebar Nav is off here. Chrome’s broader site grant is still active."
          : "Site access removed.");
      } else {
        if (!await chrome.permissions.request(permission)) {
          showStatus("Site access wasn’t granted.");
          return;
        }
        const result = await send("connect-site");
        if (result?.connected !== true) throw new Error("Couldn’t prepare this site.");
        connected = true;
      }
    } catch {
      showStatus("Couldn’t update site access. Reopen Sidebar Nav and try again.");
    } finally {
      busy = false;
      renderControls();
    }
  });

  enabled.addEventListener("change", async () => {
    const turnOn = enabled.checked;
    busy = true;
    renderControls();
    showStatus("");
    try {
      if (turnOn && (await send("prepare-site"))?.connected !== true) throw new Error("Couldn’t prepare this site.");
      await chrome.storage.local.set({ [enabledKey]: turnOn });
    } catch {
      enabled.checked = settings.enabled;
      showStatus("Couldn’t update navigation on this tab.");
    } finally {
      busy = false;
      renderControls();
    }
  });

  scan.addEventListener("click", async () => {
    busy = true;
    renderControls();
    showStatus("Scanning feature navigation…");
    try {
      const result = await send("scan-site");
      if (!Number.isInteger(result?.added)) throw new Error("Scan failed.");
      showStatus(`${result.added} links found and added`);
    } catch {
      showStatus("Couldn’t scan this tab. Check that you’re still on this site and try again.");
    } finally {
      busy = false;
      renderControls();
    }
  });

  function closeConfirmation() {
    confirmation.hidden = true;
    renderControls();
    (clear.disabled ? (scan.disabled ? access : scan) : clear).focus();
  }

  clear.addEventListener("click", () => {
    showStatus("");
    confirmation.hidden = false;
    renderControls();
    cancel.focus();
  });
  cancel.addEventListener("click", closeConfirmation);
  confirm.addEventListener("click", async () => {
    confirm.disabled = true;
    cancel.disabled = true;
    try {
      const result = await send("clear-navigation");
      if (!Number.isInteger(result?.removed)) throw new Error("The clear was not verified.");
      const { removed } = result;
      const summary = removed
        ? `Cleared ${removed} scanned ${removed === 1 ? "link" : "links"}.`
        : "There were no saved scanned links to clear.";
      showStatus(summary + (site.generic ? "" : " Built-in links stay in the sidebar."));
    } catch {
      showStatus("Couldn’t clear saved navigation. Try again.");
    } finally {
      confirm.disabled = false;
      cancel.disabled = false;
      closeConfirmation();
    }
  });

  siteList.append(section);
}
