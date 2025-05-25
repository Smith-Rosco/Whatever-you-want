// bundle.js
const loadScript = (src) => {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
};

const loadStylesheet = (href) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
};


loadStylesheet('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/style_v1.1.css');
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/DOMWatcherService.js');
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/input_v1.1.js');
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/simplify_v1.1.js');
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/sidebar_v1.2.js');
