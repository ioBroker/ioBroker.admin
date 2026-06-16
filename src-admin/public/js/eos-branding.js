(() => {
    'use strict';

    const BRAND = 'NexoWatt EOS';
    const BRAND_LONG = 'NexoWatt EOS - Energy Operation System';
    const LOGO = 'img/eos/eos-logo.svg';
    const PNG_LOGO = 'img/eos/nexowatt-192.png';
    const LOGIN_MOTTO = 'NexoWatt · Independent. Transparent. Fair.';

    const TEXT_REPLACEMENTS = [
        [/NexoWatt\s+Energy\s+Management\s+System/gi, BRAND],
        [/NexoWatt\s+Energy\s+Managementsystem/gi, BRAND],
        [/Energy\s+Management\s+System/gi, 'Energy Operation System'],
        [/Energy\s+Managementsystem/gi, 'Energy Operation System'],
        [/\bioBroker\.admin\b/g, BRAND],
        [/\bioBroker admin\b/gi, BRAND],
        [/\bioBroker\b/gi, BRAND],
    ];

    const EXACT_LABELS = new Map(Object.entries({
        'Admin': BRAND,
        'NEXOWATT': 'NEXOWATT EOS',
        'NexoWatt EMS': 'EOS Cockpit',
        'Übersicht': 'Cockpit',
        'Overview': 'Cockpit',
        'Adapter': 'Module',
        'Adapters': 'Module',
        'Instanzen': 'Dienste',
        'Instances': 'Dienste',
        'Objekte': 'Datenpunkte',
        'Objects': 'Datenpunkte',
        'Kategorien': 'Struktur',
        'Categories': 'Struktur',
        'Protokolle': 'Systemlogs',
        'Logs': 'Systemlogs',
        'Benutzer': 'Zugänge & Rechte',
        'Users': 'Benutzerkonten',
        'Groups': 'Rollen',
        'In groups': 'Zugeordnete Rollen',
        'Permissions': 'Rechte',
        'Permission': 'Recht',
        'User parameters': 'Benutzerkonto bearbeiten',
        'Group parameters': 'Rolle & Rechte bearbeiten',
        'Main': 'Stammdaten',
        'Hosts': 'System-Hosts',
        'Files': 'Dateien',
        'Backup': 'Sicherung',
        'xtrem': 'Konsole',
        'xterm': 'Konsole',
        'ra_Logout': 'Abmelden',
        'Logout': 'Abmelden',
    }));

    const replaceBrand = value => {
        if (!value || typeof value !== 'string') return value;
        let next = value;
        for (const [pattern, replacement] of TEXT_REPLACEMENTS) next = next.replace(pattern, replacement);
        const compact = next.trim();
        if (EXACT_LABELS.has(compact)) {
            next = next.replace(compact, EXACT_LABELS.get(compact));
        }
        return next;
    };

    const skipNode = node => {
        const parent = node && node.parentElement;
        if (!parent) return true;
        const tag = parent.tagName;
        return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'CODE' || tag === 'PRE';
    };

    const replaceTextNodes = root => {
        try {
            if (!root) return;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            const nodes = [];
            while (walker.nextNode()) nodes.push(walker.currentNode);
            for (const node of nodes) {
                if (skipNode(node)) continue;
                const before = node.nodeValue;
                const after = replaceBrand(before);
                if (after !== before) node.nodeValue = after;
            }
        } catch (e) {
            // The skin must never break the Admin runtime.
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

    const forceLoginGlobals = () => {
        window.loginTitle = BRAND;
        window.loginMotto = LOGIN_MOTTO;
        window.loginLogo = PNG_LOGO;
        window.loginLink = '#';
        window.loginHideLogo = 'false';
    };

    const logout = () => {
        try {
            ['App.refreshToken', 'App.accessToken', 'App.token', 'tokens', 'iobroker.admin.token'].forEach(key => {
                window.localStorage && window.localStorage.removeItem(key);
                window.sessionStorage && window.sessionStorage.removeItem(key);
            });
        } catch (e) {
            // ignore storage restrictions
        }
        const origin = `${window.location.pathname}${window.location.search}${window.location.hash || ''}`;
        window.location.href = `./logout?origin=${encodeURIComponent(origin)}`;
    };

    const ensureBrandBadge = toolbar => {
        if (!toolbar || toolbar.querySelector('.eos-brand-badge')) return;
        const badge = document.createElement('span');
        badge.className = 'eos-brand-badge';
        badge.textContent = BRAND;
        const menuButton = toolbar.querySelector('button');
        if (menuButton && menuButton.nextSibling) toolbar.insertBefore(badge, menuButton.nextSibling);
        else toolbar.insertBefore(badge, toolbar.firstChild || null);
    };

    const ensureLogoutButton = toolbar => {
        if (!toolbar || toolbar.querySelector('.eos-direct-logout')) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'eos-direct-logout';
        button.setAttribute('aria-label', 'Abmelden');
        button.innerHTML = '<span class="eos-direct-logout-dot"></span><span>Abmelden</span>';
        button.addEventListener('click', event => {
            event.preventDefault();
            logout();
        });
        toolbar.appendChild(button);
    };

    const ensureDrawerIdentity = () => {
        const drawer = document.querySelector('.MuiDrawer-paper');
        if (!drawer || drawer.querySelector('.eos-drawer-identity')) return;
        const identity = document.createElement('div');
        identity.className = 'eos-drawer-identity';
        identity.innerHTML = `
            <img src="${LOGO}" alt="${BRAND}" />
            <div><strong>${BRAND}</strong><small>Energy Operation System</small></div>
        `;
        drawer.insertBefore(identity, drawer.firstElementChild || null);
    };

    const ensureRightsHelper = () => {
        const appPaper = document.getElementById('app-paper');
        if (!appPaper) return;
        const isUsers = window.location.hash.includes('tab-users');
        const existing = appPaper.querySelector('.eos-rights-helper');
        if (!isUsers) {
            existing && existing.remove();
            return;
        }
        if (existing) return;
        const helper = document.createElement('section');
        helper.className = 'eos-rights-helper';
        helper.innerHTML = `
            <div class="eos-rights-helper-icon">🔐</div>
            <div class="eos-rights-helper-copy">
                <strong>Zugänge & Rechte</strong>
                <span>Benutzer werden Rollen zugeordnet. Ziehe ein Benutzerkonto auf eine Rolle oder öffne eine Rolle, um Rechte verständlich zu setzen.</span>
            </div>
            <div class="eos-rights-helper-steps">
                <span>1 Benutzer</span><span>2 Rolle</span><span>3 Rechte</span><span>4 Speichern</span>
            </div>
        `;
        appPaper.insertBefore(helper, appPaper.firstElementChild || null);
    };

    const normalize = text => String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const permissionKey = label => {
        const text = normalize(label);
        if (/auflisten|list/.test(text)) return 'list';
        if (/lesen|read/.test(text)) return 'read';
        if (/schreiben|write/.test(text)) return 'write';
        if (/erstellen|create/.test(text)) return 'create';
        if (/loschen|delete/.test(text)) return 'delete';
        if (/shell|execute|ausfuhr/.test(text)) return 'execute';
        if (/http/.test(text)) return 'http';
        if (/sendto/.test(text)) return 'sendto';
        return '';
    };

    const sectionKey = label => {
        let el = label.parentElement;
        for (let i = 0; i < 7 && el; i += 1, el = el.parentElement) {
            const heading = el.querySelector && el.querySelector('h2');
            if (heading && el.contains(label)) {
                const text = normalize(heading.textContent);
                if (/objekt|object/.test(text)) return 'object';
                if (/zustand|state/.test(text)) return 'state';
                if (/benutzer|user/.test(text)) return 'users';
                if (/datei|file/.test(text)) return 'file';
                if (/andere|other/.test(text)) return 'other';
            }
        }
        return 'unknown';
    };

    const desiredPermission = (profile, block, perm) => {
        if (!perm) return null;
        if (profile === 'admin') return true;
        if (profile === 'viewer') return ['object', 'state', 'file'].includes(block) && ['list', 'read'].includes(perm);
        if (profile === 'operator') {
            if (['object', 'state', 'file'].includes(block)) return ['list', 'read', 'write'].includes(perm);
            if (block === 'other') return perm === 'sendto';
            if (block === 'users') return false;
        }
        if (profile === 'service') {
            if (['object', 'state', 'file'].includes(block)) return ['list', 'read', 'write', 'create'].includes(perm);
            if (block === 'other') return ['sendto', 'execute'].includes(perm);
            if (block === 'users') return false;
        }
        return null;
    };

    const applyPermissionProfile = (dialog, profile) => {
        const labels = Array.from(dialog.querySelectorAll('label.MuiFormControlLabel-root'));
        labels.forEach(label => {
            const input = label.querySelector('input[type="checkbox"]');
            if (!input || input.disabled) return;
            const perm = permissionKey(label.textContent);
            const block = sectionKey(label);
            const desired = desiredPermission(profile, block, perm);
            if (desired === null) return;
            if (Boolean(input.checked) !== desired) input.click();
        });
    };

    const ensurePermissionPresets = () => {
        const dialogs = Array.from(document.querySelectorAll('.MuiDialog-paper'));
        const dialog = dialogs.find(item => item.querySelectorAll('input[type="checkbox"]').length >= 8 && /rechte|permissions|berecht/i.test(item.textContent || ''));
        if (!dialog || dialog.querySelector('.eos-permission-presets')) return;
        const content = dialog.querySelector('.MuiDialogContent-root') || dialog;
        const panel = document.createElement('section');
        panel.className = 'eos-permission-presets';
        panel.innerHTML = `
            <div class="eos-permission-presets-title">Rechte-Schnellprofile</div>
            <div class="eos-permission-presets-text">Wähle ein Profil und passe danach einzelne Rechte an. Administrator-Rollen bleiben geschützt.</div>
            <div class="eos-permission-presets-actions">
                <button type="button" data-profile="viewer">Nur lesen</button>
                <button type="button" data-profile="operator">Bedienung</button>
                <button type="button" data-profile="service">Service</button>
                <button type="button" data-profile="admin">Vollzugriff</button>
            </div>
        `;
        panel.addEventListener('click', event => {
            const button = event.target.closest('button[data-profile]');
            if (!button) return;
            applyPermissionProfile(dialog, button.getAttribute('data-profile'));
        });
        content.insertBefore(panel, content.firstElementChild || null);
    };

    const setRouteClasses = () => {
        const hash = window.location.hash || '';
        document.documentElement.classList.toggle('eos-route-users', hash.includes('tab-users'));
        document.documentElement.classList.toggle('eos-route-adapters', hash.includes('tab-adapters'));
        document.documentElement.classList.toggle('eos-route-intro', hash.includes('tab-intro') || hash === '' || hash === '#/');
    };

    const patchDocument = () => {
        forceLoginGlobals();
        document.title = BRAND_LONG;
        const theme = document.querySelector('meta[name="theme-color"]');
        if (theme) theme.setAttribute('content', '#020914');
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', BRAND_LONG);

        const path = window.location.href.toLowerCase();
        const isLogin = path.includes('login') || !!document.querySelector('#username, #password');
        const hasApp = !!document.getElementById('app-paper');
        document.documentElement.classList.toggle('eos-login', isLogin);
        document.documentElement.classList.toggle('eos-app', !isLogin && hasApp);
        document.documentElement.classList.toggle('eos-loading', !document.body || !document.querySelector('#root > *'));
        setRouteClasses();

        const toolbar = document.querySelector('#root > .MuiPaper-root > .MuiAppBar-root .MuiToolbar-root, header .MuiToolbar-root, .MuiAppBar-root .MuiToolbar-root');
        ensureBrandBadge(toolbar);
        ensureLogoutButton(toolbar);
        ensureDrawerIdentity();
        ensureRightsHelper();
        ensurePermissionPresets();

        replaceTextNodes(document.body || document.documentElement);
        patchAttributes(document.body || document.documentElement);
    };

    const installObserver = () => {
        const observer = new MutationObserver(mutations => {
            let needsPatch = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    needsPatch = true;
                    break;
                }
                if (mutation.type === 'attributes') {
                    needsPatch = true;
                    break;
                }
            }
            if (needsPatch) window.requestAnimationFrame(patchDocument);
        });
        observer.observe(document.documentElement, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['title', 'aria-label', 'alt', 'placeholder', 'src', 'class'],
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
    window.addEventListener('hashchange', patchDocument);
    setInterval(patchDocument, 1500);
})();
