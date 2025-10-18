// ---- Build navigation (element objects, not HTML strings) ----

// 1) Site map (add/remove as needed; include an external link to demo target=_blank)
const pages = [
    { url: "", title: "Home" },
    { url: "projects/", title: "Projects" },
    { url: "contact/", title: "Contact" },
    { url: "profile/", title: "Profile" },
    { url: "https://github.com/alexisjacques", title: "GitHub" }, // external example
];

// 2) Resolve links relative to the file where global.js lives (site root)
const ROOT = new URL(".", import.meta.url);

// 3) Create <nav class="menu"> and prepend to <body>
const nav = document.createElement("nav");
nav.className = "menu";
document.body.prepend(nav);

// Helper: normalize paths so "/x", "/x/", "/x/index.html" match
const norm = (u) => {
    const url = new URL(u, location.origin);
    url.hash = ""; url.search = "";
    let p = url.pathname.replace(/index\.html$/i, "");
    if (!p.endsWith("/")) p += "/";
    return url.host + p;
};
const here = norm(location.href);

// 4) Create each link, set attributes, and append
for (const { url, title } of pages) {
    const a = document.createElement("a");

    // Compute absolute href (works for relative and absolute URLs)
    const abs = new URL(url, ROOT).href;
    a.href = abs;
    a.textContent = title;

    // Highlight current page (exact host + normalized path)
    a.classList.toggle("current", norm(a.href) === here);
    if (a.classList.contains("current")) {
        a.setAttribute("aria-current", "page");
    }

    // External links: open in new tab
    const isExternal = new URL(a.href).host !== location.host;
    if (isExternal) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    }

    nav.append(a);
}

/* ---- Step 4: Theme switch (Automatic / Light / Dark) ---- */

// Build the control
const label = document.createElement('label');
label.className = 'color-scheme';
label.append('Theme: ');

const select = document.createElement('select');
label.append(select);
document.body.prepend(label);

// Option labels reflect current OS preference for the Automatic choice
const media = matchMedia('(prefers-color-scheme: dark)');
const autoLabel = () => `Automatic (${media.matches ? 'Dark' : 'Light'})`;

const OPTIONS = [
    { value: 'light dark', label: autoLabel }, // function for live label
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

// Populate the <select>
for (const opt of OPTIONS) {
    const o = document.createElement('option');
    o.value = opt.value;
    o.textContent = typeof opt.label === 'function' ? opt.label() : opt.label;
    select.append(o);
}

// Initialize from localStorage (or default to Automatic)
const KEY = 'colorScheme';
const ALLOWED = new Set(['light dark', 'light', 'dark']);
const stored = localStorage.getItem(KEY);
const initial = ALLOWED.has(stored) ? stored : 'light dark';

document.documentElement.style.setProperty('color-scheme', initial);
select.value = initial;

// Update when user changes the dropdown
select.addEventListener('input', (e) => {
    const val = e.target.value;
    if (!ALLOWED.has(val)) return;
    document.documentElement.style.setProperty('color-scheme', val);
    localStorage.setItem(KEY, val);
});

// Keep the Automatic label in sync if OS theme flips while viewing
media.addEventListener?.('change', () => {
    const auto = [...select.options].find(o => o.value === 'light dark');
    if (auto) auto.textContent = autoLabel();
});
