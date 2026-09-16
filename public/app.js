import { projects, projectsUnavailable, makeIntroduction } from "./projects.js?v=11";
import { projectMedia, projectExtras } from "./work-view.js";
import { initMoonScene } from "./motion.js";
import { initCursorUniverse } from "./interactions.js?v=9";
import { initEarthScene } from "./earth-motion.js?v=6";
import { initThemePortal } from "./theme-portal.js?v=7";
import { initCloudRain } from "./rain.js?v=9";
const $ = (selector) => document.querySelector(selector);
const preview = $("#hover-preview");
let previewProject = null;
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const paths = {
  "arrow-right": '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V4H4v12h4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  globe:
    '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
  folder: '<path d="M3 7V5a1 1 0 0 1 1-1h5l2 3h9a1 1 0 0 1 1 1v11H3V7Z"/>',
  github:
    '<path d="M9 19c-4.5 1.3-4.5-2.2-6.3-2.7M15 22v-3.4a3 3 0 0 0-.8-2.4c2.8-.3 5.8-1.4 5.8-6.3A4.9 4.9 0 0 0 18.7 6a4.5 4.5 0 0 0-.1-3.4S17.5 2.3 15 4a13.3 13.3 0 0 0-6 0C6.5 2.3 5.4 2.6 5.4 2.6A4.5 4.5 0 0 0 5.3 6 4.9 4.9 0 0 0 4 9.9c0 4.9 3 6 5.8 6.3A3 3 0 0 0 9 18.6V22"/>',
  instagram:
    '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  youtube:
    '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3V9Z"/>',
  linkedin:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7h.01M11 17v-7m0 3a3 3 0 0 1 6 0v4"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 6 10 7L22 6"/>',
  discord:
    '<path d="m8 5-4 1-2 12 5 2 1-2m8-13 4 1 2 12-5 2-1-2M8 6a13 13 0 0 1 8 0M7 16a12 12 0 0 0 10 0"/><ellipse cx="8" cy="12" rx="1" ry="1.5"/><ellipse cx="16" cy="12" rx="1" ry="1.5"/>',
  film: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18m10-18v18M3 8h4m-4 8h4M17 8h4m-4 8h4"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-16-2 20"/>',
  box: '<path d="m12 2 10 5-10 5L2 7l10-5ZM2 7v10l10 5 10-5V7M12 12v10M7 4.5l10 5"/>',
  broadcast:
    '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="m8 2 4 4 4-4M9 22h6M8 10h4m-4 4h8"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4V3Z"/>',
  spark:
    '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  play: '<path d="m7 4 14 8-14 8V4Z"/>',
  wave: '<path d="m8 13-2-5a1.5 1.5 0 0 1 2.8-1l2.2 5-3-7a1.5 1.5 0 1 1 2.8-1.1l2.8 6.4-1.6-6a1.5 1.5 0 1 1 2.9-.7l2 7-.5-4a1.5 1.5 0 0 1 3-.2l1 7c.5 4-2 8-6 8-3 0-5-1.7-6.5-4l-3-3a1.6 1.6 0 0 1 2.2-2.3L10 15M2 6l1-3M20 2l2 2"/>',
};
const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.spark}</svg>`;
function hydrateIcons(root = document) {
  root
    .querySelectorAll("[data-icon]")
    .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
}
hydrateIcons();
let seed = 711;
const random = () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};
for (let i = 0; i < 155; i++) {
  const star = document.createElement("i");
  const opacity = 0.16 + random() * 0.48;
  star.style.cssText = `left:${random() * 100}%;top:${random() * 100}%;width:${i % 13 === 0 ? 2 : 1}px;height:${i % 13 === 0 ? 2 : 1}px;opacity:${opacity};--opacity:${opacity};animation-delay:${-random() * 9}s`;
  if (i % 9 === 0) star.classList.add("twinkle");
  if (i % 37 === 0) star.classList.add("cross");
  $("#sky").append(star);
}
for (let i = 0; i < 8; i++) {
  const layer = document.createElement("div");
  layer.style.backdropFilter = `blur(${0.5 * 2 ** i}px)`;
  layer.style.webkitBackdropFilter = layer.style.backdropFilter;
  layer.style.maskImage =
    i === 7
      ? "linear-gradient(transparent 87.5%,black 100%)"
      : `linear-gradient(transparent ${i * 12.5}%,black ${(i + 1) * 12.5}%,black ${(i + 2) * 12.5}%,transparent ${(i + 3) * 12.5}%)`;
  $("#blur-layers").append(layer);
}
const socialNames = [
  ["GitHub", "github", "https://github.com/bernardopmusiello-droid", "@bernardopmusiello-droid"],
  ["Instagram", "instagram", "https://www.instagram.com/bernie_raidervision/", "@bernie_raidervision"],
  ["LinkedIn", "linkedin", "https://www.linkedin.com/in/bernardo-musiello-425a32361/", "Bernardo Musiello"],
  ["Email", "mail", "mailto:bernardomusiello@gmail.com", "bernardomusiello@gmail.com"],
];
function tile(title, caption, ico, attrs = "", href = null) {
  const tag = href ? "a" : "button";
  const destination = href
    ? `href="${escape(href)}"${href.startsWith("mailto:") ? "" : ' target="_blank" rel="noopener noreferrer"'}`
    : "";
  return `<${tag} class="tile" ${destination} ${attrs}><span class="tile-icon">${icon(ico)}</span><span class="tile-text"><span class="tile-title">${escape(title)}</span><span class="tile-caption">${escape(caption)}</span></span><span class="tile-arrow">${icon("arrow-right")}</span></${tag}>`;
}
$("#social-grid").innerHTML = socialNames
  .map(([name, ico, href, caption]) =>
    tile(
      name,
      caption,
      ico,
      `aria-label="${name === "Email" ? "Email Bernardo Musiello" : `Bernardo Musiello on ${name}`}"`,
      href,
    ),
  )
  .join("");
// Empty collections stay hidden until they contain real work.
$('#playground').hidden = true;
$('#bookmarks').hidden = true;
function projectRow(p) {
  return `<li><button class="project-row" data-project="${p.id}" aria-label="Preview ${escape(p.title)}"><span class="project-name"><span class="project-main-name">${escape(p.type)}</span><span class="project-subtitle">${escape(p.title)}</span></span><span class="project-type">// ${escape(p.type.toLowerCase())}</span><span class="tile-arrow">${icon("arrow-right")}</span></button></li>`;
}
const years = [...new Set(projects.map(p=>p.year))].sort((a,b)=>b-a);
$("#projects").innerHTML=years.map(year=>`<div class="year-group"><button class="year-heading" aria-expanded="true" aria-controls="projects-${year}">${icon("folder")}<span>${year}</span><span class="chevron">${icon("chevron")}</span></button><ul class="year-list" id="projects-${year}">${projects.filter(p=>p.year===year).map(projectRow).join('')}</ul></div>`).join('');
$('#work-note').textContent=projectsUnavailable?'The work could not load. Please refresh to try again.':projects.length?'':'Good things are taking shape. Finished work will appear here soon.';
$('#work-note').hidden=Boolean(projects.length);
$('#work .section-note').textContent=projects.length?'a few things I’ve made':'a few things to come';
document.querySelectorAll(".year-heading").forEach((button) =>
  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    document.getElementById(button.getAttribute("aria-controls")).hidden =
      expanded;
    hidePreview();
  }),
);
// Warm the illustrated previews as Work approaches, so the first hover is ready.
const previewCache = [];
const previewObserver = new IntersectionObserver(
  (entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    for (const project of projects.filter(p=>p.image)) {
      const image = new Image();
      image.decoding = "async";
      image.src = project.image;
      previewCache.push(image);
    }
    previewObserver.disconnect();
  },
  { rootMargin: "180px" },
);
previewObserver.observe(document.getElementById("work"));

