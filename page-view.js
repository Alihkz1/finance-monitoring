(() => {
  const page = new URLSearchParams(location.search).get('page');
  const recordsPage = page === 'records';
  const monthlyPage = page === 'monthly';
  const subpage = recordsPage || monthlyPage;

  // The search/filter panel is commented out in index.html, so every lookup of
  // its controls must stay optional instead of throwing on null.
  const filterPanel = document.getElementById('filter-controls');
  if (filterPanel) filterPanel.hidden = monthlyPage;

  document.getElementById('actual-records-panel').hidden = !recordsPage;

  const navigation = document.querySelector('.data-toolbar > .page-link');
  navigation.href = subpage ? '/app/index.html' : '/app/index.html?page=records';
  navigation.textContent = subpage ? 'بازگشت به برنامه‌ریز' : 'اطلاعات ثبت‌شده';

  document.getElementById('monthly-navigation').hidden = monthlyPage;

  const recordsBack = document.querySelector('.records-page-heading .page-link');
  if (recordsBack) recordsBack.hidden = true;

  document.querySelector('.today-panel').hidden = subpage;
  document.querySelector('.overview').hidden = subpage;
  document.querySelector('.layout').hidden = subpage;
  document.getElementById('records-page').hidden = !recordsPage;
  document.getElementById('monthly-page').hidden = !monthlyPage;
  document.title = monthlyPage ? 'گزارش ماهانه | مانده' : recordsPage ? 'اطلاعات ثبت‌شده | مانده' : 'مانده | برنامه‌ریز پس‌انداز';
})();
