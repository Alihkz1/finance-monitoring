(() => {
 window.addEventListener('storage',event=>{
   if(event.key!==key&&event.key!==null)return;
   try{
     const raw=localStorage.getItem(key);
     if(raw===storageVersion)return;
     const next=raw?normalize(JSON.parse(raw)):{savings:0,base:tehranToday(),expenses:[],loans:[],incomes:[]};
     if(!valid(next)){toast('اطلاعات صفحهٔ دیگر معتبر نیست؛ اطلاعات فعلی تغییر نکرد.',true);return}
     storageVersion=raw;loadFailed=false;state=next;visible=30;render();
     toast('اطلاعات با تغییرات صفحهٔ دیگر به‌روز شد.');
   }catch{toast('خواندن تغییرات صفحهٔ دیگر ممکن نیست.',true)}
 });
})();
