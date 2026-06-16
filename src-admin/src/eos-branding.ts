export const eosBrandText = (value: unknown): unknown => {
    if (typeof value !== 'string') {
        return value;
    }

    return value
        .replace(/ioBroker\.admin/gi, 'NexoWatt EOS Admin')
        .replace(/iobroker\.js-controller/gi, 'EOS controller')
        .replace(/iobroker\.acme/gi, 'ACME adapter')
        .replace(/ioBroker\.vis/gi, 'NexoWatt Visu')
        .replace(/iobroker\.net\/pro/gi, 'NexoWatt Portal')
        .replace(/iobroker\.net/gi, 'NexoWatt Portal')
        .replace(/iobroker\.org/gi, 'NexoWatt Backend')
        .replace(/\bioBroker\b/g, 'NexoWatt EOS')
        .replace(/\biobroker\b/g, 'NexoWatt EOS')
        .replace(/\bIOBROKER\b/g, 'NEXOWATT EOS');
};

const ATTRIBUTES_TO_SANITIZE = ['title', 'aria-label', 'alt', 'placeholder'];

const sanitizeNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
        const current = node.textContent;
        const next = eosBrandText(current) as string | null;
        if (current && next && current !== next) {
            node.textContent = next;
        }
        return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return;
    }

    const element = node as Element;
    for (const attribute of ATTRIBUTES_TO_SANITIZE) {
        const current = element.getAttribute(attribute);
        const next = eosBrandText(current) as string | null;
        if (current && next && current !== next) {
            element.setAttribute(attribute, next);
        }
    }

    element.childNodes.forEach(sanitizeNode);
};

const sanitizeDocumentTitle = (): void => {
    const nextTitle = eosBrandText(document.title) as string;
    if (document.title !== nextTitle) {
        document.title = nextTitle;
    }
};

export const installEosBrandingGuard = (): void => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return;
    }

    const run = (): void => {
        sanitizeDocumentTitle();
        if (document.body) {
            sanitizeNode(document.body);
        }
    };

    const installObserver = (): void => {
        run();
        if (!document.body) {
            return;
        }

        const observer = new MutationObserver(mutations => {
            sanitizeDocumentTitle();
            for (const mutation of mutations) {
                mutation.addedNodes.forEach(sanitizeNode);
                if (mutation.type === 'characterData' && mutation.target) {
                    sanitizeNode(mutation.target);
                }
                if (mutation.type === 'attributes' && mutation.target) {
                    sanitizeNode(mutation.target);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATTRIBUTES_TO_SANITIZE,
        });
    };

    if (document.body) {
        installObserver();
    } else {
        document.addEventListener('DOMContentLoaded', installObserver, { once: true });
    }
};
