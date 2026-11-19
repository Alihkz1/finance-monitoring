const Finance = (() => {
    const limit = 1e10;
    function object(x) { return !!x && typeof x === 'object' && !Array.isArray(x); }
    function dateOK(d, maxYear = 1630) {
        return Array.isArray(d) && d.length === 3 && d.every(Number.isInteger) && d[0] >= 1200 && d[0] <= maxYear && d[1] >= 1 && d[1] <= 12 && d[2] >= 1 && d[2] <= P.days(d[0], d[1]);
    }
    function money(n, zero = false) { return Number.isSafeInteger(n) && n >= (zero ? 0 : 1) && n <= limit; }
    function valid(s, today) {
        if (!object(s) || !dateOK(s.base, 1600) || !money(s.savings, true)) return false;
        const latest = today && dateOK(today) ? P.ordinal(today) : Infinity;
        function settled(d) { return dateOK(d) && P.ordinal(d) <= latest; }
        function collection(list, max, kind) {
            if (!Array.isArray(list) || list.length > max) return false;
            const ids = new Set();
            return list.every(x => {
                if (!object(x) || typeof x.id !== 'string' || !x.id.trim() || ids.has(x.id) || typeof x.title !== 'string' || !x.title.trim() || x.title.length > 100 || !money(x.amount) || !dateOK(x.date, 1600)) return false;
                ids.add(x.id);
                if (kind === 'spending') return P.ordinal(x.date) <= latest;
                if (kind === 'loan') {
                    if (!Number.isInteger(x.months) || x.months < 1 || x.months > 360 || x.settledOn !== undefined) return false;
                    if (x.paid === undefined) return true;
                    return object(x.paid) && Object.entries(x.paid).every(([index, date]) => /^[1-9]\d*$/.test(index) && String(Number(index)) === index && +index <= x.months && settled(date));
                }
                return x.paid === undefined && (x.settledOn === undefined || settled(x.settledOn));
            });
        }
        return collection(s.expenses, 200, 'expense') && collection(s.incomes, 200, 'income') && collection(s.loans, 200, 'loan') && (s.spentItems === undefined || collection(s.spentItems, 5000, 'spending'));
    }
    function balanceAt(s, date, confirmedOnly = false) {
        if (P.ordinal(date) < P.ordinal(s.base)) return null;
        const end = P.ordinal(date);
        let result = s.savings;
        for (const event of P.events(s)) {
            if (P.ordinal(event.date) <= end && P.affects(s, event) && (!confirmedOnly || event.completed)) result += P.delta(event);
        }
        return result;
    }
    function actual(s, date) { return balanceAt(s, date, true); }
    function projected(s, date) { return balanceAt(s, date); }
    function spendingCost(s, from, to) {
        return (s.spentItems || []).reduce((total, x) => {
            const day = P.ordinal(x.date);
            return total + (day > P.ordinal(s.base) && day > from && day <= to ? x.amount : 0);
        }, 0);
    }
    function finalBalance(s) {
        const last = P.events(s).filter(x => P.ordinal(x.date) >= P.ordinal(s.base)).at(-1);
        return last ? { date: last.date, balance: projected(s, last.date) } : null;
    }
    function monthly(s, date) {
        const events = P.events(s), last = events.at(-1)?.date || s.base;
        const end = P.ordinal(last) > P.ordinal(date) ? last : date;
        const rows = [], buckets = new Map();
        for (const event of events) {
            if (!P.affects(s, event)) continue;
            const key = event.date[0] * 12 + event.date[1];
            if (!buckets.has(key)) buckets.set(key, { income: 0, expense: 0, loan: 0, spending: 0 });
            const field = event.source === 'spending' ? 'spending' : event.type === 'income' ? 'income' : event.type === 'bank' ? 'loan' : 'expense';
            buckets.get(key)[field] += event.amount;
        }
        let year = s.base[0], month = s.base[1], balance = s.savings;
        while (year < end[0] || year === end[0] && month <= end[1]) {
            const totals = buckets.get(year * 12 + month) || { income: 0, expense: 0, loan: 0, spending: 0 };
            balance += totals.income - totals.expense - totals.loan - totals.spending;
            rows.push({ year, month, ...totals, balance });
            if (++month === 13) { year++; month = 1; }
        }
        return rows;
    }
    return { valid, dateOK, actual, monthly, spendingCost, projected, finalBalance };
})();
