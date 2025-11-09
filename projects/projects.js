// projects/projects.js
import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

/* ---------------- Module-scope state & helpers ---------------- */

// Selected slice's year label (e.g., "2024"); null means "no selection"
let selectedLabel = null;

// Robust year extraction (used by pie & card filtering)
const YEAR_FIELDS = [
    'year',
    'date', 'date_added', 'date_updated',
    'created', 'created_at', 'createdAt',
    'published', 'published_at',
    'updated', 'updated_at',
    'timestamp',
];

const getByPath = (obj, path) => path.split('.').reduce((o, k) => (o ?? {})[k], obj);

export function extractYear(p) {
    for (const f of YEAR_FIELDS) {
        const v = getByPath(p, f);
        if (v == null || v === '') continue;
        if (typeof v === 'number' && v >= 1900 && v <= 3000) return String(v);
        const s = String(v);
        const m = s.match(/\b(19|20)\d{2}\b/);
        if (m) return m[0];
        const dt = new Date(s);
        if (!Number.isNaN(+dt)) return String(dt.getFullYear());
    }
    const any = JSON.stringify(p).match(/\b(19|20)\d{2}\b/);
    return any ? any[0] : 'Unknown';
}

// Normalize text for case/diacritic-insensitive search
const norm = (s) =>
    String(s ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '');

/* ---------------- Page bootstrap (IIFE) ---------------- */

(async () => {
    try {
        const container = document.querySelector('.projects');
        const titleEl = document.querySelector('.projects-title');
        const searchInput = document.querySelector('.searchBar');
        if (!container) throw new Error('Missing .projects container');

        // Load projects (from /projects/ go up one level to /lib/)
        const allProjects = await fetchJSON('../lib/projects.json');
        if (!Array.isArray(allProjects)) {
            container.innerHTML = '<p>Could not load projects.</p>';
            return;
        }

        // State: search result (before pie selection)
        let currentFiltered = allProjects;

        // Helpers
        const filterProjects = (all, q) => {
            if (!q) return all;
            const qlc = norm(q);
            return all.filter(p => {
                const hay = [
                    p.title,
                    p.description,
                    Array.isArray(p.tags) ? p.tags.join(' ') : '',
                    p.year,
                    p.date,
                ].map(norm).join(' ');
                return hay.includes(qlc);
            });
        };

        const updateTitle = (visible, total) => {
            if (!titleEl) return;
            titleEl.innerHTML = `Projects <span class="count">(${visible} of ${total})</span>`;
        };

        // Render cards using current search result + pie selection
        function renderCardsForSelection() {
            const base = currentFiltered;
            const visible = selectedLabel
                ? base.filter(p => extractYear(p) === selectedLabel)
                : base;

            if (visible.length === 0) {
                container.innerHTML = '<p>No projects match your search.</p>';
            } else {
                renderProjects(visible, container, 'h2');
            }
            updateTitle(visible.length, currentFiltered.length);
        }

        // Initial paint (cards + pie)
        currentFiltered = allProjects;
        renderPieChart(allProjects);    // pie reflects all projects first
        renderCardsForSelection();      // cards reflect search (none) + selection (none)

        // Live search: update currentFiltered, then re-render pie + cards
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value || '';
                currentFiltered = filterProjects(allProjects, query);
                renderPieChart(currentFiltered); // pie reacts to typing
                renderCardsForSelection();       // cards react to typing + selection
            });
        }

        // Listen for pie selection changes (slice/legend clicks dispatch this)
        window.addEventListener('pie-select', (e) => {
            selectedLabel = e.detail.label; // null or "YYYY"
            renderCardsForSelection();
        });

    } catch (err) {
        console.error(err);
        const container = document.querySelector('.projects');
        if (container) container.innerHTML = '<p>Something went wrong. Check console.</p>';
    }
})();

/* ---------------- Pie chart builder (reactive) ---------------- */

function renderPieChart(projectsGiven) {
    const svg = d3.select('#projects-pie-plot');
    if (svg.empty()) return;

    // Clear old chart
    svg.selectAll('*').remove();

    // Legend element (prefer .pie-container .legend; fallback to .legend)
    const legendRoot = d3.select('.pie-container .legend').empty()
        ? d3.select('.legend')
        : d3.select('.pie-container .legend');

    if (!legendRoot.empty()) legendRoot.selectAll('*').remove();

    // No data case
    if (!Array.isArray(projectsGiven) || projectsGiven.length === 0) {
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .text('No data');
        return;
    }

    // Aggregate: count per year
    let rolled = d3.rollups(projectsGiven, v => v.length, extractYear);
    rolled.sort((a, b) => {
        if (a[0] === 'Unknown') return 1;
        if (b[0] === 'Unknown') return -1;
        return b[0].localeCompare(a[0], undefined, { numeric: true });
    });
    const pieData = rolled.map(([label, value]) => ({ label, value }));

    // Scales & generators
    const radius = 50;
    const color = d3.scaleOrdinal()
        .domain(pieData.map(d => d.label))
        .range(d3.schemeTableau10);

    const arc = d3.arc().innerRadius(0).outerRadius(radius);
    const labelArc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius * 0.6);
    const slices = d3.pie().value(d => d.value).sort(null)(pieData);

    // Slices
    const paths = svg.selectAll('path.slice')
        .data(slices, d => d.data.label)
        .join('path')
        .attr('class', 'slice')
        // use CSS var so .selected can override via !important
        .style('--color', d => color(d.data.label))
        .attr('d', arc)
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .classed('selected', d => d.data.label === selectedLabel);

    // Tooltips
    paths.select('title').remove();
    paths.append('title').text(d => `${d.data.label}: ${d.data.value}`);

    // Clicking a slice toggles selection
    paths.on('click', (_evt, d) => {
        const label = d.data.label;
        selectedLabel = (selectedLabel === label) ? null : label;

        // Toggle classes for visual selection
        svg.selectAll('path.slice')
            .classed('selected', dd => dd.data.label === selectedLabel);
        legendRoot.selectAll('li.legend-item')
            .classed('selected', li => li.label === selectedLabel);

        // Notify page to re-render cards using this selection
        window.dispatchEvent(new CustomEvent('pie-select', {
            detail: { label: selectedLabel }
        }));
    });

    // Labels (hide tiny wedges)
    const MIN_ANGLE = 0.25; // ~14°
    svg.selectAll('text.label')
        .data(slices, d => d.data.label)
        .join('text')
        .attr('class', 'label')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.32em')
        .text(d => (d.endAngle - d.startAngle > MIN_ANGLE ? d.data.label : ''));

    // Legend
    if (!legendRoot.empty()) {
        legendRoot.selectAll('li.legend-item')
            .data(pieData, d => d.label)
            .join('li')
            .attr('class', 'legend-item')
            .style('--color', d => color(d.label))
            .classed('selected', d => d.label === selectedLabel)
            .html(d => `<span class="swatch" aria-hidden="true"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', (_evt, d) => {
                selectedLabel = (selectedLabel === d.label) ? null : d.label;

                svg.selectAll('path.slice')
                    .classed('selected', dd => dd.data.label === selectedLabel);
                legendRoot.selectAll('li.legend-item')
                    .classed('selected', li => li.label === selectedLabel);

                window.dispatchEvent(new CustomEvent('pie-select', {
                    detail: { label: selectedLabel }
                }));
            });
    }
}
