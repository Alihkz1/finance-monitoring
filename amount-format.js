(() => {
  const normalize = value => value.replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 1776)).replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632));
  const group = value => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  for (const id of ['savings', 'daily', 'expense-amount', 'loan-amount', 'income-amount']) {
    const input = document.getElementById(id);
    function format() {
      const before = input.value;
      const position = input.selectionStart ?? before.length;
      const digitsBefore = normalize(before.slice(0, position)).replace(/\D/g, '').length;
      const digits = normalize(before).replace(/\D/g, '');
      input.value = group(digits);
      let cursor = 0, count = 0;
      while (cursor < input.value.length && count < digitsBefore) {
        if (/\d/.test(input.value[cursor])) count++;
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
})();
