import { Component } from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class Router<P = {}, S = {}> extends Component<P, S> {
    protected onHashChangedBound: () => void;

    constructor(props: P) {
        super(props);
        this.onHashChangedBound = this.onHashChanged.bind(this);
    }

    componentDidMount(): void {
        window.addEventListener('hashchange', this.onHashChangedBound);
    }

    componentWillUnmount(): void {
        window.removeEventListener('hashchange', this.onHashChangedBound);
    }

    // eslint-disable-next-line class-methods-use-this
    onHashChanged(): void {
        // override this function
    }

    /**
     * Gets the location object.
     */
    static getLocation(): { tab: string; dialog: string; id: string; arg: string } {
        let hash = window.location.hash;
        hash = hash.replace(/^#/, '');
        const parts = hash.split('/').map(item => {
            try {
                return item ? decodeURIComponent(item) : '';
            } catch {
                console.error(`Router: Cannot decode ${item}`);
                return item || '';
            }
        });
        // #tabName/dialogName/deviceId
        return {
            tab: parts[0] || '',
            dialog: parts[1] || '',
            id: parts[2] || '',
            arg: parts[3] || '',
        };
    }

    /**
     * Navigate to a new location. Any parameters that are not set will be taken from the current location.
     */
    static doNavigate(
        tab: string | undefined | null,
        dialog?: string | null,
        id?: string | null,
        arg?: string | null,
    ): void {
        let hash = '';
        const location = Router.getLocation();
        if (arg !== undefined && !id) {
            id = location.id;
        }
        if (id && !dialog) {
            dialog = location.dialog;
        }
        if (dialog && !tab) {
            tab = location.tab;
        } else if (tab === null) {
            tab = location.tab;
        }

        if (tab) {
            hash = `#${tab}`;
            if (dialog) {
                hash += `/${dialog}`;

                if (id) {
                    hash += `/${id}`;
                    if (arg !== undefined) {
                        hash += `/${arg}`;
                    }
                }
            }
        }
        if (window.location.hash !== hash) {
            window.location.hash = hash;
        }
    }
}
