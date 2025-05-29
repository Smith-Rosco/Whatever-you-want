// bundle.js (改造后)

const loadScript = (src, isModule = false) => {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        if (isModule) {
            s.type = 'module'; // 支持加载 ES 模块
        } else {
            // 对于传统脚本，为了确保顺序执行，不应该使用 async = true
            // defer 属性可以让脚本在文档解析后按顺序执行
            // 但如果我们希望通过 Promise 精确控制，就不需要 defer 或 async
            // s.async = false; // 明确设置为 false 或移除 async 属性
        }
        // s.async = false; // 如果不使用 isModule 并且脚本不是 module 类型，确保顺序
                         // 默认 script 就是同步阻塞加载的，除非你用 async/defer
                         // 对于动态创建的脚本，默认是异步的。要同步，需设 async = false

        s.onload = () => {
            console.log(`脚本加载成功: ${src}`);
            resolve(s); // 成功时解决 Promise
        };
        s.onerror = () => {
            console.error(`脚本加载失败: ${src}`);
            reject(new Error(`脚本加载失败: ${src}`)); // 失败时拒绝 Promise
        };
        document.head.appendChild(s);
    });
};

const loadStylesheet = (href) => {
    // 样式表加载通常是非阻塞的，并且浏览器会处理应用，所以可以保持简单
    // 但如果需要知道它何时加载完成（例如，某些依赖样式的JS计算），也可以Promise化
    return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => {
            console.log(`样式表加载成功: ${href}`);
            resolve(link);
        };
        link.onerror = () => {
            console.error(`样式表加载失败: ${href}`);
            reject(new Error(`样式表加载失败: ${href}`));
        };
        document.head.appendChild(link);
    });
};

// 示例：配置化加载
const scriptsToLoad = [
    { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/DOMWatcherService.js', type: 'script' },
    { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/style_v1.2.css', type: 'style' },
    // 假设 input_v1.1.js 是 ES 模块
    { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/input_v1.1.js', type: 'module' },
    { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/simplify_v1.2.js', type: 'script' },
    { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.1/sidebar_v1.2.js', type: 'script' },
];

(async () => {
    try {
        for (const item of scriptsToLoad) {
            if (item.type === 'style') {
                await loadStylesheet(item.src);
            } else if (item.type === 'script') {
                await loadScript(item.src, false);
            } else if (item.type === 'module') {
                await loadScript(item.src, true);
            }
            // 可以在这里加入对 window.DOMWatcherService 等关键对象的检查
            if (item.src.includes('DOMWatcherService.js') && !window.DOMWatcherService) {
                 throw new Error('DOMWatcherService 加载后仍然不可用！');
            }
        }
        console.log('所有配置的资源已按顺序加载完毕。');
    } catch (error) {
        console.error('资源加载过程中发生严重错误:', error);
    }
})();