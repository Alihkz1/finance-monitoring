(() => {
  const requested = new URLSearchParams(location.search).get('page');
  const path = location.pathname;
  // A route owns its view; a query parameter cannot activate a second page.
  const active = /^\/timeline(?:\/|$)/.test(path) ? 'timeline'
    : /^\/spending(?:\/|$)/.test(path) ? 'spending'
    : ['records', 'timeline', 'spending'].includes(requested) ? requested
    : 'dashboard';
  const dashboard = active === 'dashboard';
  document.querySelector('.overview').hidden = !dashboard;
  document.querySelector('.layout').hidden = active !== 'records';
  for (const page of ['records', 'timeline', 'spending']) {
    document.getElementById(page + '-page').hidden = active !== page;
  }
  const filterPanel = document.getElementById('filter-controls');
  if (filterPanel) filterPanel.hidden = false;
  const records = document.getElementById('records-navigation');
  records.href = '/app/index.html?page=records';
  records.textContent = 'رویداد ها';
  const recordsBack = document.querySelector('.records-page-heading .page-link');
  if (recordsBack) recordsBack.hidden = true;
  const navigation = active === 'dashboard' ? 'home' : active;
  document.getElementById(navigation + '-navigation').setAttribute('aria-current', 'page');
  const titles = {
    dashboard: 'داشبورد', records: 'رویداد ها', timeline: 'تایم لاین',
    spending: 'خرج‌های انجام‌شده',
  };
  document.title = titles[active] + ' | کش زیاد';
})();
