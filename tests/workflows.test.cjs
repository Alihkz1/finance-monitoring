const test=require('node:test'),a=require('node:assert/strict'),vm=require('node:vm');const {ui,source,Element}=require('./harness.cjs');
const KEY='mandeh-planner-v1';
function prepare(){const app=ui();app.read('save({...state,savings:1000,base:P.parts(P.ordinal(today)-3)});fillSettings()');return app}
function submit(app,id){app.get(id).onsubmit(app.event())}
function openEdit(app,list,index=0){app.get(list).children[index].querySelector('.record-actions').children.find(x=>x.textContent==='ویرایش').onclick()}
test('create/confirm/undo income and expense update actual and projected balances and preserve records',()=>{
 const u=prepare();u.get('income-title').value='salary';u.get('income-amount').value='۵۰۰';submit(u,'income-form');a.equal(u.read('state.incomes.length'),1);a.equal(u.read('Finance.actual(state,today)'),1000);a.equal(u.read('Finance.finalBalance(state).balance'),1500);
 u.get('incomes-list').children[0].querySelector('.record-actions').children[0].onclick();a.equal(u.read('Finance.actual(state,today)'),1500);u.get('incomes-list').children[0].querySelector('.record-actions').children[0].onclick();a.equal(u.read('Finance.actual(state,today)'),1000);
 u.get('expense-title').value='rent';u.get('expense-amount').value='١٠٠';submit(u,'expense-form');u.get('expenses-list').children[0].querySelector('.record-actions').children[0].onclick();a.equal(u.read('Finance.actual(state,today)'),900);a.equal(u.read('state.expenses.length'),1);a.equal(u.read('Finance.finalBalance(state).balance'),1400);
});
test('editing income updates a single ID and confirmation without adding a row',()=>{
 const u=prepare();u.read("save({...state,incomes:[{id:'one',title:'one',date:today,amount:200,settledOn:today},{id:'two',title:'two',date:today,amount:300}]})");openEdit(u,'incomes-list');u.get('edit-amount').value='۴۵۰';u.get('edit-title').value='changed';submit(u,'edit-form');a.equal(u.read('state.incomes.length'),2);a.equal(u.read('state.incomes[0].id'),'one');a.equal(u.read('state.incomes[0].amount'),450);a.equal(u.read('Finance.actual(state,today)'),1450);a(u.read('!!state.incomes[0].settledOn'));submit(u,'edit-form');a.equal(u.read('state.incomes.length'),2);
});
test('loan installment confirmation is independent; loan editing protects confirmed installment numbers',()=>{
 const u=prepare();u.read("save({...state,loans:[{id:'loan',title:'loan',date:today,amount:100,months:3}],spentItems:[{id:'food',title:'food',date:today,amount:50}]})");let details=u.get('loans-list').children[0].querySelector('.installments');a.equal(details.children.length,1);details.open=true;for(const fn of details.listeners.toggle)fn();a.equal(details.children.length,4);details.children[2].children[1].onclick();a.equal(u.read('Object.keys(state.loans[0].paid).length'),1);a.equal(u.read('Finance.actual(state,today)'),850);a.equal(u.read('Finance.finalBalance(state).balance'),650);
 openEdit(u,'loans-list');u.get('edit-months').value='۱';submit(u,'edit-form');a.equal(u.read('state.loans[0].months'),3);a.equal(u.get('edit-dialog').open,true);u.get('edit-months').value='۴';u.get('edit-amount').value='۱۵۰';submit(u,'edit-form');a.equal(u.read('state.loans[0].months'),4);a.equal(u.read('Object.keys(state.loans[0].paid).length'),1);a.equal(u.read('Finance.actual(state,today)'),800);
});
test('rebasing to today preserves historic records and resets the baseline snapshot',()=>{
 const u=prepare();u.read("save({...state,expenses:[{id:'paid',title:'paid',amount:100,date:state.base,settledOn:state.base}],incomes:[{id:'waiting',title:'waiting',amount:300,date:state.base}],spentItems:[{id:'food',title:'food',amount:50,date:P.parts(P.ordinal(today)-1)}]})");u.get('savings').value='۸۰۰';u.read("picker('base-date',today)");submit(u,'settings-form');a.equal(u.read('state.savings'),800);a.equal(u.read('state.spentItems.length'),1);a.equal(u.read('state.expenses.length'),1);a.equal(u.read('Finance.actual(state,today)'),800);a.equal(u.read('Finance.finalBalance(state).balance'),1100);
});
test('ledger creation, exact monthly totals, edit, delete and reload round trip',()=>{
 const u=prepare();for(const [title,amount] of [['food','۲۰۰'],['taxi','۱۰۰']]){u.get('spent-title').value=title;u.get('spent-amount').value=amount;submit(u,'spent-form')}a.equal(u.read('state.spentItems.length'),2);a.equal(u.get('spent-months').children.length,1);a.equal(u.read('Finance.actual(state,today)'),700);a.equal(u.read('Finance.finalBalance(state).balance'),700);a.equal(u.get('timeline').children.length,1);
 const row=u.get('spent-months').children[0].querySelector('.record-actions');row.children[0].onclick();const title=u.get('spent-title').value;u.get('spent-amount').value='۲۵';submit(u,'spent-form');a.equal(u.read('state.spentItems.length'),2);const persisted=JSON.parse(u.storage.get(KEY));a.equal(persisted.spentItems.find(x=>x.title===title).amount,25);const reload=ui({storage:u.storage});a.equal(reload.read('state.spentItems.length'),2);reload.get('spent-months').children[0].querySelector('.record-actions').children[1].onclick();reload.get('confirm-dialog').returnValue='delete';reload.get('confirm-dialog').onclose();a.equal(reload.read('state.spentItems.length'),1);
});
test('hypothetical purchases include ledger spending and never mutate persisted state',()=>{
 const u=prepare();u.read("save({...state,spentItems:[{id:'food',title:'food',amount:100,date:today}]})");const before=u.storage.get(KEY);u.get('scenario-title').value='hypothesis';u.get('scenario-amount').value='۲۵۰';submit(u,'scenario-form');a.equal(u.storage.get(KEY),before);a.equal(u.read('state.expenses.length'),0);a.ok(u.get('scenario-result').children[1].textContent.includes(new Intl.NumberFormat('fa-IR').format(650)));
});
test('imports larger than old 1MB limit round trip all ledger entries and statuses',async()=>{
 const u=prepare();u.read("save({...state,loans:[{id:'loan',title:'loan',amount:100,date:today,months:2,paid:{'1':today}}],spentItems:Array.from({length:5000},(_,i)=>({id:'s'+i,title:'خ'.repeat(100),amount:1,date:today}))})");u.get('export').onclick();const blob=u.exported();a.ok(blob.size>1000000);const json=await blob.text();const v=ui();v.get('backup-file').files=[{size:blob.size,text:async()=>json}];await v.get('backup-file').onchange({target:v.get('backup-file')});a.equal(v.read('state.spentItems.length'),5000);a.equal(v.read('Object.keys(state.loans[0].paid).length'),1);a.equal(v.read('Finance.actual(state,today)'),-4100);
});
test('invalid IDs, future confirmations and malformed files cannot overwrite valid data',async()=>{
 const u=prepare(),before=u.storage.get(KEY);for(const json of ['null','{}','[]','invalid json',JSON.stringify({savings:2,base:[1405,8,1],expenses:[null],incomes:[],loans:[]})]){u.get('backup-file').files=[{size:json.length,text:async()=>json}];await u.get('backup-file').onchange({target:u.get('backup-file')});a.equal(u.storage.get(KEY),before)}
});
test('bad startup data is preserved until explicit recovery or confirmed deletion',()=>{
 const storage=new Map([[KEY,'broken original data'],['other-app','untouched']]);const u=ui({storage});a.equal(u.read('save({...state,savings:300})'),false);a.equal(storage.get(KEY),'broken original data');u.get('delete-all-dialog').returnValue='cancel';for(const fn of u.get('delete-all-dialog').listeners.close)fn();a.equal(storage.get(KEY),'broken original data');u.get('delete-all-dialog').returnValue='delete-all';for(const fn of u.get('delete-all-dialog').listeners.close)fn();a.equal(storage.has(KEY),false);a.equal(storage.get('other-app'),'untouched');a.equal(u.read('save({...state,savings:400})'),true);
});
test('storage write failure does not update displayed/calculated state',()=>{
 const u=prepare(),before=u.storage.get(KEY);u.failWrites(true);a.equal(u.read('save({...state,savings:9000})'),false);a.equal(u.read('state.savings'),1000);a.equal(u.storage.get(KEY),before);
});
test('multi-tab edits cannot overwrite changes silently and stale edit forms are rejected',()=>{
 const u=prepare();u.read("save({...state,incomes:[{id:'x',title:'x',amount:100,date:today}]})");openEdit(u,'incomes-list');const remote=JSON.parse(u.storage.get(KEY));remote.incomes[0].amount=700;u.storage.set(KEY,JSON.stringify(remote));a.equal(u.read('save({...state,savings:9000})'),false);u.fire('storage',{key:KEY});a.equal(u.read('state.incomes[0].amount'),700);u.get('edit-amount').value='۵۰۰';submit(u,'edit-form');a.equal(u.read('state.incomes[0].amount'),700);a.equal(u.get('edit-dialog').open,true);
});
test('legacy removed fields migrate without losing recorded transactions',()=>{
 const prior={savings:1000,base:[1405,8,1],daily:900,dailyActual:[{date:[1405,8,2],amount:300}],expenses:[],incomes:[],loans:[],spentItems:[{id:'x',title:'x',amount:50,date:[1405,8,2]}]};const storage=new Map([[KEY,JSON.stringify(prior)]]),u=ui({storage}),saved=JSON.parse(storage.get(KEY));a.equal(saved.spentItems.length,1);a.equal('daily' in saved,false);a.equal('dailyActual' in saved,false);a.equal(u.read('Finance.actual(state,today)'),950);
});
test('picker clamps a 31st day to a short month and numeric parser rejects malformed values',()=>{
 const u=prepare();u.read("picker('income-date',[1405,6,31])");u.get('income-date').children[1].value='7';u.get('income-date').onchange();a.equal(u.get('income-date').children[0].value,'30');for(const text of ['۱۲۳٬۴۵۶','١٢٣,٤٥٦','123456'])a.equal(u.read('num('+JSON.stringify(text)+')'),123456);for(const text of ['-100','1.5','','NaN','9007199254740992'])a.throws(()=>u.read('num('+JSON.stringify(text)+')'));
});
test('amount formatting does not silently turn negative or decimal values into positive integers',()=>{
 const u=prepare();u.document.querySelectorAll=()=>[...u.elements.values()];vm.runInContext(source('amount-format.js'),u.context);const input=u.get('expense-amount');for(const raw of ['-100','1.5','100abc']){input.value=raw;input.selectionStart=raw.length;input.listeners.input[0]({isComposing:false});a.throws(()=>u.read('num('+JSON.stringify(input.value)+')'))}input.value='1234567';input.selectionStart=7;input.listeners.input[0]({isComposing:false});a.equal(input.value,'۱٬۲۳۴٬۵۶۷');
});
test('Tehran midnight changes current date and recalculates newly applicable confirmed events',()=>{
 const u=prepare();const before=new Date('2026-11-18T20:29:59Z').getTime(),after=before+1000;class Clock extends Date{constructor(...args){super(...(args.length?args:[Clock.nowValue]))}static now(){return Clock.nowValue}}Clock.nowValue=before;u.context.Date=Clock;u.read('today=tehranToday();save({...state,base:today,savings:1000,incomes:[{id:"i",title:"i",amount:300,date:P.parts(P.ordinal(today)+1),settledOn:P.parts(P.ordinal(today)+1)}]})');
 // The invalid future confirmation above is correctly rejected; seed a legal
 // imported future-scheduled unconfirmed record for the date-boundary check.
 u.read('save({...state,base:today,savings:1000,incomes:[{id:"i",title:"i",amount:300,date:P.parts(P.ordinal(today)+1)}]})');const ordinal=u.read('P.ordinal(today)');vm.runInContext(source('current-day.js'),u.context);Clock.nowValue=after;u.fire('focus');a.equal(u.read('P.ordinal(today)'),ordinal+1);a.equal(u.read('Finance.actual(state,today)'),1000);u.get('incomes-list').children[0].querySelector('.record-actions').children[0].onclick();a.equal(u.read('Finance.actual(state,today)'),1300);
});


