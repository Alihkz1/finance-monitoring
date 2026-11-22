const $ = id => document.getElementById(id), key = 'mandeh-planner-v1', fa = new Intl.NumberFormat('fa-IR'), yearFormat = new Intl.NumberFormat('fa-IR', { useGrouping: false });
function tehranToday(now=new Date()){const parts=new Intl.DateTimeFormat('en',{timeZone:'Asia/Tehran',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(now);const d=Object.fromEntries(parts.map(p=>[p.type,p.value]));return P.parts(Math.floor(Date.UTC(+d.year,+d.month-1,+d.day)/86400000))}
let today=tehranToday();
const months = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
let state = { savings: 0, base: today, expenses: [], loans: [], incomes: [] }, visible = 30;
function dateValid(d) { return Finance.dateOK(d, 1600) }
function valid(s) { return Finance.valid(s,today) }
function normalize(s) { if(!s||typeof s!=='object'||Array.isArray(s))return s;const {daily,dailyActual,...rest}=s;return { ...rest, incomes: s.incomes ?? [] } }
let storageVersion = null, loadFailed = false;
try {
    const raw = localStorage.getItem(key);
    storageVersion = raw;
    if (raw) {
        const original = JSON.parse(raw);
        const loaded = normalize(original);
        if (!valid(loaded)) throw Error('Invalid stored state');
        state = loaded;
        if (Object.hasOwn(original, 'daily') || Object.hasOwn(original, 'dailyActual')) {
            const migrated = JSON.stringify(loaded);
            localStorage.setItem(key, migrated);
            storageVersion = migrated;
        }
    }
} catch {
    loadFailed = true;
    toast('خواندن اطلاعات ممکن نیست. برای جلوگیری از پاک‌شدن داده‌ها، ابتدا فایل معتبر بازیابی کنید یا حذف همهٔ اطلاعات را تأیید کنید.', true);
}

function save(next, { replaceStored = false } = {}) {
    next = normalize(next);
    if (!valid(next)) {
        toast('اطلاعات معتبر نیست؛ عنوان، مبلغ و تاریخ‌ها را بررسی کنید.', true);
        return false;
    }
    if (loadFailed && !replaceStored) {
        toast('ذخیره برای حفاظت از اطلاعات قبلی متوقف شده است؛ ابتدا اطلاعات را بازیابی کنید.', true);
        return false;
    }
    try {
        if (!replaceStored && localStorage.getItem(key) !== storageVersion) {
            toast('اطلاعات در صفحهٔ دیگری تغییر کرده است؛ صفحه را تازه کنید و دوباره تلاش کنید.', true);
            return false;
        }
        const serialized = JSON.stringify(next);
        localStorage.setItem(key, serialized);
        storageVersion = serialized;
        loadFailed = false;
    } catch {
        toast('ذخیره انجام نشد؛ فضای مرورگر یا مجوز ذخیره‌سازی را بررسی کنید.', true);
        return false;
    }
    state = next;
    visible = 30;
    render();
    $('save-state').textContent = 'ذخیره شد.';
    return true;
}
function num(v) { v = v.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).replace(/[,٬\s]/g, ''); if (!/^\d+$/.test(v) || !Number.isSafeInteger(+v) || +v > 1e10) throw Error('عدد صحیح بین صفر و ۱۰ میلیارد وارد کنید.'); return +v }
function picker(id,d){const el=$(id);el.replaceChildren();[d[2],d[1],d[0]].forEach((v,i)=>{const button=document.createElement('button');button.type='button';button.className='date-trigger';button.setAttribute('aria-label',['روز','ماه','سال'][i]);button.setAttribute('aria-haspopup','listbox');button.setAttribute('aria-expanded','false');const values=i===0?Array.from({length:P.days(d[0],d[1])},(_,j)=>j+1):i===1?Array.from({length:12},(_,j)=>j+1):Array.from({length:401},(_,j)=>1200+j);button.options=values.map(n=>({value:String(n),text:i===1?months[n-1]:yearFormat.format(n)}));button.value=String(v);button.textContent=button.options.find(x=>x.value===button.value).text;el.append(button)});el.onchange=()=>{const a=readDate(id);picker(id,[a[0],a[1],Math.min(a[2],P.days(a[0],a[1]))])}}
function readDate(id) { return [...$(id).children].map(x => +x.value).reverse() }
function dateText(d) { return fa.format(d[2]) + ' ' + months[d[1] - 1] + ' ' + yearFormat.format(d[0]) }
function confirmDeletion(action) {
    const dialog = $('confirm-dialog');
    dialog.returnValue = '';
    dialog.onclose = () => {
        const confirmed = dialog.returnValue === 'delete';
        dialog.returnValue = '';
        dialog.onclose = null;
        if (confirmed) action();
    };
    dialog.showModal();
}
const replacementHandlers = new Set();
function resetEntryForms() {
    fillSettings();
    for (const kind of ['expense', 'loan', 'income']) {
        $(kind + '-form').reset();
        picker(kind + '-date', today);
    }
    for (const reset of replacementHandlers) reset();
}
function node(tag, text, cls) { const n = document.createElement(tag); n.textContent = text; if (cls) n.className = cls; return n }
const renderViews = new Set();
let renderedSnapshot;
function renderSummary(view) {
    const currentBalance = view.actual;
    $('pending-income-value').textContent = fa.format(view.pendingAmount);
    $('pending-income-count').textContent = fa.format(view.pendingCount) + ' درآمد دریافت‌نشده، شامل معوق';
    $('today-value').textContent = currentBalance === null ? '—' : fa.format(currentBalance);
    $('today-value').className = currentBalance < 0 ? 'negative' : '';
    $('today-date').textContent = P.ordinal(today) < P.ordinal(state.base) ? 'تاریخ مبنا هنوز نرسیده است' : dateText(today) + (P.ordinal(today) === P.ordinal(state.base) ? ' · روز مبنا' : ' · تراکنش‌های تأییدشده و خرج‌های ثبت‌شده');
    $('loans-value').textContent = fa.format(view.unpaidAmount);
    $('loans-count').textContent = fa.format(view.unpaidCount) + ' قسط پرداخت‌نشده';
}
function renderTimeline(view) {
    const { groups, events } = view;
    $('event-count').textContent = fa.format(events.length) + ' رویداد'; $('empty').hidden = !!events.length; $('timeline').replaceChildren();
    groups.slice(0, visible).forEach(g => { const box = node('article', '', 'payment'+(P.ordinal(g.date)<P.ordinal(today)?' is-past':'')); box.append(node('div', dateText(g.date), 'payment-head')); g.items.forEach(x => { const row = node('div', '', 'payment-line event-' + x.type), description = node('div', '', 'event-description'); description.append(node('span', (x.source==='spending'?'خرج انجام‌شده':{ income: 'درآمد', expense: 'هزینه', bank: 'قسط بانکی' }[x.type]), 'event-badge ' + x.type), node('span', x.title, 'event-title')); if (x.type === 'bank') description.append(node('span', 'قسط ' + fa.format(x.installment) + ' از ' + fa.format(x.months), 'event-subtitle')); const amount = node('span', '', 'amount'); amount.append(node('span', (x.type === 'income' ? '+ ' : '− ') + fa.format(x.amount), 'amount-value'), node('span', 'تومان', 'amount-unit')); row.append(description, amount); box.append(row) }); box.append(node('div', 'خرج‌های انجام‌شده پس از مبنا تا این تاریخ: ' + fa.format(g.spending) + ' تومان', 'day-cost')); const total = node('div', '', 'payment-total'); total.append(node('span', 'مانده پس از رویدادهای این روز'), node('strong', fa.format(g.balance) + ' تومان', g.balance < 0 ? 'negative' : '')); box.append(total); $('timeline').append(box) });
    $('show-more').hidden = groups.length <= visible; const last = view.final; $('final-value').textContent = last ? fa.format(last.balance) : '—'; $('final-value').className = last?.balance < 0 ? 'negative' : ''; $('final-label').textContent = last ? dateText(last.date) : 'هنوز رویدادی ثبت نشده'; const first = groups.find(x => x.balance < 0); $('insight').textContent = first ? 'در ' + dateText(first.date) + ' مانده منفی می‌شود؛ درآمدهای بعدی ممکن است آن را جبران کنند.' : events.length ? 'مانده در پایان تمام روزهای ثبت‌شده، با احتساب درآمد و خرج‌های انجام‌شده، کافی است.' : ''; $('insight').className = 'insight' + (first ? ' warning' : '');
}
function renderRecords() {
    ['expenses', 'loans', 'incomes'].forEach(k => { const target = $({ expenses: 'expenses-list', loans: 'loans-list', incomes: 'incomes-list' }[k]); target.replaceChildren(); $({ expenses: 'expense-count', loans: 'bank-count', incomes: 'income-count' }[k]).textContent = fa.format(state[k].length) + ' ' + { expenses: 'هزینه', loans: 'وام', incomes: 'درآمد' }[k]; if (!state[k].length) target.append(node('p', 'هنوز موردی ثبت نشده.', 'muted')); state[k].forEach(x => { const row = node('div', '', 'record record-' + k), body = node('div', '', 'record-main'), actions = node('div', '', 'record-actions'); body.append(node('h3', x.title), node('p', fa.format(x.amount) + ' تومان · ' + dateText(x.date) + (k === 'loans' ? ' · ' + fa.format(x.months) + ' ماه · مجموع ' + fa.format(x.amount * x.months) + ' تومان' : ''))); const del = node('button', 'حذف', 'delete'); del.onclick = () => confirmDeletion(() => save({ ...state, [k]: state[k].filter(a => a.id !== x.id) })); actions.append(del); row.append(body, actions); target.append(row) }) })
}
function render() {
    renderedSnapshot = Finance.snapshot(state, today);
    renderSummary(renderedSnapshot);
    renderTimeline(renderedSnapshot);
    renderRecords();
    for (const draw of renderViews) draw();
}
['base-date', 'expense-date', 'loan-date', 'income-date'].forEach(id => picker(id, id === 'base-date' ? state.base : today));
let settingsSnapshot;
function baselineSnapshot() { return JSON.stringify([state.savings, state.base]); }
function fillSettings() { $('savings').value = state.savings ? fa.format(state.savings) : ''; picker('base-date', state.base); settingsSnapshot = baselineSnapshot(); } fillSettings();
$('settings-form').onsubmit = e => { e.preventDefault(); try { if (settingsSnapshot !== baselineSnapshot()) { fillSettings(); throw Error('مبنا در صفحهٔ دیگری تغییر کرده است؛ مقادیر جدید نمایش داده شد. دوباره بررسی کنید.'); } const next = { ...state, savings: num($('savings').value), base: readDate('base-date') }; if(P.ordinal(next.base)>P.ordinal(today))throw Error('تاریخ مبنا نمی‌تواند بعد از امروز باشد.');if(!valid(next))throw Error('مبلغ یا تاریخ مبنا معتبر نیست.'); if (save(next)) { fillSettings(); toast('مبنای محاسبه ذخیره شد.'); } } catch (e) { toast(e.message, true) } };
['expense', 'loan', 'income'].forEach(kind => { $(kind + '-form').onsubmit = e => { e.preventDefault(); if ($('edit-dialog').open) { toast('ویرایش را از دکمهٔ ذخیره تغییرات همان پنجره انجام دهید.', true); return; } try { const title = $(kind + '-title').value.trim(), amount = num($(kind + '-amount').value), date = readDate(kind + '-date'), k = { expense: 'expenses', loan: 'loans', income: 'incomes' }[kind]; if (!title || !amount) throw Error('عنوان و مبلغ بیشتر از صفر وارد کنید.'); const x = { id: crypto.randomUUID(), title, amount, date }; if (kind === 'loan') x.months = num($('loan-months').value); const next = { ...state, [k]: [...state[k], x] }; if(P.ordinal(date)<P.ordinal(state.base))throw Error('تاریخ رویداد جدید نباید قبل از مبنا باشد.');if(!valid(next))throw Error('تعداد اقساط ۱ تا ۳۶۰ و تعداد رکوردهای هر بخش حداکثر ۲۰۰ است.'); if (save(next)) { $(kind + '-form').reset(); picker(kind + '-date', date); toast('با موفقیت ثبت شد.') } } catch (e) { toast(e.message, true) } } });
$('show-more').onclick = () => { visible += 30; render() };
function backupFilename(now = new Date()) {
    const format = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn', {
        timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    });
    const parts = Object.fromEntries(format.formatToParts(now).map(part => [part.type, part.value]));
    return `mandeh-backup_${parts.year}-${parts.month}-${parts.day}_${parts.hour}-${parts.minute}-${parts.second}.json`;
}
$('export').onclick = () => { if(loadFailed){toast('ابتدا اطلاعات قبلی را بازیابی کنید؛ خروجی از حالت خالی تهیه نشد.',true);return}try { if (localStorage.getItem(key) !== storageVersion) { toast('اطلاعات در صفحهٔ دیگری تغییر کرده است؛ پیش از دریافت بک آپ صفحه را تازه کنید.', true); return; } } catch { toast('خواندن اطلاعات ذخیره‌شده ممکن نیست.', true); return; } const url = URL.createObjectURL(new Blob([JSON.stringify(state)], { type: 'application/json' })), a = document.createElement('a'); a.href = url; a.download = backupFilename(); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) };
$('import').onclick = () => $('backup-file').click(); $('backup-file').onchange = async e => { const file = e.target.files[0]; if (!file) return; try { if (file.size > 10 * 1024 * 1024) throw Error(); const s = normalize(JSON.parse(await file.text())); if (!valid(s)) throw Error(); if (!confirm('اطلاعات فعلی با فایل جایگزین شود؟')) return; if (save(s,{replaceStored:true})) { resetEntryForms(); toast('فایل با موفقیت بازیابی شد.') } } catch { toast('فایل معتبر نیست.', true) } finally { e.target.value = '' } };
$('delete-all').onclick = () => { const dialog = $('delete-all-dialog'); dialog.returnValue = ''; dialog.showModal(); };
$('delete-all-dialog').addEventListener('close', () => {
    const confirmed = $('delete-all-dialog').returnValue === 'delete-all';
    $('delete-all-dialog').returnValue = '';
    if (!confirmed) return;
    try { localStorage.removeItem(key) } catch { toast('حذف اطلاعات انجام نشد؛ مجوز ذخیره‌سازی مرورگر را بررسی کنید.', true); return }
    storageVersion=null;loadFailed=false;state = { savings: 0, base: today, expenses: [], loans: [], incomes: [] }; visible = 30;
    resetEntryForms();
    render(); $('save-state').textContent = 'اطلاعات این برنامه پاک شد.'; toast('تمام اطلاعات برنامه حذف شد.');
}); render();
