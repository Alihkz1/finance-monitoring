(() => {
  const recordsPage = new URLSearchParams(location.search).get('page') === 'records';
  document.querySelector('.overview').hidden = recordsPage;
  document.querySelector('.layout').hidden = recordsPage;
  document.getElementById('records-page').hidden = !recordsPage;
  document.title = recordsPage ? 'اطلاعات ثبت‌شده | مانده' : 'مانده | برنامه‌ریز پس‌انداز';
})();
