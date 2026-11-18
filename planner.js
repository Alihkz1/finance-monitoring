const P = (() => {
 const fmt=new Intl.DateTimeFormat('en-u-ca-persian',{timeZone:'UTC',year:'numeric',month:'numeric',day:'numeric'}),starts=new Map();
 function parts(n){const p=Object.fromEntries(fmt.formatToParts(new Date(n*86400000)).map(x=>[x.type,x.value]));return [+p.year,+p.month,+p.day]}
 function start(y){if(!starts.has(y)){let n=Math.floor(Date.UTC(y+621,2,15)/86400000);while(parts(n)[0]<y)n++;starts.set(y,n)}return starts.get(y)}
 function days(y,m){return m<=6?31:m<12?30:start(y+1)-start(y)-336}
 function ordinal(a){return start(a[0])+(a[1]<=6?(a[1]-1)*31:186+(a[1]-7)*30)+a[2]-1}
 function month(a,i){const t=a[0]*12+a[1]-1+i,y=Math.floor(t/12),m=t%12+1;return [y,m,Math.min(a[2],days(y,m))]}
 function events(s){const e=[];for(const [key,type] of [['expenses','expense'],['incomes','income']])for(const x of s[key]||[])e.push({...x,type,scheduledDate:x.date,date:x.settledOn||x.date,completed:!!x.settledOn});s.loans.forEach(x=>{for(let i=0;i<x.months;i++){const scheduledDate=month(x.date,i),paid=x.paid?.[i+1];e.push({...x,date:paid||scheduledDate,scheduledDate,completed:!!paid,installment:i+1,type:'bank'})}});return e.sort((a,b)=>ordinal(a.date)-ordinal(b.date))}
 function forecast(s){const groups=[];let net=0;for(const e of events(s)){const ord=ordinal(e.date);let group=groups.at(-1);if(!group||ordinal(group.date)!==ord){group={date:e.date,items:[]};groups.push(group)}net+=e.type==='income'?e.amount:-e.amount;group.items.push(e);group.daily=Finance.dailyCost(s,ordinal(s.base),ord);group.balance=s.savings+net-group.daily}return groups}
 return {parts,days,ordinal,events,forecast};
})();
