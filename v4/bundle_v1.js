// bundle.js

(() => {
    class ResourceLoader {
        constructor({ timeout = 15000 } = {}) {
            this.loadedResources = new Set();
            this.timeout = timeout;
        }

        async load(resources = []) {
            for (const item of resources) {
                try {
                    if (this.loadedResources.has(item.src)) continue;

                    if (item.type === 'style') {
                        await this.withTimeout(this.loadStylesheet(item), this.timeout);
                    } else {
                        await this.withTimeout(this.loadScript(item), this.timeout);
                    }

                    if (item.check && typeof item.check === 'function') {
                        if (!item.check()) throw new Error(`资源校验失败: ${item.src}`);
                    }

                    this.loadedResources.add(item.src);
                    console.log(`✔ 已加载: ${item.src}`);
                } catch (err) {
                    console.error(`✖ 加载失败: ${item.src}`, err);
                    throw err; // Re-throw to stop further loading if one fails
                }
            }
            console.log('✅ 所有资源加载完成');
        }

        loadScript(item) { // item now contains src, type, and optional attributes
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = item.src;
                if (item.type === 'module') s.type = 'module';

                // Apply additional attributes if provided
                if (item.attributes) {
                    for (const attr in item.attributes) {
                        if (Object.prototype.hasOwnProperty.call(item.attributes, attr)) {
                            s.setAttribute(attr, item.attributes[attr]);
                        }
                    }
                }

                s.onload = () => resolve(s);
                s.onerror = () => reject(new Error(`脚本加载失败: ${item.src}`));
                document.head.appendChild(s);
            });
        }

        loadStylesheet(item) { // item now contains src, type, and optional attributes
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = item.src;

                // Apply additional attributes if provided
                if (item.attributes) {
                    for (const attr in item.attributes) {
                        // Make sure to use the correct attribute name (e.g., referrerpolicy, not referrerPolicy)
                        if (Object.prototype.hasOwnProperty.call(item.attributes, attr)) {
                            link.setAttribute(attr, item.attributes[attr]);
                        }
                    }
                }

                link.onload = () => resolve(link);
                link.onerror = () => reject(new Error(`样式表加载失败: ${item.src}`));
                document.head.appendChild(link);
            });
        }

        withTimeout(promise, ms) {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('加载超时')), ms))
            ]);
        }
    }

    // 默认资源配置
    const resources = [
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v4/style.css', type: 'style' },
        { // 新增 Font Awesome 样式表
            src: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
            type: 'style',
            attributes: {
                integrity: "sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg==",
                crossorigin: "anonymous",
                referrerpolicy: "no-referrer" // 注意这里是 referrerpolicy
            }
        },
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v4/DOMWatcherService.js', type: 'script', check: () => !!window.DOMWatcherService },
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v4/inputArea.js', type: 'script' },
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v4/simplify.js', type: 'script' },
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v4/sideBar.js', type: 'script' },
    ];

    // 自动执行
    (async () => {
        const loader = new ResourceLoader({ timeout: 10000 }); // 保持原有超时设置
        try {
            await loader.load(resources);
            console.log('🎉 所有资源加载并初始化完成');
        } catch (e) {
            console.error('❌ 资源初始化失败:', e);
        }
    })();
})();