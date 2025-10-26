// /index.js
import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

console.log('index.js loaded');

(async () => {
    /* ---- Latest projects ---- */
    const projContainer = document.querySelector('#latest .projects');
    if (projContainer) {
        projContainer.innerHTML = '<p>Loading projects…</p>';

        const all = await fetchJSON('lib/projects.json'); // resolved via global.js
        if (!Array.isArray(all)) {
            projContainer.innerHTML = '<p>Could not load projects.</p>';
        } else {
            const latest = all.slice(0, 3);
            renderProjects(latest, projContainer, 'h3'); // smaller headings on home
        }
    }

    // ---- GitHub stats (Step 5) ----
    const profileStats = document.querySelector('#profile-stats');

    if (profileStats) {
        profileStats.textContent = 'Loading GitHub…';

        const githubData = await fetchGitHubData('alexisjacques'); // <-- your username
        if (!githubData) {
            profileStats.textContent = 'Could not load GitHub data.';
        } else {
            const fmt = n => new Intl.NumberFormat().format(n ?? 0);

            profileStats.innerHTML = `
      <dl class="stats">
        <div><dt>Public Repos:</dt><dd>${fmt(githubData.public_repos)}</dd></div>
        <div><dt>Public Gists:</dt><dd>${fmt(githubData.public_gists)}</dd></div>
        <div><dt>Followers:</dt><dd>${fmt(githubData.followers)}</dd></div>
        <div><dt>Following:</dt><dd>${fmt(githubData.following)}</dd></div>
      </dl>
    `;
        }
    }



})();