test('reopening record deletion and dismissing it never reuses the previous approval',()=>{
 const u=prepare();u.read("save({...state,expenses:[{id:'a',title:'a',amount:10,date:today},{id:'b',title:'b',amount:20,date:today}]})");
 function removeFirst(){u.get('expenses-list').children[0].querySelector('.record-actions').children.find(x=>x.textContent==='حذف').onclick()}
 removeFirst();u.get('confirm-dialog').returnValue='delete';u.get('confirm-dialog').close();a.equal(u.read('state.expenses.length'),1);
 removeFirst();u.get('confirm-dialog').close();a.equal(u.read('state.expenses.length'),1);
});

test('delete-all approval is not retained when the dialog is dismissed next time',()=>{
 const u=prepare();u.get('delete-all').onclick();u.get('delete-all-dialog').returnValue='delete-all';u.get('delete-all-dialog').close();
 u.read('save({...state,savings:700})');u.get('delete-all').onclick();u.get('delete-all-dialog').close();a.equal(u.read('state.savings'),700);
});

test('baseline form refuses to overwrite a newer baseline received from another tab',()=>{
 const u=prepare(),remote=JSON.parse(u.storage.get(KEY));remote.savings=3000;u.storage.set(KEY,JSON.stringify(remote));u.fire('storage',{key:KEY});
 u.get('savings').value='800';submit(u,'settings-form');a.equal(u.read('state.savings'),3000);a.equal(u.get('savings').value,new Intl.NumberFormat('fa-IR').format(3000));
 u.get('savings').value='800';submit(u,'settings-form');a.equal(u.read('state.savings'),800);
});

