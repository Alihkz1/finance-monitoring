(() => {
    const page = document.getElementById('timeline-page');
    if (!page || page.hidden || location.hash) return;

    let started = false;
    async function scrollToCurrentMonth() {
        if (started) return;
        started = true;
        const groups = renderedSnapshot.groups;
        if (!groups.length) return;

        const monthStart = P.ordinal([today[0], today[1], 1]);
        const upcoming = groups.findIndex(group => P.ordinal(group.date) >= monthStart);
        // With no entries this month, use the next month with entries; if all
        // entries are historical, use the most recent one instead of the first.
        const index = upcoming === -1 ? groups.length - 1 : upcoming;
        if (visible <= index) {
            visible = index + 30;
            render();
        }

        // Wait for the local font and fixed header layout before measuring.
        try { await document.fonts?.ready; } catch { /* Use the fallback font. */ }
        requestAnimationFrame(() => {
            const target = document.getElementById('timeline').children[index];
            if (!target || target.hidden) return;
            const header = document.querySelector('.app-header');
            const offset = (header?.getBoundingClientRect().height || 0) + 16;
            window.scrollTo({
                top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - offset),
                behavior: 'instant',
            });
        });
    }

    if (document.readyState === 'complete') scrollToCurrentMonth();
    else window.addEventListener('pageshow', event => {
        if (!event.persisted) scrollToCurrentMonth();
    }, { once: true });
})();