function visual(p) {
  return `<div class="project-visual generated-preview"><img src="${escape(p.image)}" alt="${escape(p.imageAlt)}" width="1280" height="720" decoding="async" /></div>`;
}
const projectDialog = $("#project-dialog");
projectDialog.addEventListener("close",()=>{for(const video of projectDialog.querySelectorAll("video"))video.pause();});
function openProject(id) {
  const p = projects.find((p) => p.id === id);
  if (!p) return;
  hidePreview();
  closeAI(false);
  $("#project-kicker").textContent = p.type + " / " + p.year;
  $("#project-art").innerHTML = projectMedia(p);
  $("#project-extras").innerHTML = projectExtras(p);
  $("#project-title").textContent = p.title;
  $("#project-description").textContent = [p.summary,p.description].filter(Boolean).join("\n\n");
  $("#project-role").textContent = p.role || "—";
  $("#project-formats").textContent = p.formats;
  projectDialog.showModal();
}
function openInfo(title, description) {
  closeAI(false);
  $("#info-title").textContent = title;
  $("#info-description").textContent = description;
  $("#info-dialog").showModal();
}
document
  .querySelectorAll("[data-project]")
  .forEach((button) =>
    button.addEventListener("click", () => openProject(button.dataset.project)),
  );
document
  .querySelectorAll("[data-bookmark]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      openInfo(
        button.dataset.bookmark,
        "A space for a favorite link. Bernardo’s real bookmarks will be added here soon.",
      ),
    ),
  );
