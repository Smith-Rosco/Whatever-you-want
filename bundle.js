// bundle.js
const loadScript = (src) => {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
};

const loadCSS = (href) => {
  const l = document.createElement('link');
  l.rel = 'stylesheet';
  l.href = href;
  document.head.appendChild(l);
};

loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/auto_complete.js');
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/simplify_v2.0.js');
loadCSS('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/style.css');
