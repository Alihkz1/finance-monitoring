(() => {
  const recordsPage = new URLSearchParams(location.search).get('page') === 'records';
  const monthlyPage = new URLSearchParams(location.search).get('page') === 'monthly';
  document.getElementById('filter-controls').hidden = monthlyPage;
  document.getElementById('actual-records-panel').hidden = !recordsPage;
  const subpage = recordsPage || monthlyPage;
  const navigation = document.querySelector('.data-toolbar > .page-link');
  navigation.href = subpage ? 'index.html' : 'index.html?page=records';
  navigation.textContent = subpage ? 'بازگشت به برنامه‌ریز' : 'اطلاعات ثبت‌شده';
  document.getElementById('monthly-navigation').hidden = monthlyPage;
  document.querySelector('.records-page-heading .page-link').hidden = true;
  document.querySelector('.today-panel').hidden = subpage;
  document.querySelector('.overview').hidden = subpage;
  document.querySelector('.layout').hidden = subpage;
  document.getElementById('records-page').hidden = !recordsPage;
  document.getElementById('monthly-page').hidden = !monthlyPage;
  document.title = monthlyPage ? 'گزارش ماهانه | مانده' : recordsPage ? 'اطلاعات ثبت‌شده | مانده' : 'مانده | برنامه‌ریز پس‌انداز';
})();
