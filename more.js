(() => {
 const trigger=document.getElementById('more-open'),menu=document.getElementById('more-menu');
 let opened=false;
 const native=typeof menu.showPopover==='function';
 if(!native)menu.hidden=true;
 function place(){const r=trigger.getBoundingClientRect(),mobile=matchMedia('(max-width:700px)').matches;menu.style.left=Math.max(12,Math.min(r.right-220,innerWidth-232))+'px';menu.style.top=(mobile?Math.max(12,r.top-menu.offsetHeight-12):Math.min(r.bottom+10,innerHeight-menu.offsetHeight-12))+'px'}
 function close(restore=false){if(!opened)return;opened=false;if(native)menu.hidePopover();else menu.hidden=true;trigger.setAttribute('aria-expanded','false');if(restore)trigger.focus({preventScroll:true})}
 function open(){if(opened){close();return}if(native)menu.showPopover();else menu.hidden=false;opened=true;trigger.setAttribute('aria-expanded','true');place();menu.querySelector('[role=menuitem]').focus({preventScroll:true})}
 trigger.onclick=open;
 document.addEventListener('pointerdown',e=>{if(opened&&!menu.contains(e.target)&&!trigger.contains(e.target))close()});
 menu.addEventListener('click',e=>{if(e.target.closest('[role=menuitem]'))close()},true);
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();close(true)}if(e.key==='Tab')close();if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const buttons=[...menu.querySelectorAll('[role=menuitem]')],index=buttons.indexOf(document.activeElement),next=e.key==='Home'?0:e.key==='End'?buttons.length-1:(index+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length;buttons[next].focus()}});
 window.addEventListener('resize',()=>close());window.addEventListener('scroll',()=>close(),{passive:true});
 for(const [id,d] of [['import','M12 16V4m-4 4 4-4 4 4M4 16v5h16v-5'],['export','M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5'],['delete-all','M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15']]){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','toolbar-icon');svg.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',d);svg.append(path);document.getElementById(id).prepend(svg)}
})();
