(() => {
    'use strict';

    const BRAND = 'NexoWatt EOS';
    const EOS_MEANING = 'Energy Operation System';
    const BRAND_LONG = `${BRAND} - ${EOS_MEANING}`;
    const LOGO = 'img/eos/eos-logo.svg';
    const PNG_LOGO = 'img/eos/nexowatt-192.png';
    const LOGIN_MOTTO = EOS_MEANING;

    const TEXT_REPLACEMENTS = [
        [/NexoWatt\s+Energy\s+Management\s+System/gi, BRAND],
        [/NexoWatt\s+Energy\s+Managementsystem/gi, BRAND],
        [/Energy\s+Management\s+System/gi, EOS_MEANING],
        [/Energy\s+Managementsystem/gi, EOS_MEANING],
        [/ioBroker\.admin/gi, BRAND],
        [/ioBroker\s+admin/gi, BRAND],
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

    const state = {
        fullPatchScheduled: false,
        scopePatchScheduled: false,
        pendingScopes: new Set(),
        lastFullPatch: 0,
    };

    const safe = fn => {
        try { return fn(); } catch (e) { return undefined; }
    };

    const replaceBrand = value => {
        if (!value || typeof value !== 'string') return value;
        let next = value;
        for (const [pattern, replacement] of TEXT_REPLACEMENTS) next = next.replace(pattern, replacement);
        const compact = next.trim();
        if (EXACT_LABELS.has(compact)) next = next.replace(compact, EXACT_LABELS.get(compact));
        return next;
    };

    const skipElement = el => {
        if (!el || el.nodeType !== 1) return false;
        const tag = el.tagName;
        return tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'CODE' || tag === 'PRE';
    };

    const patchTextNode = node => {
        if (!node || node.nodeType !== Node.TEXT_NODE || !node.nodeValue) return;
        if (skipElement(node.parentElement)) return;
        const before = node.nodeValue;
        const after = replaceBrand(before);
        if (after !== before) node.nodeValue = after;
    };

    const patchTextNodes = root => safe(() => {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) {
            patchTextNode(root);
            return;
        }
        if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
        if (skipElement(root)) return;
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                return skipElement(node.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
            }
        });
        let node;
        while ((node = walker.nextNode())) patchTextNode(node);
    });

    const patchImage = img => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || '';
        const inBrandArea = !!img.closest('.eos-login-card, .eos-native-drawer-header, .eos-system-brand, .eos-brand-badge');
        const isBrandLogo = /admin\.svg|admin\.png|logo192\.png|logo\.svg/i.test(src) || /iobroker|admin|nexowatt|eos|logo/i.test(alt);
        const isAdapterIcon = /adapter\/|adapters\/|custom\/|upload\/|assets\//i.test(src);
        const isNeutralPlaceholder = /no-image\.svg/i.test(src);

        // Only replace real brand surfaces. Do not stamp the NexoWatt logo onto instance/module placeholders.
        if ((inBrandArea || (isBrandLogo && !isAdapterIcon)) && !(!inBrandArea && isNeutralPlaceholder)) {
            img.setAttribute('src', LOGO);
            img.setAttribute('alt', BRAND);
        }
    };

    const patchAttributes = root => safe(() => {
        if (!root || (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE)) return;
        const elements = root.matches && root.matches('[title],[aria-label],[alt],[placeholder],img')
            ? [root]
            : Array.from(root.querySelectorAll ? root.querySelectorAll('[title],[aria-label],[alt],[placeholder],img') : []);
        for (const el of elements) {
            ['title', 'aria-label', 'alt', 'placeholder'].forEach(attr => {
                if (el.hasAttribute && el.hasAttribute(attr)) {
                    const oldValue = el.getAttribute(attr);
                    const newValue = replaceBrand(oldValue);
                    if (newValue !== oldValue) el.setAttribute(attr, newValue);
                }
            });
            if (el.tagName === 'IMG') patchImage(el);
        }
    });

    const forceLoginGlobals = () => {
        window.loginTitle = BRAND;
        window.loginMotto = LOGIN_MOTTO;
        window.loginLogo = PNG_LOGO;
        window.loginLink = '#';
        window.loginHideLogo = 'false';
        window.loginBackgroundColor = '#020914';
        window.loadingBackgroundColor = '#020914';
    };

    const routeInfo = () => {
        const hash = window.location.hash || '';
        return {
            users: hash.includes('tab-users'),
            adapters: hash.includes('tab-adapters'),
            intro: hash.includes('tab-intro') || hash === '' || hash === '#/' || hash === '#/tab-intro',
        };
    };


    const isLoginView = () => safe(() => {
        const hasApp = !!document.getElementById('app-paper');
        if (hasApp) return false;
        const urlText = `${window.location.pathname} ${window.location.search} ${window.location.hash}`.toLowerCase();
        const hasPassword = !!document.querySelector('#password, input[type="password"], input[name*="pass" i], input[autocomplete*="password" i]');
        const hasUserField = !!document.querySelector('#username, input[name="username" i], input[name*="login" i], input[name*="user" i], input[autocomplete="username"]');
        const hasLoginButton = Array.from(document.querySelectorAll('button')).some(button => /^(anmelden|login|sign in)$/.test(normalize(button.textContent || '')));
        return /(?:^|[/?#])login(?:[/?#=&]|$)/.test(urlText) || (hasPassword && (hasUserField || hasLoginButton));
    }) || false;

    const removeLogoutButton = () => document.querySelectorAll('.eos-direct-logout').forEach(button => button.remove());

    const sanitizeLoginHref = () => safe(() => {
        const url = new URL(window.location.href);
        const href = url.searchParams.get('href') || '';
        if (href && /(?:^|\/)(?:logout|login)(?:[/?#]|$)|%2f(?:logout|login)/i.test(href)) {
            url.searchParams.delete('href');
            window.history.replaceState(null, document.title, `${url.pathname}${url.search}${url.hash}`);
        }
    });

    const setRouteClasses = () => {
        const routes = routeInfo();
        document.documentElement.classList.toggle('eos-route-users', routes.users);
        document.documentElement.classList.toggle('eos-route-adapters', routes.adapters);
        document.documentElement.classList.toggle('eos-route-intro', routes.intro);
    };

    const getLoginCard = () => {
        const input = document.querySelector('#username, input[name="username"], #password, input[type="password"]');
        return input ? input.closest('.MuiPaper-root, form, main > div') : null;
    };

    const patchLogin = () => safe(() => {
        forceLoginGlobals();
        sanitizeLoginHref();
        const hasApp = !!document.getElementById('app-paper');
        const card = hasApp ? null : getLoginCard();
        const isLogin = isLoginView();
        document.documentElement.classList.toggle('eos-login', isLogin);
        document.documentElement.classList.toggle('eos-loading', !document.body || !document.querySelector('#root > *'));
        if (isLogin) removeLogoutButton();
        if (!isLogin || !card) return;
        card.classList.add('eos-login-card');
        const titles = Array.from(card.querySelectorAll('h1,h2,h3,h4,h5,.MuiTypography-h5'));
        const title = titles.find(el => /management|nexowatt|admin|eos/i.test(el.textContent || '')) || titles[0];
        if (title && title.textContent.trim() !== BRAND) {
            title.textContent = BRAND;
            title.setAttribute('aria-label', BRAND_LONG);
        }
        const logo = card.querySelector('img');
        if (logo) patchImage(logo);
        Array.from(card.querySelectorAll('a, .MuiTypography-caption, .MuiTypography-body2')).forEach(el => {
            const text = (el.textContent || '').trim();
            if (/independent|transparent|fair|management|iobroker/i.test(text)) {
                el.textContent = `${BRAND} · ${EOS_MEANING}`;
            }
        });
    });

    const logout = () => {
        safe(() => {
            ['App.refreshToken', 'App.accessToken', 'App.token', 'tokens', 'iobroker.admin.token'].forEach(key => {
                window.localStorage && window.localStorage.removeItem(key);
                window.sessionStorage && window.sessionStorage.removeItem(key);
            });
        });
        const origin = `${window.location.pathname}${window.location.search}${window.location.hash || ''}`;
        window.location.href = `./logout?origin=${encodeURIComponent(origin)}`;
    };

    const ensureBrandBadge = toolbar => {
        if (!toolbar) return;
        document.querySelectorAll('.eos-brand-badge').forEach(existing => {
            if (!toolbar.contains(existing)) existing.remove();
        });
        if (toolbar.querySelector('.eos-brand-badge')) return;
        const badge = document.createElement('span');
        badge.className = 'eos-brand-badge eos-system-brand';
        badge.innerHTML = `<span class="eos-brand-led"></span><span>${BRAND}</span>`;
        const firstButton = toolbar.querySelector('button');
        toolbar.insertBefore(badge, firstButton || toolbar.firstChild || null);
    };

    const ensureLogoutButton = () => {
        if (isLoginView() || document.documentElement.classList.contains('eos-login') || !document.getElementById('app-paper')) {
            removeLogoutButton();
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
            document.body.appendChild(button);
        }
        button.hidden = false;
    };

    const patchDrawerHeader = drawer => safe(() => {
        if (!drawer) return;
        drawer.classList.add('eos-drawer');
        drawer.querySelectorAll('.eos-drawer-identity').forEach(el => el.remove());
        const directChildren = Array.from(drawer.children).filter(el => el.nodeType === 1);
        const header = directChildren.find(el => el.querySelector && el.querySelector('button') && (el.querySelector('img') || el.querySelector('.MuiAvatar-root') || el.querySelector('a')))
            || directChildren.find(el => el.querySelector && (el.querySelector('button') || el.querySelector('img')));
        if (!header) return;
        header.classList.add('eos-native-drawer-header');
        const img = header.querySelector('img');
        if (img) patchImage(img);
        const avatarImg = header.querySelector('.MuiAvatar-img');
        if (avatarImg) patchImage(avatarImg);
        const logoArea = header.querySelector('a')?.parentElement || header.firstElementChild || header;
        if (logoArea && !logoArea.querySelector('.eos-native-title')) {
            const title = document.createElement('span');
            title.className = 'eos-native-title';
            title.innerHTML = `<strong>${BRAND}</strong><small>${EOS_MEANING}</small>`;
            const link = logoArea.querySelector('a');
            if (link && link.nextSibling) logoArea.insertBefore(title, link.nextSibling);
            else logoArea.appendChild(title);
        }
        const list = drawer.querySelector('.MuiList-root');
        if (list) list.classList.add('eos-scroll-nav');
    });

    const patchShell = () => safe(() => {
        const hasApp = !!document.getElementById('app-paper');
        const login = isLoginView();
        document.documentElement.classList.toggle('eos-login', login);
        document.documentElement.classList.toggle('eos-app', !login && hasApp);
        setRouteClasses();
        if (login || !hasApp) {
            removeLogoutButton();
            return;
        }
        const toolbar = document.querySelector('#root > .MuiPaper-root > .MuiAppBar-root .MuiToolbar-root, header .MuiToolbar-root, .MuiAppBar-root .MuiToolbar-root');
        if (toolbar) {
            toolbar.classList.add('eos-top-toolbar');
            ensureBrandBadge(toolbar);
        }
        patchDrawerHeader(document.querySelector('.MuiDrawer-paper'));
        ensureLogoutButton();
    });

    const ensureRightsHelper = () => safe(() => {
        const appPaper = document.getElementById('app-paper');
        if (!appPaper) return;
        const isUsers = routeInfo().users;
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
                <span>Benutzer werden Rollen zugeordnet. Wähle ein verständliches Rechteprofil und passe einzelne Rechte bei Bedarf an.</span>
            </div>
            <div class="eos-rights-helper-steps">
                <span>1 Benutzer</span><span>2 Rolle</span><span>3 Profil</span><span>4 Speichern</span>
            </div>
        `;
        appPaper.insertBefore(helper, appPaper.firstElementChild || null);
    });

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
            const heading = el.querySelector && el.querySelector('h2,h3,h4,.MuiTypography-h6');
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

    const ensurePermissionPresets = () => safe(() => {
        const dialogs = Array.from(document.querySelectorAll('.MuiDialog-paper'));
        const dialog = dialogs.find(item => item.querySelectorAll('input[type="checkbox"]').length >= 8 && /rechte|permissions|berecht/i.test(item.textContent || ''));
        if (!dialog || dialog.querySelector('.eos-permission-presets')) return;
        const content = dialog.querySelector('.MuiDialogContent-root') || dialog;
        const panel = document.createElement('section');
        panel.className = 'eos-permission-presets';
        panel.innerHTML = `
            <div class="eos-permission-presets-title">Rechte-Schnellprofile</div>
            <div class="eos-permission-presets-text">Wähle ein Profil und passe danach einzelne Rechte an. Administrator-Rollen bleiben bewusst transparent sichtbar.</div>
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
    });

    const patchDocumentMeta = () => safe(() => {
        document.title = BRAND_LONG;
        const theme = document.querySelector('meta[name="theme-color"]');
        if (theme) theme.setAttribute('content', '#020914');
        const desc = document.querySelector('meta[name="description"]');
        if (desc) desc.setAttribute('content', BRAND_LONG);
    });

    const fullPatch = () => {
        state.fullPatchScheduled = false;
        state.lastFullPatch = Date.now();
        forceLoginGlobals();
        sanitizeLoginHref();
        patchDocumentMeta();
        patchLogin();
        patchShell();
        ensureRightsHelper();
        ensurePermissionPresets();
        patchTextNodes(document.body || document.documentElement);
        patchAttributes(document.body || document.documentElement);
    };

    const scopePatch = () => {
        state.scopePatchScheduled = false;
        const scopes = Array.from(state.pendingScopes);
        state.pendingScopes.clear();
        patchLogin();
        patchShell();
        ensureRightsHelper();
        ensurePermissionPresets();
        for (const scope of scopes.slice(0, 80)) {
            if (!scope || !scope.isConnected) continue;
            patchTextNodes(scope);
            patchAttributes(scope);
        }
    };

    const scheduleFullPatch = delay => {
        if (state.fullPatchScheduled && !delay) return;
        state.fullPatchScheduled = true;
        const run = () => {
            if ('requestIdleCallback' in window) window.requestIdleCallback(fullPatch, { timeout: 800 });
            else window.requestAnimationFrame(fullPatch);
        };
        if (delay) window.setTimeout(run, delay);
        else run();
    };

    const scheduleScopePatch = () => {
        if (state.scopePatchScheduled) return;
        state.scopePatchScheduled = true;
        const run = () => {
            if ('requestIdleCallback' in window) window.requestIdleCallback(scopePatch, { timeout: 600 });
            else window.requestAnimationFrame(scopePatch);
        };
        run();
    };

    const installObserver = () => safe(() => {
        const observer = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'characterData') {
                    patchTextNode(mutation.target);
                    continue;
                }
                if (mutation.type !== 'childList') continue;
                mutation.addedNodes.forEach(node => {
                    if (!node) return;
                    if (node.nodeType === Node.TEXT_NODE) patchTextNode(node);
                    else if (node.nodeType === Node.ELEMENT_NODE) state.pendingScopes.add(node);
                });
            }
            if (state.pendingScopes.size) scheduleScopePatch();
        });
        observer.observe(document.documentElement, {
            subtree: true,
            childList: true,
            characterData: true,
        });
    });

    forceLoginGlobals();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            fullPatch();
            installObserver();
            [250, 1000, 2500, 5000].forEach(scheduleFullPatch);
        }, { once: true });
    } else {
        fullPatch();
        installObserver();
        [250, 1000, 2500, 5000].forEach(scheduleFullPatch);
    }
    window.addEventListener('load', () => scheduleFullPatch(0), { once: true });
    window.addEventListener('hashchange', () => scheduleFullPatch(0));
})();
