// projects/projects.js
import { fetchJSON, renderProjects } from '../global.js';

(async () => {
    try {
        const container = document.querySelector('.projects');
        const titleEl = document.querySelector('.projects-title');

        if (!container) throw new Error('Missing .projects container');

        // NOTE: path is relative to global.js in the site root
        const data = await fetchJSON('lib/projects.json');

        // Count in the H1
        if (titleEl) {
            const count = Array.isArray(data) ? data.length : 0;
            titleEl.innerHTML = `Projects <span class="count">(${new Intl.NumberFormat().format(count)})</span>`;
        }

        if (!data) {
            container.innerHTML = '<p>Could not load projects.</p>';
            return;
        }
        renderProjects(data, container, 'h2');
    } catch (err) {
        console.error(err);
        const container = document.querySelector('.projects');
        if (container) container.innerHTML = '<p>Something went wrong. Check console.</p>';
    }
})();
