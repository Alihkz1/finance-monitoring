(() => {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const layer = document.createElement('div');
  layer.className = 'shooting-stars';
  layer.setAttribute('aria-hidden', 'true');
  document.body.prepend(layer);
  const colors = ['#b4ceff', '#b7a0ff', '#f4b7dc', '#9ce9db', '#f4d391'];
  let timer;
  let lastColor = -1;
  function stop() {
    clearTimeout(timer);
    layer.replaceChildren();
  }
  function schedule() {
    clearTimeout(timer);
    if (document.hidden || preference.matches) return;
    timer = setTimeout(() => {
      if (document.hidden || preference.matches) return;
      const star = document.createElement('span');
      star.className = 'shooting-star';
      const color = (lastColor + 1 + Math.floor(Math.random() * (colors.length - 1))) % colors.length;
      lastColor = color;
      star.style.setProperty('--star-color', colors[color]);
      star.style.setProperty('--x', `${-25 + Math.random() * 100}vw`);
      star.style.setProperty('--y', `${Math.random() * 48}vh`);
      star.style.setProperty('--duration', `${1.3 + Math.random() * .6}s`);
      star.addEventListener('animationend', () => star.remove(), { once: true });
      layer.append(star);
      schedule();
    }, 2800 + Math.random() * 3200);
  }
  function sync() { stop(); schedule(); }
  document.addEventListener('visibilitychange', sync);
  preference.addEventListener('change', sync);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  schedule();
})();
