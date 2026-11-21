const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const code = fs.readFileSync(path.join(__dirname, '../timeline-scroll.js'), 'utf8');

async function run(dates, { visible = 30, hidden = false, hash = '', persisted = false } = {}) {
    const calls = [], events = {};
    const groups = dates.map(date => ({ date }));
    let rendered = 0;
    const cards = () => groups.slice(0, context.visible).map((_, index) => ({
        hidden: false,
        getBoundingClientRect() { calls.push({ index }); return { top: 300 }; },
    }));
    const context = vm.createContext({
        visible, renderedSnapshot: { groups }, today: [1405, 8, 30], location: { hash },
        P: { ordinal: ([y, m, d]) => y * 400 + m * 32 + d },
        document: {
            readyState: 'loading', fonts: { ready: Promise.resolve() },
            getElementById: id => id === 'timeline-page' ? { hidden } : { get children() { return cards(); } },
            querySelector: () => ({ getBoundingClientRect: () => ({ height: 76 }) }),
        },
        window: { scrollY: 80, scrollTo: options => calls.push(options), addEventListener: (name, fn) => { events[name] = fn; } },
        render: () => { rendered++; }, requestAnimationFrame: fn => fn(),
    });
    vm.runInContext(code, context);
    events.pageshow?.({ persisted });
    await new Promise(resolve => setImmediate(resolve));
    return { calls, rendered, context, events };
}

test('starts at the first entry of the current Persian month, including earlier days this month', async () => {
    const result = await run([[1405, 7, 31], [1405, 8, 1], [1405, 8, 30], [1405, 9, 1]]);
    assert.equal(result.calls[0].index, 1);
    assert.equal(result.calls[1].top, 288);
});
test('loads historical pagination far enough to include the current month', async () => {
    const dates = Array.from({ length: 70 }, () => [1405, 7, 1]);
    dates.push([1405, 8, 5]);
    const result = await run(dates);
    assert.equal(result.rendered, 1);
    assert.equal(result.context.visible, 100);
    assert.equal(result.calls[0].index, 70);
});
test('falls forward to the next available month or back to the latest historical entry', async () => {
    assert.equal((await run([[1405, 7, 1], [1405, 9, 1]])).calls[0].index, 1);
    assert.equal((await run([[1405, 6, 1], [1405, 7, 1]])).calls[0].index, 1);
});
test('does not scroll empty or inactive pages, explicit anchors or restored back/forward pages', async () => {
    for (const options of [{ hidden: true }, { hash: '#event' }, { persisted: true }]) {
        assert.equal((await run([[1405, 8, 1]], options)).calls.length, 0);
    }
    assert.equal((await run([])).calls.length, 0);
});
test('initial navigation scrolls once and never jumps again on later page events', async () => {
    const result = await run([[1405, 8, 1]]);
    result.events.pageshow({ persisted: false });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(result.calls.filter(c => c.index !== undefined).length, 1);
});
