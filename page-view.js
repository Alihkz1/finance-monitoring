(() => {
  const page = new URLSearchParams(location.search).get('page');
  const recordsPage = page === 'records';
  const monthlyPage = false; // گزارش ماهانه فعلاً غیرفعال است
  const timelinePage = /^\/timeline(?:\/|$)/.test(location.pathname) || page === 'timeline';
  const spendingPage=/^\/spending(?:\/|$)/.test(location.pathname)||page==='spending';
  const subpage = recordsPage || monthlyPage || timelinePage || spendingPage;

  // The search/filter panel is commented out in index.html, so every lookup of
  // its controls must stay optional instead of throwing on null.
  const filterPanel = document.getElementById('filter-controls');
  if (filterPanel) filterPanel.hidden = monthlyPage;

  document.getElementById('actual-records-panel').hidden = !recordsPage;

  const navigation = document.getElementById('records-navigation');
  navigation.href = '/app/index.html?page=records';
  navigation.textContent = 'اطلاعات ثبت‌شده';



  const recordsBack = document.querySelector('.records-page-heading .page-link');
  if (recordsBack) recordsBack.hidden = true;

  document.querySelector('.today-panel').hidden = subpage;
  document.querySelector('.overview').hidden = subpage;
  document.querySelector('.layout').hidden = subpage;
  document.getElementById('records-page').hidden = !recordsPage;

  document.getElementById('timeline-page').hidden = !timelinePage;
  document.getElementById('spending-page').hidden=!spendingPage;
  if(spendingPage)document.getElementById('spending-navigation').setAttribute('aria-current','page');
  if(!subpage)document.getElementById('home-navigation').setAttribute('aria-current','page');
  if(recordsPage)navigation.setAttribute('aria-current','page');
  if(timelinePage)document.getElementById('timeline-navigation').setAttribute('aria-current','page');
  document.title = spendingPage ? 'خرج‌های انجام‌شده | کش زیاد' : timelinePage ? 'مسیر مالی | کش زیاد' : monthlyPage ? 'گزارش ماهانه | کش زیاد' : recordsPage ? 'اطلاعات ثبت‌شده | کش زیاد' : 'کش زیاد | برنامه‌ریز پس‌انداز';
})();
