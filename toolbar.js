(() => {
 const paths={receipt:'M5 3h14v18l-3-2-4 2-4-2-3 2zM8 7h8M8 11h8M8 15h4',more:'M4 12h.01M12 12h.01M20 12h.01',timeline:'M6 3v18M3 6h6M6 12h12M15 9l3 3-3 3M3 18h6',download:'M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5',upload:'M12 16V4m-4 4 4-4 4 4M4 16v5h16v-5',chart:'M4 3v18h17M8 16v-4m5 4V7m5 9V4',list:'M9 6h12M9 12h12M9 18h12M3 6h1m-1 6h1m-1 6h1',trash:'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',wallet:'M3 5h16v15H3zM3 5V3h13M15 10h6v6h-6zM17 13h1',home:'m3 11 9-8 9 8M5 9v12h14V9M9 21v-7h6v7',back:'m14 5-7 7 7 7M7 12h14'};
 document.querySelectorAll('.data-toolbar button,.data-toolbar a').forEach(button=>{const kind=button.id==='spending-navigation'?'receipt':button.id==='home-navigation'?'home':button.id==='more-open'?'more':button.id==='timeline-navigation'?'timeline':button.id==='export'?'download':button.id==='import'?'upload':button.id==='monthly-navigation'?'chart':button.id==='delete-all'?'trash':button.classList.contains('landing-entry')?'home':'list';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('class','toolbar-icon');svg.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',paths[kind]);svg.append(path);button.prepend(svg)});
 const dock=document.querySelector('.data-toolbar');
 const header=document.createElement('header');header.className='app-header';
 dock.parentNode.insertBefore(header,dock);header.append(dock);
 dock.querySelectorAll('button,a').forEach(button=>{
   const label=button.textContent.trim();
   button.setAttribute('aria-label',label);button.setAttribute('title',label);
   const text=document.createElement('span');text.className='toolbar-label';
   [...button.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).forEach(node=>text.append(node));
   button.append(text);
 });
 dock.setAttribute('role','navigation');dock.setAttribute('aria-label','عملیات برنامه');
 const mobile=window.matchMedia('(max-width:700px)');
 function measureDock(){document.documentElement.style.setProperty('--mobile-dock-height',mobile.matches?`${Math.ceil(dock.getBoundingClientRect().height)}px`:'0px');document.documentElement.style.setProperty('--desktop-header-height',mobile.matches?'0px':`${Math.ceil(header.getBoundingClientRect().height)}px`)}
 if('ResizeObserver' in window){const observer=new ResizeObserver(measureDock);observer.observe(dock);observer.observe(header)}
 mobile.addEventListener('change',measureDock);window.addEventListener('resize',measureDock);measureDock();
})();
