(() => {
  let active = null, menu = null;
  function close(restore = false) {
    if (active) { active.setAttribute('aria-expanded', 'false'); if (restore) active.focus(); }
    menu?.remove(); menu = null; active = null;
  }
  function place() {
    if (!active || !menu) return;
    const r = active.getBoundingClientRect();
    menu.style.top = `${r.bottom + 7}px`;
    menu.style.left = `${Math.max(8, Math.min(r.left, innerWidth - r.width - 8))}px`;
    menu.style.width = `${r.width}px`;
  }
  function open(select) {
    if (active === select) { close(); return; }
    close(); active = select; select.setAttribute('aria-expanded', 'true');
    menu = document.createElement('div');
    menu.className = 'date-options'; menu.setAttribute('role', 'listbox');
    menu.setAttribute('aria-label', select.getAttribute('aria-label') || 'تاریخ');
    menu.id = 'open-date-options'; select.setAttribute('aria-controls', menu.id);
    [...select.options].forEach(option => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = option.text;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(option.selected));
      button.tabIndex = option.selected ? 0 : -1;
      button.onclick = () => {
        const field = select.parentElement, index = [...field.children].indexOf(select);
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        close(); field.children[index]?.focus();
      };
      menu.append(button);
    });
    document.body.append(menu); place();
    const selected = menu.querySelector('[aria-selected="true"]');
    menu.scrollTop = selected.offsetTop - menu.clientHeight / 2 + selected.offsetHeight / 2;
    selected.focus({ preventScroll: true });
    menu.onkeydown = event => {
      const buttons = [...menu.children];
      let index = buttons.indexOf(document.activeElement);
      if (event.key === 'Escape' || event.key === 'Tab') { close(event.key === 'Escape'); return; }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      index = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
      buttons[index].focus();
    };
  }
  document.addEventListener('pointerdown', event => {
    const select = event.target.closest('.date-picker select');
    if (select) { event.preventDefault(); open(select); }
    else if (menu && !menu.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => {
    if (event.target.matches('.date-picker select') && ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); open(event.target); }
  });
  window.addEventListener('resize', close);
  window.addEventListener('scroll', event => { if (menu && !menu.contains(event.target)) close(); }, true);
})();
