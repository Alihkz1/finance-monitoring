(() => {
  const normalize = value => value.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632));
  const persian = value => value.replace(/[0-9٠-٩]/g, c => '۰۱۲۳۴۵۶۷۸۹'[c.charCodeAt(0) >= 1632 ? c.charCodeAt(0) - 1632 : Number(c)]);
  const group = value => persian(value.replace(/\B(?=(\d{3})+(?!\d))/g, '٬'));
  for (const id of ['savings', 'daily', 'expense-amount', 'loan-amount', 'income-amount', 'edit-amount', 'actual-amount', 'scenario-amount', 'spent-amount']) {
    const input = document.getElementById(id);
    function format() {
      const before = input.value;
      const position = input.selectionStart ?? before.length;
      const digitsBefore = normalize(before.slice(0, position)).replace(/\D/g, '').length;
      const digits = normalize(before).replace(/\D/g, '');
      input.value = group(digits);
      let cursor = 0, count = 0;
      while (cursor < input.value.length && count < digitsBefore) {
        if (/\d/.test(normalize(input.value[cursor]))) count++;
        cursor++;
      }
      if (document.activeElement === input) input.setSelectionRange(cursor, cursor);
    }
    input.addEventListener('input', event => { if (!event.isComposing) format(); });
    input.addEventListener('compositionend', format);
    input.addEventListener('blur', format);
    input.addEventListener('focus', format);
    format();
  }
  function convert(input) {
    if (!input.matches('input:not([type=file]):not([type=checkbox]):not([type=radio])')) return;
    const value=persian(input.value);
    if(value===input.value)return;
    const start=input.selectionStart,end=input.selectionEnd,direction=input.selectionDirection;
    input.value=value;
    if(start!==null&&end!==null)input.setSelectionRange(start,end,direction||'none');
  }
  document.addEventListener('input', event => { if(!event.isComposing)convert(event.target); },true);
  document.addEventListener('compositionend', event => convert(event.target),true);
  document.addEventListener('focusin', event => convert(event.target),true);
  document.querySelectorAll('input').forEach(convert);
})();
