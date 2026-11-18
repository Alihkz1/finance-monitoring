(() => {
  const recordsPage = new URLSearchParams(location.search).get('page') === 'records';
  const navigation = document.querySelector('.data-toolbar .page-link');
  navigation.href = recordsPage ? 'index.html' : 'index.html?page=records';
  navigation.textContent = recordsPage ? 'بازگشت به برنامه‌ریز' : 'اطلاعات ثبت‌شده';
  document.querySelector('.records-page-heading .page-link').hidden = true;
  document.querySelector('.today-panel').hidden = recordsPage;
  document.querySelector('.overview').hidden = recordsPage;
  document.querySelector('.layout').hidden = recordsPage;
  document.getElementById('records-page').hidden = !recordsPage;
  document.title = recordsPage ? 'اطلاعات ثبت‌شده | مانده' : 'مانده | برنامه‌ریز پس‌انداز';
})();
