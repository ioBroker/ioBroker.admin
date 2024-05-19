import React from 'react';
import type HostsWorker from '@/Workers/HostsWorker';
import type { AdminConnection } from '@iobroker/adapter-react-v5';

export interface HostRowCardProps {
    _id: string;
    alive: boolean;
    available: string;
    classes: Record<string, string>;
    color: string;
    isCurrentHost: boolean;
    description: React.JSX.Element | null;
    events: number;
    executeCommandRemove: () => void;
    expertMode: boolean;
    getLogLevelIcon: (level: string) => React.JSX.Element;
    formatInfo: Record<string, (value: any, t: (text: string) => string) => string>;
    hidden: boolean;
    hostsWorker: HostsWorker;
    hostData: Record<string, any>;
    image: string;
    installed: string;
    name: string;
    openHostUpdateDialog: () => void;
    setBaseSettingsDialog: () => void;
    setEditDialog: (val: boolean) => void;
    showAdaptersWarning: (notifications: Record<string, any>, host: string) => void;
    socket: AdminConnection;
    systemConfig: any; // ioBroker.SystemConfigObject;
    t: (text: string, ...args: any[]) => string;
    connected?: boolean;
    connectedToHost?: string;
}

export const arrayLogLevel = ['silly', 'debug', 'info', 'warn', 'error'];

export function toggleClassName(el: HTMLElement, name: string) {
    const classNames = el.className.split(' ');
    const pos = classNames.indexOf(name);
    if (pos !== -1) {
        classNames.splice(pos, 1);
        el.className = classNames.join(' ');
    }
    classNames.push(name);
    // el.className = classNames.join(' ');
    setTimeout(_classNames => (el.className = _classNames), 100, classNames.join(' '));
}
