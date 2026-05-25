export const THEME_KEY = "heavens-clock-theme";

export const THEMES = [
  {
    id: "void",
    name: "Void",
    tier: "free",
    accent: "#e8d9b8",
    description: "Minimal black, white rings, quiet meditation.",
  },
  {
    id: "classic",
    name: "Classic",
    tier: "premium",
    accent: "#48eaff",
    description: "Vivid orbital rings — cream, cyan, violet, and gold with a red second hand.",
  },
  {
    id: "ember",
    name: "Ember",
    tier: "premium",
    accent: "#ff6b4a",
    description: "Dark ash, warm red second ring, dramatic glow.",
  },
  {
    id: "cosmos",
    name: "Cosmos",
    tier: "premium",
    accent: "#8ae8ff",
    description: "Deep space blues with cold orbital rings.",
  },
  {
    id: "chronograph",
    name: "Chronograph",
    tier: "premium",
    accent: "#d7c28a",
    description: "Luxury watch face inspired by brass and graphite.",
  },
  {
    id: "legacy",
    name: "Legacy",
    tier: "premium",
    accent: "#f3c76f",
    description: "A warm heirloom watch face with gold rings and quiet depth.",
  },
  {
    id: "hologram",
    name: "Hologram",
    tier: "premium",
    accent: "#48eaff",
    description: "A futuristic neon clock skin built from the selected AI concept art.",
  },
];

export function loadTheme() {
  try {
    const id = localStorage.getItem(THEME_KEY);
    return THEMES.some((theme) => theme.id === id) ? id : "void";
  } catch {
    return "void";
  }
}

export function saveTheme(id) {
  const next = THEMES.some((theme) => theme.id === id) ? id : "void";
  try { localStorage.setItem(THEME_KEY, next); } catch (_) {}
  return next;
}

