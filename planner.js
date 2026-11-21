const P = (() => {
    const fmt = new Intl.DateTimeFormat('en-u-ca-persian', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });
    const starts = new Map();
    function parts(n) {
        const p = Object.fromEntries(fmt.formatToParts(new Date(n * 86400000)).map(x => [x.type, x.value]));
        return [+p.year, +p.month, +p.day];
    }
    function start(y) {
        if (!starts.has(y)) {
            let n = Math.floor(Date.UTC(y + 621, 2, 15) / 86400000);
            while (parts(n)[0] < y) n++;
            starts.set(y, n);
        }
        return starts.get(y);
    }
    function days(y, m) { return m <= 6 ? 31 : m < 12 ? 30 : start(y + 1) - start(y) - 336; }
    function ordinal(a) { return start(a[0]) + (a[1] <= 6 ? (a[1] - 1) * 31 : 186 + (a[1] - 7) * 30) + a[2] - 1; }
    function month(a, i) {
        const t = a[0] * 12 + a[1] - 1 + i, y = Math.floor(t / 12), m = t % 12 + 1;
        return [y, m, Math.min(a[2], days(y, m))];
    }
    function events(s) {
        const result = [], base = ordinal(s.base);
        function add(x, type, scheduledDate, settledOn, extra = {}) {
            // Pending overdue obligations still affect forecasts after rebasing.
            // Completed history is preserved but is already included in savings.
            const date = settledOn || (ordinal(scheduledDate) < base ? s.base : scheduledDate);
            result.push({ ...x, ...extra, type, scheduledDate, date, completed: !!settledOn });
        }
        for (const [key, type] of [['expenses', 'expense'], ['incomes', 'income']]) {
            for (const x of s[key] || []) add(x, type, x.date, x.settledOn);
        }
        for (const x of s.loans || []) {
            for (let i = 0; i < x.months; i++) add(x, 'bank', month(x.date, i), x.paid?.[i + 1], { installment: i + 1 });
        }
        for (const x of s.spentItems || []) add(x, 'expense', x.date, x.date, { source: 'spending' });
        return result.sort((a, b) => ordinal(a.date) - ordinal(b.date) || String(a.id).localeCompare(String(b.id)) || (a.installment || 0) - (b.installment || 0));
    }
    function affects(s, event) { return !(event.completed && ordinal(event.date) <= ordinal(s.base)); }
    function delta(event) { return event.type === 'income' ? event.amount : -event.amount; }
    function forecast(s, eventList = events(s)) {
        const groups = [];
        let balance = s.savings, spending = 0;
        for (const event of eventList) {
            let group = groups.at(-1);
            if (!group || ordinal(group.date) !== ordinal(event.date)) {
                group = { date: event.date, items: [] };
                groups.push(group);
            }
            if (affects(s, event)) {
                balance += delta(event);
                if (event.source === 'spending') spending += event.amount;
            }
            group.items.push(event);
            group.spending = spending;
            group.balance = balance;
        }
        return groups;
    }
    return { parts, days, ordinal, month, events, affects, delta, forecast };
})();
