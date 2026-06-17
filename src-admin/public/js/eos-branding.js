(() => {
    'use strict';

    const BRAND = 'NexoWatt EOS';
    const BRAND_LONG = 'NexoWatt EOS - Energy Operation System';
    const SUBTITLE = 'Energy Operation System';
    const ASSET_BASE = (() => {
        const script = document.currentScript || Array.from(document.scripts).find(item => /eos-branding\.js(?:$|\?)/.test(item.src));
        const src = script && script.src ? script.src : document.baseURI;
        return new URL('../', src).href;
    })();
    const asset = path => new URL(path.replace(/^\.\//, ''), ASSET_BASE).href;
    const LOGO = asset('img/eos/nexowatt-64.png');
    const PNG_LOGO = asset('img/eos/nexowatt-192.png');
    const LOGIN_MOTTO = 'Energy Operation System';
    const OWN_SELECTOR = '.eos-brand-badge,.eos-direct-logout,.eos-drawer-identity,.eos-rights-helper,.eos-permission-presets';

    const TEXT_REPLACEMENTS = [
        [/NexoWatt\s+Energy\s+Management\s+System/gi, BRAND],
        [/NexoWatt\s+Energy\s+Managementsystem/gi, BRAND],
        [/Energy\s+Management\s+System/gi, SUBTITLE],
        [/Energy\s+Managementsystem/gi, SUBTITLE],
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

    const CANDIDATE_RE = /ioBroker|Energy\s+Management|NexoWatt\s+EMS|NEXOWATT|Übersicht|Overview|Adapter|Adapters|Instanzen|Instances|Objekte|Objects|Kategorien|Categories|Protokolle|Logs|Benutzer|Users|Groups|Permissions|Hosts|Files|Backup|Logout|xterm|xtrem/i;

    let scheduled = false;
    let pendingFullPatch = false;
    const pendingRoots = new Set();

    const normalize = text => String(text || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const replaceBrand = value => {
        if (!value || typeof value !== 'string') return value;
        const compact = value.trim();
        if (!CANDIDATE_RE.test(value) && !EXACT_LABELS.has(compact)) return value;

        let next = value;
        for (const [pattern, replacement] of TEXT_REPLACEMENTS) next = next.replace(pattern, replacement);

        const nextCompact = next.trim();
        if (EXACT_LABELS.has(nextCompact)) {
            next = next.replace(nextCompact, EXACT_LABELS.get(nextCompact));
        }
        return next;
    };

    const skipTextNode = node => {
        const parent = node && node.parentElement;
        if (!parent) return true;
        if (parent.closest && parent.closest(OWN_SELECTOR)) return true;
        const tag = parent.tagName;
        return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'CODE' || tag === 'PRE';
    };

    const patchTextNode = node => {
        if (!node || node.nodeType !== Node.TEXT_NODE || skipTextNode(node)) return;
        const before = node.nodeValue;
        const after = replaceBrand(before);
        if (after !== before) node.nodeValue = after;
    };

    const patchTextNodes = root => {
        try {
            if (!root) return;
            if (root.nodeType === Node.TEXT_NODE) {
                patchTextNode(root);
                return;
            }
            if (!root.querySelectorAll && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            while (walker.nextNode()) patchTextNode(walker.currentNode);
        } catch (e) {
            // Branding must never stop the Admin runtime.
        }
    };

    const candidatesFromRoot = root => {
        if (!root) return [];
        const list = [];
        if (root.nodeType === Node.ELEMENT_NODE) list.push(root);
        if (root.querySelectorAll) list.push(...root.querySelectorAll('[title],[aria-label],[alt],[placeholder],img'));
        return list;
    };

    const patchAttributes = root => {
        try {
            candidatesFromRoot(root).forEach(el => {
                if (el.closest && el.closest(OWN_SELECTOR)) return;
                ['title', 'aria-label', 'alt', 'placeholder'].forEach(attr => {
                    if (!el.hasAttribute || !el.hasAttribute(attr)) return;
                    const oldValue = el.getAttribute(attr);
                    const newValue = replaceBrand(oldValue);
                    if (newValue !== oldValue) el.setAttribute(attr, newValue);
                });

                if (el.tagName === 'IMG') {
                    const src = el.getAttribute('src') || '';
                    const alt = el.getAttribute('alt') || '';
                    if ((/admin\.svg|admin\.png|no-image\.svg|logo192\.png|logo512\.png|eos-logo\.svg|iobroker/i.test(src) || /iobroker|admin/i.test(alt)) && !/adapter|custom|upload/i.test(src)) {
                        el.setAttribute('src', LOGO);
                        el.setAttribute('alt', BRAND);
                    }
                }
            });
        } catch (e) {
            // ignore DOM races during React rendering
        }
    };

    const sanitizeLoginHref = () => {
        try {
            const url = new URL(window.location.href);
            const href = url.searchParams.get('href') || '';
            // Do not let login redirect back to logout/login URLs; that can end in a 404 loop after signing in.
            if (href && /(?:^|\/)(?:logout|login)(?:[/?#]|$)|%2f(?:logout|login)/i.test(href)) {
                url.searchParams.delete('href');
                window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
            }
        } catch (e) {
            // ignore URL parsing issues
        }
    };

    const forceLoginGlobals = () => {
        sanitizeLoginHref();
        window.loginTitle = BRAND;
        window.loginMotto = SUBTITLE;
        window.loginLogo = PNG_LOGO;
        window.loginLink = '#';
        window.loginHideLogo = 'false';
        window.loginBackgroundColor = '#020914';
        window.loadingBackgroundColor = '#020914';
    };

    const logout = () => {
        try {
            ['App.refreshToken', 'App.accessToken', 'App.token', 'tokens', 'iobroker.admin.token'].forEach(key => {
                window.localStorage && window.localStorage.removeItem(key);
                window.sessionStorage && window.sessionStorage.removeItem(key);
            });
            document.cookie.split(';').forEach(cookie => {
                const name = cookie.split('=')[0].trim();
                if (name) document.cookie = `${name}=; Max-Age=0; path=/`;
            });
        } catch (e) {
            // ignore storage restrictions
        }
        // Use the backend logout route without hash/query origin; this avoids 404 redirects after signing in again.
        window.location.href = new URL('logout', window.location.origin + '/').href;
    };

    const hasAdminShell = () => !!document.getElementById('app-paper') || !!document.querySelector('.MuiDrawer-paper');

    const isLoginView = () => {
        const href = window.location.href.toLowerCase();
        const search = window.location.search.toLowerCase();
        const runtimeLogin = String(window.login || '').toLowerCase() === 'true';
        const hasPassword = !!document.querySelector('#password, input[type="password"], input[name*="pass" i], input[autocomplete*="password" i]');
        const hasUserField = !!document.querySelector('#username, input[name="username" i], input[name*="login" i], input[name*="user" i], input[autocomplete="username"]');
        const hasLoginButton = Array.from(document.querySelectorAll('button')).some(button => /^(anmelden|login|sign in)$/.test(normalize(button.textContent || '')));
        const bodyText = normalize(document.body && document.body.innerText ? document.body.innerText.slice(0, 1800) : '');
        const hasLoginWording = /loginname|passwort|password|angemeldet bleiben|stay logged/.test(bodyText);
        // Login form detection wins even if React left a stale shell node in the DOM after logout.
        return runtimeLogin || href.includes('/login') || search.includes('login') || (hasPassword && (hasLoginButton || hasUserField || hasLoginWording));
    };

    const markLoginCard = () => {
        const field = document.querySelector('#username, input[name="username"], input[name*="login" i], input[name*="user" i], #password, input[type="password"], input[name*="pass" i]');
        const card = field && field.closest('.MuiPaper-root');
        document.querySelectorAll('.eos-login-card').forEach(el => {
            if (el !== card) el.classList.remove('eos-login-card');
        });
        if (!card) return;
        card.classList.add('eos-login-card');
        card.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src') || '';
            if (!src.includes('/adapters/') && !src.includes('/adapter/')) {
                img.setAttribute('src', PNG_LOGO);
                img.setAttribute('alt', BRAND);
            }
        });
        const title = card.querySelector('h1, h2, h3, h4, h5, .MuiTypography-h5, .MuiTypography-h4');
        if (title) {
            const text = normalize(title.textContent);
            if (/energy management|nexowatt energy|iobroker|admin|eos/.test(text)) title.textContent = BRAND;
        }
    };

    const ensureBrandBadge = toolbar => {
        if (!toolbar) return;
        let badge = toolbar.querySelector('.eos-brand-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'eos-brand-badge';
            const menuButton = toolbar.querySelector('button');
            if (menuButton && menuButton.nextSibling) toolbar.insertBefore(badge, menuButton.nextSibling);
            else toolbar.insertBefore(badge, toolbar.firstChild || null);
        }
        if (!badge.querySelector('img')) {
            badge.innerHTML = `<img src="${LOGO}" alt="${BRAND}" /><span>${BRAND}</span>`;
        }
    };

    const ensureLogoutButton = toolbar => {
        const login = isLoginView();
        const hasApp = hasAdminShell();
        if (!toolbar || login || !hasApp) {
            document.querySelectorAll('.eos-direct-logout').forEach(item => item.remove());
            return;
        }
        let button = document.querySelector('.eos-direct-logout');
        if (!button) {
            button = document.createElement('button');
            button.type = 'button';
            button.className = 'eos-direct-logout';
            button.setAttribute('aria-label', 'Abmelden');
            button.innerHTML = '<span class="eos-direct-logout-dot"></span><span>Abmelden</span>';
            button.addEventListener('click', event => {
                event.preventDefault();
                logout();
            });
        }
        if (button.parentElement !== toolbar) toolbar.appendChild(button);
    };

    const ensureDrawerIdentity = () => {
        const drawer = document.querySelector('.MuiDrawer-paper');
        if (!drawer) return;
        drawer.classList.add('eos-drawer-ready');

        let identity = drawer.querySelector('.eos-drawer-identity');
        if (!identity) {
            identity = document.createElement('div');
            identity.className = 'eos-drawer-identity';
            drawer.insertBefore(identity, drawer.firstElementChild || null);
        }
        const desiredIdentity = `
            <img src="${LOGO}" alt="${BRAND}" />
            <div><strong>NexoWatt<br>EOS</strong><small>${SUBTITLE}</small></div>
        `;
        if (identity.innerHTML !== desiredIdentity) identity.innerHTML = desiredIdentity;

        const directChildren = Array.from(drawer.children).filter(el => el !== identity);
        directChildren.forEach(el => {
            if (el.classList && el.classList.contains('eos-legacy-brand-row')) return;
            const isList = el.classList && (el.classList.contains('MuiList-root') || el.getAttribute('role') === 'menu');
            if (isList) return;
            const text = normalize(el.textContent || '');
            const hasLogo = !!(el.querySelector && el.querySelector('img[src*="admin"], img[src*="logo"], img[src*="nexowatt"], img[src*="eos"]'));
            const hasCollapse = !!(el.querySelector && el.querySelector('button'));
            if ((hasLogo || hasCollapse || /nexowatt|admin|eos/.test(text)) && (el.getBoundingClientRect ? el.getBoundingClientRect().height <= 120 : true)) {
                el.classList.add('eos-legacy-brand-row');
            }
        });
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
                <span>Benutzer werden Rollen zugeordnet. Öffne eine Rolle, wähle ein Schnellprofil und passe einzelne Rechte bei Bedarf an.</span>
            </div>
            <div class="eos-rights-helper-steps">
                <span>1 Benutzer</span><span>2 Rolle</span><span>3 Profil</span><span>4 Speichern</span>
            </div>
        `;
        appPaper.insertBefore(helper, appPaper.firstElementChild || null);
    };

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
            const desired = desiredPermission(profile, sectionKey(label), permissionKey(label.textContent));
            if (desired === null) return;
            if (Boolean(input.checked) !== desired) input.click();
        });
    };

    const ensurePermissionPresets = () => {
        if (!document.querySelector('.MuiDialog-paper')) return;
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

    const patchShell = () => {
        forceLoginGlobals();
        document.title = BRAND_LONG;
        const theme = document.querySelector('meta[name="theme-color"]');
        if (theme) theme.setAttribute('content', '#020914');
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', BRAND_LONG);

        const login = isLoginView();
        const hasApp = hasAdminShell();
        if (login) document.querySelectorAll('.eos-direct-logout').forEach(item => item.remove());
        document.documentElement.classList.toggle('eos-login', login);
        document.documentElement.classList.toggle('eos-app', !login && hasApp);
        document.documentElement.classList.toggle('eos-loading', !document.body || !document.querySelector('#root > *'));
        setRouteClasses();

        if (login || !hasApp) {
            markLoginCard();
            document.querySelectorAll('.eos-direct-logout').forEach(item => item.remove());
            return;
        }

        const toolbar = document.querySelector('#root > .MuiPaper-root > .MuiAppBar-root .MuiToolbar-root, header .MuiToolbar-root, .MuiAppBar-root .MuiToolbar-root');
        if (!toolbar) {
            document.querySelectorAll('.eos-direct-logout').forEach(item => item.remove());
            return;
        }
        ensureBrandBadge(toolbar);
        ensureLogoutButton(toolbar);
        ensureDrawerIdentity();
        ensureRightsHelper();
        ensurePermissionPresets();
    };

    const performPatch = () => {
        scheduled = false;
        const full = pendingFullPatch;
        pendingFullPatch = false;
        const roots = Array.from(pendingRoots);
        pendingRoots.clear();

        patchShell();

        if (full || !roots.length) {
            const root = document.body || document.documentElement;
            patchTextNodes(root);
            patchAttributes(root);
            return;
        }

        roots.forEach(root => {
            patchTextNodes(root);
            patchAttributes(root.nodeType === Node.TEXT_NODE ? root.parentElement : root);
        });
    };

    const schedulePatch = (root, full = false) => {
        if (full) pendingFullPatch = true;
        if (root) pendingRoots.add(root);
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(performPatch);
    };

    const installObserver = () => {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                const target = mutation.target;
                if (target && target.nodeType === Node.ELEMENT_NODE && target.closest && target.closest(OWN_SELECTOR)) continue;

                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.TEXT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
                            pendingRoots.add(node);
                        }
                    });
                } else if (mutation.type === 'characterData') {
                    pendingRoots.add(target);
                } else if (mutation.type === 'attributes') {
                    pendingRoots.add(target);
                }
            }
            if (!scheduled && pendingRoots.size) {
                scheduled = true;
                window.requestAnimationFrame(performPatch);
            }
        });
        observer.observe(document.documentElement, {
            subtree: true,
            childList: true,
            characterData: true,
        });
    };

    const installAssetRecovery = () => {
        const reloadOnce = url => {
            try {
                if (!url || !/\/(assets|js|css|img|lib)\//.test(url)) return;
                const key = 'eos.assetRecoveryReloaded';
                if (sessionStorage.getItem(key) === '1') return;
                sessionStorage.setItem(key, '1');
                window.setTimeout(() => window.location.reload(), 120);
            } catch (e) {
                // ignore browser/storage restrictions
            }
        };
        window.addEventListener('error', event => {
            const target = event && event.target;
            if (target && (target.src || target.href)) reloadOnce(String(target.src || target.href));
        }, true);
        window.addEventListener('unhandledrejection', event => {
            const message = String(event && event.reason && (event.reason.message || event.reason) || '');
            if (/failed to fetch dynamically imported module|loading chunk|404|not found/i.test(message)) {
                reloadOnce(`${ASSET_BASE}assets/`);
            }
        });
    };

    forceLoginGlobals();
    installAssetRecovery();

    const boot = () => {
        schedulePatch(document.body || document.documentElement, true);
        installObserver();
        [300, 900, 2200].forEach(delay => window.setTimeout(() => schedulePatch(document.body || document.documentElement, true), delay));
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
    window.addEventListener('load', () => schedulePatch(document.body || document.documentElement, true), { once: true });
    window.addEventListener('hashchange', () => schedulePatch(document.body || document.documentElement, true));
})();
