// bundle.js
const loadScript = (src) => {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
};
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/StatefulChatInputWithOptions_v1.js');
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/simplify_v2.0.js');