document
  .querySelectorAll("[data-close]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      document.getElementById(button.dataset.close).close(),
    ),
  );
document.querySelectorAll("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    }
  }),
);
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let manuallyPaused = null;
let transitionBusy = false;
const paused = () =>
  manuallyPaused === null ? reduced.matches : manuallyPaused;
const moon = initMoonScene({
  scene: $("#moon-scene"),
  sprite: $("#astronaut"),
  texture: $("#moon-texture"),
  shadow: $("#foot-shadow"),
  isPaused: () => transitionBusy || paused() || document.documentElement.dataset.theme === "light",
});
const earthScene = initEarthScene({
  scene: $("#earth-scene"), sprite: $("#hiker"), earth: $("#home-earth"), shadow: $("#hiker-shadow"),
  isPaused: () => transitionBusy || paused() || document.documentElement.dataset.theme !== "light",
});
const cursorUniverse = initCursorUniverse({ isPaused: () => transitionBusy || paused() });
const cloudRain = initCloudRain({
  isPaused: paused, isQuiet: () => reduced.matches, isTransitioning: () => transitionBusy,
});
function syncMotion() {
  document.body.classList.toggle("motion-paused", paused());
  document.body.classList.toggle("motion-enabled", !paused());
  document.documentElement.classList.toggle("motion-paused", paused());
  $("#motion-toggle").setAttribute("aria-pressed", String(paused()));
  $("#motion-toggle").setAttribute(
    "aria-label",
    paused() ? "Resume animations" : "Pause animations",
  );
  const motionLabel = document.documentElement.dataset.theme === "light"
    ? (paused() ? "keep wandering" : "pause a little while")
    : `${paused() ? "resume" : "pause"} the universe`;
  $("#motion-toggle").innerHTML =
    icon(paused() ? "play" : "pause") + `<span class="motion-label">${motionLabel}</span>`;
  moon.sync();
  earthScene.sync();
  cursorUniverse.sync();
  cloudRain.sync();
  if (paused()) hidePreview();
}
$("#motion-toggle").addEventListener("click", () => {
  manuallyPaused = !paused();
  syncMotion();
});
reduced.addEventListener("change", () => {
  manuallyPaused = null;
  if (reduced.matches) { moon.reset(); earthScene.reset(); }
  syncMotion();
});
syncMotion();
function hidePreview() {
  if (preview) {
    preview.hidden = true;
    previewProject = null;
  }
}
function showPreview(button, x, y) {
  if (
    !matchMedia("(hover:hover) and (pointer:fine)").matches ||
    paused() ||
    innerWidth < 640
  )
    return;
  const p = projects.find((p) => p.id === button.dataset.project);
  if (!p?.image) return;
  if (previewProject !== p.id) {
    preview.innerHTML =
      visual(p) +
      `<div class="preview-caption">${escape(p.type)} · ${p.year}</div>`;
    previewProject = p.id;
  }
  preview.hidden = false;
  const width = 300,
    height = 205;
  let left = x + 24;
  if (left + width > innerWidth - 16) left = x - width - 24;
  left = Math.max(16, Math.min(innerWidth - width - 16, left));
  const top = Math.max(16, Math.min(innerHeight - height - 16, y - height / 2));
  preview.style.left = `${left}px`;
  preview.style.top = `${top}px`;
}
document.querySelectorAll(".project-row").forEach((button) => {
  button.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "touch") showPreview(button, e.clientX, e.clientY);
  });
  button.addEventListener("pointerleave", hidePreview);
  button.addEventListener("focus", () => {
    const r = button.getBoundingClientRect();
    showPreview(button, r.right - 180, r.top + r.height / 2);
  });
  button.addEventListener("blur", hidePreview);
});
addEventListener("scroll", hidePreview, { passive: true });
let theme = "light";
function setTheme(value) {
  theme = value === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  $("#theme-toggle").innerHTML = icon(theme === "dark" ? "sun" : "moon");
  $("#theme-toggle").setAttribute(
    "aria-label",
    theme === "dark" ? "Switch to light theme, a little closer to home" : "Switch to dark theme, a little farther into space",
  );
  $("#theme-toggle").title = theme === "dark" ? "Daylight on Earth · D" : "A night in space · D";
  $("#welcome-world").textContent = theme === "dark" ? "my little corner of the universe." : "my little corner of the world.";
  document.querySelector('meta[name="theme-color"]').content =
    theme === "dark" ? "#080f20" : "#ecf1e7";
  syncMotion();

}
setTheme(theme);
const runPortal = initThemePortal({
  button: $("#theme-toggle"),
  applyTheme: setTheme,
  isQuiet: () => paused() || reduced.matches,
  onBusy: (busy) => {
    transitionBusy = busy;
    document.documentElement.classList.toggle("theme-changing", busy);
    hidePreview();
    syncMotion();
  },
});
const switchTheme = () => runPortal(theme === "dark" ? "light" : "dark");
$("#theme-toggle").addEventListener("click", switchTheme);
const sections = [
  ["top", "Home"],
  ["socials", "Socials"],
  ["work", "Work"],
  ["about", "About"],
  ["footer", "A little reminder"],
];
$("#section-rail").innerHTML = sections
  .map(
    ([id, label]) =>
      `<a href="#${id}" class="rail-link" aria-label="${label}" data-section="${id}"><span class="rail-line"></span><span class="rail-label">${label}</span></a>`,
  )
  .join("");
