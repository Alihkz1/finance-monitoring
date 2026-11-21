const test=require('node:test'),a=require('node:assert/strict');
const {core}=require('./harness.cjs');const {P,Finance:F}=core();
const base=()=>({savings:1000,base:[1405,8,28],expenses:[],incomes:[],loans:[],spentItems:[]});
const record=(id,amount,date,extra={})=>({id,title:id,amount,date,...extra});
test('baseline is a snapshot; prior and baseline confirmed spending is not deducted again',()=>{
 const s=base();s.spentItems=[record('old',700,[1405,8,27]),record('base',800,s.base),record('new',50,[1405,8,29])];
 s.expenses=[record('confirmed',100,s.base,{settledOn:s.base})];s.incomes=[record('received',300,s.base,{settledOn:s.base})];
 a.equal(F.actual(s,s.base),1000);a.equal(F.actual(s,[1405,8,29]),950);a.equal(F.actual(s,[1406,8,29]),950);a.equal(F.finalBalance(s).balance,950);
});
test('confirmed balance differs from forecast; pending debts and receipts are counted once',()=>{
 const s=base();s.expenses=[record('bill',100,[1405,8,29])];s.incomes=[record('salary',500,[1405,8,30])];s.loans=[record('loan',200,[1405,8,29],{months:2})];
 a.equal(F.actual(s,[1405,8,30]),1000);a.equal(F.projected(s,[1405,8,29]),700);a.equal(F.projected(s,[1405,8,30]),1200);
 s.expenses[0].settledOn=[1405,8,30];s.incomes[0].settledOn=[1405,9,1];s.loans[0].paid={'1':[1405,8,29]};
 a.equal(F.actual(s,[1405,8,29]),800);a.equal(F.actual(s,[1405,8,30]),700);a.equal(F.actual(s,[1405,9,1]),1200);
 a.equal(P.events(s).length,4);a.equal(F.finalBalance(s).balance,1000);delete s.expenses[0].settledOn;a.equal(F.actual(s,[1405,8,30]),800);
});
test('ledger-only days appear in timeline and deficit warnings',()=>{
 const s=base();s.spentItems=[record('late',1500,[1405,8,30])];const groups=P.forecast(s);a.equal(groups.length,1);a.equal(groups[0].items[0].source,'spending');a.equal(groups[0].balance,-500);a.equal(F.finalBalance(s).balance,-500);
});
test('rebasing retains history and carries overdue pending obligations into the forecast',()=>{
 const s=base();s.base=[1405,9,1];s.expenses=[record('paid',100,[1405,8,29],{settledOn:[1405,8,29]}),record('overdue',200,[1405,8,29])];s.spentItems=[record('old',80,[1405,8,30])];s.incomes=[record('unpaid',300,[1405,8,30])];
 a.equal(F.valid(s,[1405,9,2]),true);a.equal(F.actual(s,s.base),1000);a.equal(F.projected(s,s.base),1100);a.equal(F.actual(s,[1405,8,30]),null);
 const overdue=P.events(s).find(x=>x.id==='overdue');a.equal(P.ordinal(overdue.date),P.ordinal(s.base));a.equal(overdue.scheduledDate[1],8);
});
test('installments clamp each month using the original day, including year boundaries',()=>{
 let s=base();s.loans=[record('loan',10,[1405,6,31],{months:9})];const e=P.events(s);a.equal(e.length,9);a.equal(e[0].scheduledDate[2],31);a.equal(e[1].scheduledDate[2],30);a.equal(e[6].scheduledDate[2],29);a.equal(e[7].scheduledDate[2],31);a.equal(e[7].scheduledDate[0],1406);
 s=base();s.loans=[record('l',40,[1405,8,29],{months:3,paid:{'2':[1405,8,30]}})];a.equal(P.events(s).length,3);a.equal(F.actual(s,[1405,8,30]),960);a.equal(F.finalBalance(s).balance,880);
});
test('month totals and balances agree with independent end-of-month projections',()=>{
 const s=base();s.expenses=[record('cost',100,[1405,8,30])];s.incomes=[record('income',500,[1405,9,1])];s.spentItems=[record('old',200,s.base),record('food',50,[1405,8,29]),record('taxi',30,[1405,9,2])];s.loans=[record('l',60,[1405,9,3],{months:2})];
 for(const row of F.monthly(s,[1405,9,10]))a.equal(row.balance,F.projected(s,[row.year,row.month,P.days(row.year,row.month)]));
 const rows=F.monthly(s,[1405,9,10]);a.equal(rows[0].spending,50);a.equal(rows[0].expense,100);a.equal(rows[1].income,500);a.equal(rows[1].loan,60);a.equal(rows[1].spending,30);
});
test('malformed imports cannot create invalid amounts, duplicate IDs or phantom paid installments',()=>{
 for(const value of [null,[],{}, {...base(),expenses:[null]}, {...base(),expenses:[record('x',NaN,[1405,8,29])]}, {...base(),expenses:[record('x',10,[1405,8,29]),record('x',20,[1405,8,30])]}, {...base(),loans:[record('x',10,[1405,8,29],{months:2,paid:{'01':[1405,8,29]}})]}, {...base(),loans:[record('x',10,[1405,8,29],{months:2,paid:{'3':[1405,8,29]}})]}, {...base(),spentItems:[record('x',0,[1405,8,29])]}])a.equal(F.valid(value,[1405,8,30]),false);
 a.equal(F.valid({...base(),incomes:[record('i',20,[1405,8,30],{settledOn:[1405,9,1]})]},[1405,8,30]),false);
 a.equal(F.valid({...base(),spentItems:[record('future',20,[1405,9,1])]},[1405,8,30]),false);
});
test('calendar round trips across supported years, month ends and leap years',()=>{
 for(let y=1200;y<=1630;y++){let length=0;for(let m=1;m<=12;m++){const last=P.days(y,m);length+=last;for(const d of [1,last]){const date=[y,m,d];a.deepEqual(Array.from(P.parts(P.ordinal(date))),date)}}a.ok(length===365||length===366)}
 a.equal(P.days(1403,12),30);a.equal(P.days(1404,12),29);a.equal(P.ordinal([1404,1,1]),Math.floor(Date.UTC(2025,2,21)/86400000));
});
test('randomized oracle reconciles actual, forecast, final and monthly balances',()=>{
 let seed=74927;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};const integer=n=>Math.floor(random()*n);
 for(let n=0;n<400;n++){
  const s=base(),b=P.ordinal(s.base),oracle=[];s.savings=integer(5000);const date=offset=>Array.from(P.parts(b+offset));
  for(const [kind,type] of [['expenses','expense'],['incomes','income']])for(let i=0;i<8;i++){const scheduled=integer(35)-8,completed=random()<.5,actual=integer(40)-8,amount=integer(500)+1;const x=record(kind+i,amount,date(scheduled),completed?{settledOn:date(actual)}:{});s[kind].push(x);oracle.push({day:completed?b+actual:Math.max(b,b+scheduled),done:completed,amount:type==='income'?amount:-amount})}
  for(let i=0;i<4;i++){const x=record('loan'+i,integer(250)+1,date(integer(5)),{months:3,paid:{}});for(let j=0;j<3;j++){const scheduled=Array.from(P.month(x.date,j)),done=random()<.4,actual=integer(50)-5;if(done)x.paid[j+1]=date(actual);oracle.push({day:done?b+actual:Math.max(b,P.ordinal(scheduled)),done,amount:-x.amount})}s.loans.push(x)}
  for(let i=0;i<10;i++){const day=integer(65)-10,amount=integer(150)+1;s.spentItems.push(record('spent'+i,amount,date(day)));oracle.push({day:b+day,done:true,amount:-amount})}
  const expected=(day,actual)=>s.savings+oracle.reduce((sum,e)=>sum+(e.day<=day&&(!e.done||e.day>b)&&(!actual||e.done)?e.amount:0),0);
  for(const offset of [0,1,12,31,65]){a.equal(F.actual(s,date(offset)),expected(b+offset,true));a.equal(F.projected(s,date(offset)),expected(b+offset,false))}
  for(const g of P.forecast(s))a.equal(g.balance,expected(P.ordinal(g.date),false));const last=F.finalBalance(s);a.equal(last.balance,expected(P.ordinal(last.date),false));
  for(const row of F.monthly(s,date(65)))a.equal(row.balance,expected(P.ordinal([row.year,row.month,P.days(row.year,row.month)]),false));
 }
});
test('maximum valid scheduled amounts remain safe integers',()=>{
 const s=base();s.loans=Array.from({length:200},(_,i)=>record('l'+i,1e10,[1405,8,29],{months:360}));s.spentItems=Array.from({length:5000},(_,i)=>record('s'+i,1e10,[1405,8,30]));
 const groups=P.forecast(s);a.equal(P.events(s).length,77000);a.equal(groups.at(-1).balance,1000-72000*1e10-5000*1e10);a.ok(Number.isSafeInteger(groups.at(-1).balance));
});

test('shared financial snapshot agrees with standalone calculations and excludes received income and paid installments from remaining totals',()=>{
 const s=base();s.incomes=[record('received',300,[1405,8,29],{settledOn:[1405,8,29]}),record('pending',200,[1405,8,29])];s.loans=[record('loan',100,[1405,8,29],{months:3,paid:{'1':[1405,8,29]}})];
 const view=F.snapshot(s,[1405,8,30]);a.equal(view.actual,F.actual(s,[1405,8,30]));a.equal(view.final.balance,F.finalBalance(s).balance);a.equal(view.groups.at(-1).balance,view.final.balance);a.equal(view.pendingCount,1);a.equal(view.pendingAmount,200);a.equal(view.unpaidCount,2);a.equal(view.unpaidAmount,200);
});
