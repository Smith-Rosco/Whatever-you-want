// bundle.js
const loadScript = (src) => {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
};
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v2/StatefulChatInputWithOptions.js');
loadScript('https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v2/mode_select.js');

