(() => {
 function updateDay(){const next=tehranToday();if(P.ordinal(next)!==P.ordinal(today)){today=next;render()}}
 window.addEventListener('pageshow',updateDay);
 window.addEventListener('focus',updateDay);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateDay()});
 let timer;
 function schedule(){clearTimeout(timer);timer=setTimeout(()=>{updateDay();schedule()},15000)}
 window.addEventListener('pagehide',()=>clearTimeout(timer));
 window.addEventListener('pageshow',schedule);
 document.addEventListener('submit',updateDay,true);
 updateDay();schedule();
})();
