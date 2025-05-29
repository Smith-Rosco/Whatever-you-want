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
                        await this.withTimeout(this.loadStylesheet(item.src), this.timeout);
                    } else {
                        const isModule = item.type === 'module';
                        await this.withTimeout(this.loadScript(item.src, isModule), this.timeout);
                    }

                    if (item.check && typeof item.check === 'function') {
                        if (!item.check()) throw new Error(`资源校验失败: ${item.src}`);
                    }

                    this.loadedResources.add(item.src);
                    console.log(`✔ 已加载: ${item.src}`);
                } catch (err) {
                    console.error(`✖ 加载失败: ${item.src}`, err);
                    throw err;
                }
            }
            console.log('✅ 所有资源加载完成');
        }

        loadScript(src, isModule = false) {
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = src;
                if (isModule) s.type = 'module';
                s.onload = () => resolve(s);
                s.onerror = () => reject(new Error(`脚本加载失败: ${src}`));
                document.head.appendChild(s);
            });
        }

        loadStylesheet(href) {
            return new Promise((resolve, reject) => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.onload = () => resolve(link);
                link.onerror = () => reject(new Error(`样式表加载失败: ${href}`));
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
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.2/style.css', type: 'style' },
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.2/DOMWatcherService.js', type: 'script', check: () => !!window.DOMWatcherService },
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.2/input.js', type: 'script' },
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.2/simplify.js', type: 'script' },
        { src: 'https://cdn.jsdelivr.net/gh/Smith-Rosco/Whatever-you-want/v3.2/sidebar.js', type: 'script' },
    ];

    // 自动执行
    (async () => {
        const loader = new ResourceLoader({ timeout: 10000 });
        try {
            await loader.load(resources);
            console.log('🎉 所有资源加载并初始化完成');
        } catch (e) {
            console.error('❌ 资源初始化失败:', e);
        }
    })();
})();
