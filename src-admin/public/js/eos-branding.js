(() => {
    'use strict';

    const BRAND = 'NexoWatt EOS';
    const BRAND_LONG = 'NexoWatt EOS - Energy Operation System';
    const LOGO = 'img/eos/eos-logo.svg';
    const PNG_LOGO = 'img/eos/nexowatt-192.png';

    const replaceBrand = value => {
        if (!value || typeof value !== 'string') return value;
        const replaced = value
            .replace(/ioBroker\.admin/g, BRAND)
            .replace(/ioBroker admin/gi, BRAND)
            .replace(/ioBroker/gi, BRAND);
        // Only replace the standalone generic product label. Do not turn
        // 'NexoWatt EOS Admin' into 'NexoWatt EOS NexoWatt EOS'.
        return replaced.trim().toLowerCase() === 'admin' ? replaced.replace(/admin/i, BRAND) : replaced;
    };

    const skipNode = node => {
        const parent = node && node.parentElement;
        if (!parent) return true;
        const tag = parent.tagName;
        return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'CODE' || tag === 'PRE';
    };

    const replaceTextNodes = root => {
        try {
            const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
            const nodes = [];
            while (walker.nextNode()) nodes.push(walker.currentNode);
            for (const node of nodes) {
                if (skipNode(node)) continue;
                const next = replaceBrand(node.nodeValue);
                if (next !== node.nodeValue) node.nodeValue = next;
            }
        } catch (e) {
            // keep admin functional even if a browser extension injects an unsupported node
        }
    };

    const patchAttributes = root => {
        const scope = root && root.querySelectorAll ? root : document;
        const elements = scope.querySelectorAll('[title],[aria-label],[alt],[placeholder],img');
        elements.forEach(el => {
            ['title', 'aria-label', 'alt', 'placeholder'].forEach(attr => {
                if (el.hasAttribute && el.hasAttribute(attr)) {
                    const oldValue = el.getAttribute(attr);
                    const newValue = replaceBrand(oldValue);
                    if (newValue !== oldValue) el.setAttribute(attr, newValue);
                }
            });

            if (el.tagName === 'IMG') {
                const src = el.getAttribute('src') || '';
                const alt = el.getAttribute('alt') || '';
                if (/admin\.svg|admin\.png|no-image\.svg|logo192\.png|iobroker/i.test(src) || /iobroker|admin/i.test(alt)) {
                    if (!/adapter|custom|upload/i.test(src)) {
                        el.setAttribute('src', LOGO);
                        el.setAttribute('alt', BRAND);
                    }
                }
            }
        });
    };

    const patchDocument = () => {
        document.title = BRAND_LONG;
        const theme = document.querySelector('meta[name="theme-color"]');
        if (theme) theme.setAttribute('content', '#020914');
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', BRAND_LONG);

        const path = window.location.href.toLowerCase();
        const isLogin = path.includes('login') || !!document.querySelector('#username, #password');
        document.documentElement.classList.toggle('eos-login', isLogin);
        document.documentElement.classList.toggle('eos-loading', !document.body || !document.querySelector('#root > *'));

        // Give the app bar a stable EOS label without touching upstream React state.
        const toolbar = document.querySelector('header .MuiToolbar-root, .MuiAppBar-root .MuiToolbar-root');
        if (toolbar && !toolbar.querySelector('.eos-brand-badge')) {
            const badge = document.createElement('span');
            badge.className = 'eos-brand-badge';
            badge.textContent = BRAND;
            toolbar.insertBefore(badge, toolbar.firstChild ? toolbar.firstChild.nextSibling : null);
        }

        // Make login defaults EOS-branded if placeholders were not replaced by instance settings.
        window.loginTitle = (!window.loginTitle || String(window.loginTitle).includes('loginTitle')) ? BRAND : replaceBrand(window.loginTitle);
        window.loginMotto = (!window.loginMotto || String(window.loginMotto).includes('loginMotto')) ? 'Energy Operation System' : replaceBrand(window.loginMotto);
        if (!window.loginLogo || String(window.loginLogo).includes('loginLogo')) window.loginLogo = PNG_LOGO;
        window.loginLink = (!window.loginLink || String(window.loginLink).includes('loginLink')) ? '#' : window.loginLink;

        replaceTextNodes(document.body || document.documentElement);
        patchAttributes(document.body || document.documentElement);
    };

    const installObserver = () => {
        const observer = new MutationObserver(mutations => {
            let needsPatch = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE) {
                            needsPatch = true;
                            break;
                        }
                    }
                } else if (mutation.type === 'attributes') {
                    needsPatch = true;
                }
                if (needsPatch) break;
            }
            if (needsPatch) window.requestAnimationFrame(patchDocument);
        });
        observer.observe(document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['title', 'aria-label', 'alt', 'placeholder', 'src'],
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            patchDocument();
            installObserver();
        });
    } else {
        patchDocument();
        installObserver();
    }
    window.addEventListener('load', patchDocument);
    setInterval(patchDocument, 2500);
})();