const railLinks = [...document.querySelectorAll(".rail-link")];
let scrollQueued = false;
function updateRail() {
  scrollQueued = false;
  let active = 0;
  sections.forEach(([id], i) => {
    if (
      document.getElementById(id).getBoundingClientRect().top <
      innerHeight * 0.4
    )
      active = i;
  });
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 5)
    active = sections.length - 1;
  railLinks.forEach((a, i) => {
    a.setAttribute("aria-current", String(i === active));
    a.style.setProperty(
      "--line-width",
      [56, 44, 36, 28][Math.min(3, Math.abs(i - active))] + "px",
    );
  });
}
addEventListener(
  "scroll",
  () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateRail);
    }
  },
  { passive: true },
);
updateRail();
const pageUrl = new URL(location.href);
pageUrl.hash = "";
pageUrl.search = "";
const prompt = makeIntroduction(pageUrl.href);
$("#ai-prompt").value = prompt;
const providers = [
  ["ChatGPT", "https://chatgpt.com/", "openai"],
  ["Claude", "https://claude.ai/new", "claude"],
  ["Grok", "https://grok.com/", "grok"],
  ["Perplexity", "https://www.perplexity.ai/search", "perplexity"],
];
$("#providers").innerHTML = providers
  .map(([name, base, ico]) => {
    const url = new URL(base);
    url.searchParams.set("q", prompt);
    return `<a class="provider" href="${escape(url.href)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${name} with a portfolio introduction prompt"><span class="provider-icon" style="--provider-icon:url('assets/ai/${ico}.svg')"></span><span class="provider-label">${name}</span></a>`;
  })
  .join("");
