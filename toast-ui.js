function toast(text, error = false) {
  const container=document.getElementById('toast');
  clearTimeout(window.tt);
  const duration=error?8000:4500;
  function dismiss(){clearTimeout(window.tt);if(container.matches(':popover-open'))container.hidePopover();container.hidden=true}
  function schedule(){clearTimeout(window.tt);window.tt=setTimeout(dismiss,duration)}
  container.className='toast toast-standard '+(error?'toast-error':'toast-success');
  container.setAttribute('role',error?'alert':'status');container.setAttribute('aria-live',error?'assertive':'polite');container.setAttribute('aria-atomic','true');
  const icon=document.createElement('span');icon.className='toast-symbol';icon.setAttribute('aria-hidden','true');icon.textContent=error?'!':'✓';
  const content=document.createElement('div');content.className='toast-content';const heading=document.createElement('strong');heading.textContent=error?'نیاز به بررسی':'انجام شد';const message=document.createElement('p');message.textContent=text;content.append(heading,message);
  const close=document.createElement('button');close.type='button';close.className='toast-close';close.setAttribute('aria-label','بستن پیام');close.textContent='×';close.onclick=dismiss;
  container.replaceChildren(icon,content,close);container.hidden=false;
  if(typeof container.showPopover==='function'){container.setAttribute('popover','manual');if(container.matches(':popover-open'))container.hidePopover();container.showPopover()}
  container.onmouseenter=()=>clearTimeout(window.tt);container.onmouseleave=schedule;container.onfocusin=()=>clearTimeout(window.tt);container.onfocusout=schedule;schedule();
}
