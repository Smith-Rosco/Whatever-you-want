// bundle.js
const loadScript = (src) => {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
};
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v2/StatefulChatInputWithOptions_v1.3.js');
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v2/simplify_v1.3.js');

