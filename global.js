// ---- Build navigation (element objects, not HTML strings) ----

// 1) Site map (add/remove as needed; include an external link to demo target=_blank)
const pages = [
    { url: "", title: "Home" },
    { url: "projects/", title: "Projects" },
    { url: "contact/", title: "Contact" },
    { url: "profile/", title: "Profile" },
    { url: "meta/", title: "Meta" },
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




//Setting Up the Function
//Start by defining an asynchronous function that will fetch your project data. Use the following snippet to get started:
// Step 1.2 — fetch a JSON file (e.g., "projects.json") from the site root
export async function fetchJSON(url) {
    try {
        // Resolve relative to global.js (site root)
        const abs = new URL(url, import.meta.url);

        // 1) Fetch
        const response = await fetch(abs);
        console.log(response); // inspect in DevTools

        // 2) Validate
        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.status} ${response.statusText}`);
        }

        // 3) Parse
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
        return null; // so callers can check for failure
    }
}

// In global.js (near the bottom)
if (document.querySelector('.projects')) {
    const data = await fetchJSON('projects.json'); // place projects.json in the site root
    console.log('projects data:', data);
}

// Step 1.4 — render a list of projects into a container
export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    // Validate container
    if (!(containerElement instanceof Element)) {
        console.warn('renderProjects: invalid containerElement', containerElement);
        return;
    }

    // Normalize data to an array
    if (!projects) {
        containerElement.innerHTML = '<p>Could not load projects.</p>';
        return;
    }
    const list = Array.isArray(projects) ? projects : [projects];

    // Validate heading tag
    const tag = String(headingLevel).toLowerCase();
    const validHeadings = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
    const H = validHeadings.has(tag) ? tag : 'h2';

    // Clear old content
    containerElement.innerHTML = '';

    if (list.length === 0) {
        containerElement.innerHTML = '<p>No projects yet.</p>';
        return;
    }

    for (const p of list) {
        const article = document.createElement('article');

        // Heading (optionally linkable if p.link provided)
        const h = document.createElement(H);
        const titleText = p?.title ?? 'Untitled';
        if (p?.link) {
            const a = document.createElement('a');
            a.href = p.link;
            a.textContent = titleText;
            // Open external links in a new tab
            try {
                const isExternal = new URL(a.href, location.href).host !== location.host;
                if (isExternal) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            } catch { }
            h.append(a);
        } else {
            h.textContent = titleText;
        }
        article.append(h);

        // Image (optional)
        if (p?.image) {
            const img = document.createElement('img');
            img.src = p.image;
            img.alt = p?.alt ?? titleText;
            img.loading = 'lazy';
            article.append(img);
        }

        // Description (optional)
        if (p?.description) {
            const para = document.createElement('p');
            para.textContent = p.description;
            article.append(para);
        }

        containerElement.append(article);
    }
}

// Fetch public GitHub user data (unauthenticated; rate limit ~60/hour)
export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}