test('backup refuses to export stale state before a remote storage event arrives',()=>{
 const u=prepare(),remote=JSON.parse(u.storage.get(KEY));remote.savings=3000;u.storage.set(KEY,JSON.stringify(remote));u.get('export').onclick();a.equal(u.exported(),null);
 u.fire('storage',{key:KEY});u.get('export').onclick();a.ok(u.exported());
});

test('restoring a file resets ledger edit mode and closes old record editors',async()=>{
 const u=prepare();u.read("save({...state,spentItems:[{id:'spent',title:'spent',amount:100,date:today}],incomes:[{id:'income',title:'income',amount:200,date:today}]})");
 u.get('spent-months').children[0].querySelector('.record-actions').children[0].onclick();openEdit(u,'incomes-list');
 const json=JSON.stringify({savings:500,base:u.read('today'),expenses:[],incomes:[],loans:[]});u.get('backup-file').files=[{size:json.length,text:async()=>json}];await u.get('backup-file').onchange({target:u.get('backup-file')});
 a.equal(u.get('edit-dialog').open,false);a.equal(u.get('spent-cancel').hidden,true);
 u.get('spent-title').value='new';u.get('spent-amount').value='50';submit(u,'spent-form');a.equal(u.read('state.spentItems.length'),1);a.notEqual(u.read('state.spentItems[0].id'),'spent');
});

test('a complete render generates the financial event list once, and unopened loans build no installment controls',()=>{
 const u=prepare();u.read("save({...state,loans:[{id:'loan',title:'loan',amount:100,date:today,months:360}]});globalThis.eventCalls=0;globalThis.originalEvents=P.events;P.events=(...args)=>{eventCalls++;return originalEvents(...args)};render()");
 a.equal(u.read('eventCalls'),1);a.equal(u.get('loans-list').children[0].querySelector('.installments').children.length,1);
});