function closeAI(returnFocus = true) {
  const wasOpen = !$("#ai-panel").hidden;
  $("#ai-panel").hidden = true;
  $("#ai-trigger").setAttribute("aria-expanded", "false");
  if (returnFocus && wasOpen) $("#ai-trigger").focus();
}
function openAI() {
  hidePreview();
  $("#ai-panel").hidden = false;
  $("#ai-trigger").setAttribute("aria-expanded", "true");
  $("#providers a").focus({ preventScroll: true });
}
$("#ai-trigger").addEventListener("click", () =>
  $("#ai-panel").hidden ? openAI() : closeAI(),
);
$("#ai-close").addEventListener("click", () => closeAI());
document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".ai-widget")) closeAI(false);
});
document.addEventListener("focusin", (event) => {
  if (!event.target.closest(".ai-widget") && !$("#ai-panel").hidden)
    closeAI(false);
});
let copyTimer;
$("#copy-prompt").addEventListener("click", async () => {
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(prompt);
    $("#copy-label").textContent = "Prompt copied";
    $("#copy-status").textContent = "Prompt copied to clipboard.";
    copyTimer = setTimeout(() => {
      $("#copy-label").textContent = "Copy the prompt instead";
    }, 2500);
  } catch {
    $("#prompt-details").open = true;
    $("#ai-prompt").focus();
    $("#ai-prompt").select();
    $("#copy-status").textContent = "Select and copy the prompt below.";
    $("#copy-label").textContent = "Select and copy the prompt below";
  }
});
const searchDialog = $("#search-dialog");
const searchInput = $("#search-input");
let searchIndex = 0,
  searchItems = [];
const commands = [
  ...sections.map(([id, label]) => ({
    label,
    category: "Section",
    keywords: id === "footer" ? "moon quote astronaut footer" : "",
    run: () => {
      location.hash = id;
    },
  })),
  ...projects.map((p) => ({
    label: p.title,
    category: p.type,
    run: () => openProject(p.id),
  })),
  { label: "Ask an AI about me", category: "Explore", run: openAI },
  {
    label: "Switch theme",
    category: "Appearance",
    run: switchTheme,
  },
  {
    label: "Pause / resume animations",
    category: "Motion",
    run: () => {
      manuallyPaused = !paused();
      syncMotion();
    },
  },
];
function renderSearch() {
  const query = searchInput.value.trim().toLowerCase();
  searchItems = commands.filter((c) =>
    (c.label + " " + c.category + " " + (c.keywords || ""))
      .toLowerCase()
      .includes(query),
  );
  searchIndex = 0;
  searchInput.removeAttribute("aria-activedescendant");
  if (searchItems.length)
    searchInput.setAttribute("aria-activedescendant", "search-option-0");
  $("#search-results").innerHTML = searchItems.length
    ? searchItems
        .map(
          (c, i) =>
            `<button id="search-option-${i}" role="option" aria-selected="${i === 0}" class="search-result${i === 0 ? " active" : ""}" data-result="${i}"><span>${escape(c.label)}</span><small>${escape(c.category)}</small></button>`,
        )
        .join("")
    : '<p class="empty-search">Nothing here yet. Try “work”, “video”, or “about”.</p>';
  $("#search-results")
    .querySelectorAll("button")
    .forEach((b) =>
      b.addEventListener("click", () => runSearch(Number(b.dataset.result))),
    );
}
function runSearch(i) {
  const c = searchItems[i];
  if (!c) return;
  searchDialog.close();
  c.run();
}
function openSearch() {
  closeAI(false);
  hidePreview();
  searchInput.value = "";
  renderSearch();
  searchDialog.showModal();
  searchInput.focus();
}
$("#search-trigger").addEventListener("click", openSearch);
searchInput.addEventListener("input", renderSearch);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (!searchItems.length) return;
    searchIndex =
      (searchIndex +
        (event.key === "ArrowDown" ? 1 : -1) +
        searchItems.length) %
      searchItems.length;
    $("#search-results")
      .querySelectorAll("button")
      .forEach((button, i) => {
        button.classList.toggle("active", i === searchIndex);
        button.setAttribute("aria-selected", String(i === searchIndex));
        searchInput.setAttribute(
          "aria-activedescendant",
          "search-option-" + searchIndex,
        );
        if (i === searchIndex) button.scrollIntoView({ block: "nearest" });
      });
  }
  if (event.key === "Enter") {
    event.preventDefault();
    runSearch(searchIndex);
  }
});
document.addEventListener("keydown", (event) => {
  const editing =
    /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) ||
    event.target.isContentEditable;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    if (searchDialog.open) searchDialog.close();
    else if (!document.querySelector("dialog[open]")) openSearch();
  }
  if (event.key === "Escape") closeAI();
  if (
    event.key.toLowerCase() === "d" &&
    !editing &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.altKey &&
    !document.querySelector("dialog[open]")
  )
    switchTheme();
});
$("#year").textContent = new Date().getFullYear();
