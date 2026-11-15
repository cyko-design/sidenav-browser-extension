var customNavCommonTabTheme = globalThis.customNavCommonTabTheme ?? {
  attributes: ["class", "data-theme", "data-color-scheme", "data-mode"],
  accents: ["--brand-color", "--color-brand", "--accent-color", "--color-accent"],
  surfaces: ["--color-surface", "--color-background", "--background-color", "--background"],
  foregrounds: ["--color-foreground", "--color-text", "--text-color", "--foreground"]
};

function watchTabTheme(tab, theme = customNavCommonTabTheme, signal) {
  const html = document.documentElement;
  const body = document.body;
  const systemTheme = matchMedia("(prefers-color-scheme: dark)");
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const pixel = canvas.getContext("2d", { willReadFrequently: true });
  if (!pixel) return;

  const luminanceCache = new Map();
  let frame = 0;

  function update() {
    frame = 0;
    luminanceCache.clear();
    let pair;
    let border;
    if (theme !== customNavCommonTabTheme) {
      // Read the site's reviewed tokens, independent of injected element colours.
      const bodyStyle = getComputedStyle(body);
      const token = name => bodyStyle.getPropertyValue(name).trim();
      pair = chooseTabColors(theme.surfaces.map(token), theme.accents.map(token), theme.foregrounds.map(token), luminance);
      if (theme.border) border = token(theme.border);
    }
    if (!pair) {
      const authored = authoredPageColors(html, body);
      pair = chooseTabColors(authored.surfaces, authored.accents, authored.foregrounds, luminance);
    }
    if (!pair && !html.hasAttribute("data-darkreader-mode")) {
      // Sites can serve their appearance from a first-party CSS CDN that CSSOM can't read.
      const native = [getComputedStyle(body), getComputedStyle(html)];
      const values = names => native.flatMap(style => names.map(name => style.getPropertyValue(name).trim()));
      pair = chooseTabColors(
        values([...customNavCommonTabTheme.surfaces, "background-color"]),
        values(customNavCommonTabTheme.accents),
        values([...customNavCommonTabTheme.foregrounds, "color"]),
        luminance
      );
    }
    if (!pair) return;

    tab.style.setProperty("--cn-tab-surface", pair.surface);
    tab.style.setProperty("--cn-tab-grip", pair.grip);
    tab.style.setProperty("--cn-tab-border", CSS.supports("color", border || "") ? border : pair.grip);
  }

  // Measure only. Rendering uses the original site colour strings.
  function luminance(value) {
    if (luminanceCache.has(value)) return luminanceCache.get(value);
    let result;
    if (value && CSS.supports("color", value) && !/^(currentcolor|inherit|initial|unset|revert(?:-layer)?)$/i.test(value)) {
      pixel.clearRect(0, 0, 1, 1);
      pixel.fillStyle = "transparent";
      pixel.fillStyle = value;
      pixel.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = pixel.getImageData(0, 0, 1, 1).data;
      if (a === 255) result = 0.2126 * linearChannel(r) + 0.7152 * linearChannel(g) + 0.0722 * linearChannel(b);
    }
    luminanceCache.set(value, result);
    return result;
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  const observer = new MutationObserver(schedule);
  const changes = { attributes: true, attributeFilter: theme.attributes };
  observer.observe(html, changes);
  observer.observe(body, changes);
  systemTheme.addEventListener("change", schedule, { signal });
  document.addEventListener("load", event => {
    if (event.target instanceof HTMLLinkElement && event.target.relList.contains("stylesheet")) schedule();
  }, { capture: true, signal });
  signal.addEventListener("abort", () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
  }, { once: true });
  update();
}

function linearChannel(value) {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function chooseTabColors(surfaces, accents, foregrounds, luminance) {
  for (const grip of [...accents, ...foregrounds, ...surfaces]) {
    const line = luminance(grip);
    if (line === undefined) continue;
    for (const surface of surfaces) {
      const base = luminance(surface);
      if (base === undefined) continue;
      if ((Math.max(base, line) + 0.05) / (Math.min(base, line) + 0.05) >= 3) {
        return { surface, grip };
      }
    }
  }
}

// Generic fallback only uses matching root/body declarations from same-origin links.
// Inline and extension-injected stylesheets can’t supply colours here.
function authoredPageColors(html, body) {
  const accents = [];
  const surfaces = [];
  const foregrounds = [];
  for (const sheet of document.styleSheets) {
    if (!sheet.href || new URL(sheet.href).origin !== location.origin || sheet.disabled) continue;
    if (sheet.media.length && !matchMedia(sheet.media.mediaText).matches) continue;
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // A same-origin stylesheet URL can redirect to another origin.
    }
    for (const rule of rules) visit(rule);
  }
  return { accents, surfaces, foregrounds };

  function visit(rule) {
    if (rule instanceof CSSStyleRule) {
      if (html.matches(rule.selectorText) || body.matches(rule.selectorText)) {
        addColors(accents, rule.style, customNavCommonTabTheme.accents);
        addColors(surfaces, rule.style, [...customNavCommonTabTheme.surfaces, "background-color"]);
        addColors(foregrounds, rule.style, [...customNavCommonTabTheme.foregrounds, "color"]);
      }
      return;
    }
    const applies = (rule instanceof CSSMediaRule && matchMedia(rule.conditionText).matches)
      || (rule instanceof CSSSupportsRule && CSS.supports(rule.conditionText))
      || rule instanceof CSSLayerBlockRule;
    if (applies) for (const child of rule.cssRules) visit(child);
  }

  function addColors(colors, style, properties) {
    for (const property of properties) {
      const value = style.getPropertyValue(property).trim();
      if (value && !colors.includes(value)) colors.unshift(value);
    }
  }
}
