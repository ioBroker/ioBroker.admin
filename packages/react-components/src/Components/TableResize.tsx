/**
 * Copyright 2022-2024, Denis Haev <dogafox@gmail.com>
 *
 * MIT License
 *
 */
import React, { Component } from 'react';

import { Table, Skeleton } from '@mui/material';

interface TableResizeProps {
    name?: string;
    ready?: boolean;
    stickyHeader?: boolean;
    size?: 'small' | 'medium';
    className?: string;
    sx?: Record<string, any>;
    style?: React.CSSProperties;
    initialWidths?: (number | 'auto')[];
    minWidths?: number[];
    dblTitle?: string;
    children?: React.ReactNode;
}

export class TableResize extends Component<TableResizeProps> {
    private readonly resizerRefTable: React.RefObject<HTMLTableElement>;

    private resizerActiveIndex: number | null;

    private resizerActiveDiv: HTMLDivElement | null;

    private resizerCurrentWidths: (number | 'auto')[];

    private widthFilled: boolean = false;

    private installTimeout: ReturnType<typeof setTimeout> | null = null;

    private resizerMin: number = 0;

    private resizerMinNext: number = 0;

    private resizerPosition: number = 0;

    private resizerOldWidth: number = 0;

    private resizerOldWidthNext: number = 0;

    constructor(props: TableResizeProps) {
        super(props);
        this.resizerRefTable = React.createRef();
        this.resizerActiveIndex = null;
        this.resizerActiveDiv = null;
        this.resizerCurrentWidths = [];
    }

    componentDidMount(): void {
        this.resizerInstall();
    }

    componentWillUnmount(): void {
        this.resizerUninstall();
    }

    resizerInstall(): void {
        if (this.resizerRefTable.current && !(this.resizerRefTable.current as any)._installed) {
            (this.resizerRefTable.current as any)._installed = true;
            const ths = this.resizerRefTable.current.querySelectorAll('th');

            const widthsStored = ((window as any)._localStorage || window.localStorage).getItem(
                `App.${this.props.name || 'history'}.table`,
            );
            this.widthFilled = false;

            if (widthsStored) {
                try {
                    this.resizerCurrentWidths = JSON.parse(widthsStored);
                    this.widthFilled = true;
                } catch {
                    // ignore
                }
            }
            if (this.widthFilled) {
                if (this.resizerCurrentWidths.length !== ths.length) {
                    this.resizerCurrentWidths = [];
                    this.widthFilled = false;
                } else {
                    const tableWidth = this.resizerRefTable.current.offsetWidth;
                    let storedWidth: number | null = 0;
                    for (let w = 0; w < this.resizerCurrentWidths.length; w++) {
                        if (window.isFinite(this.resizerCurrentWidths[w] as number)) {
                            storedWidth += this.resizerCurrentWidths[w] as number;
                        } else {
                            storedWidth = null;
                            break;
                        }
                    }
                    if (storedWidth !== null && Math.abs(storedWidth - tableWidth) > 20) {
                        this.resizerCurrentWidths = [];
                        this.widthFilled = false;
                    }
                }
            }

            for (let i = 0; i < ths.length; i++) {
                !this.widthFilled && this.resizerCurrentWidths.push(ths[i].offsetWidth);

                // last column does need a handle
                if (i < ths.length - 1) {
                    const div = window.document.createElement('div');
                    div.dataset.index = i.toString();
                    div.onmousedown = this.resizerMouseDown;
                    div.ondblclick = this.resizerReset;
                    div.title = this.props.dblTitle || 'Double click to reset table layout';
                    div.className = 'resize-handle';
                    ths[i].appendChild(div);
                }
            }
            if (this.widthFilled) {
                this.resizerApplyWidths();
            }
        } else {
            this.installTimeout = setTimeout(() => {
                this.installTimeout = null;
                this.resizerInstall();
            }, 100);
        }
    }

    resizerReset = (): void => {
        for (let c = 0; c < this.resizerCurrentWidths.length; c++) {
            this.resizerCurrentWidths[c] = (this.props.initialWidths || [])[c] || 'auto';
        }

        ((window as any)._localStorage || window.localStorage).setItem(
            `App.${this.props.name || 'history'}.table`,
            JSON.stringify(this.resizerCurrentWidths),
        );
        this.resizerApplyWidths();
    };

    resizerUninstall(): void {
        this.installTimeout && clearTimeout(this.installTimeout);
        this.installTimeout = null;

        // resizer
        if (this.resizerRefTable.current && (this.resizerRefTable.current as any)._installed) {
            (this.resizerRefTable.current as any)._installed = false;
            const ths = this.resizerRefTable.current.querySelectorAll('th');
            for (let i = 0; i < ths.length; i++) {
                const div: HTMLDivElement | null = ths[i].querySelector('.resize-handle');
                if (div) {
                    div.onmousedown = null;
                    div.remove();
                }
            }
        }
    }

    resizerApplyWidths(): string | undefined {
        const gridTemplateColumns: string[] = [];
        if (this.resizerCurrentWidths.length) {
            for (let c = 0; c < this.resizerCurrentWidths.length; c++) {
                if (this.resizerCurrentWidths[c]) {
                    gridTemplateColumns.push(
                        this.resizerCurrentWidths[c] !== 'auto' ? `${this.resizerCurrentWidths[c]}px` : 'auto',
                    );
                } else if (this.props.initialWidths && this.props.initialWidths[c]) {
                    gridTemplateColumns.push(
                        this.props.initialWidths[c] !== 'auto' ? `${this.props.initialWidths[c]}px` : 'auto',
                    );
                } else {
                    gridTemplateColumns.push('auto');
                }
            }
        } else if (this.props.initialWidths) {
            for (let c = 0; c < this.props.initialWidths.length; c++) {
                if (this.props.initialWidths[c]) {
                    gridTemplateColumns.push(
                        this.props.initialWidths[c] !== 'auto' ? `${this.props.initialWidths[c]}px` : 'auto',
                    );
                } else {
                    gridTemplateColumns.push('auto');
                }
            }
        }

        if (this.resizerRefTable.current && gridTemplateColumns.length) {
            this.resizerRefTable.current.style.gridTemplateColumns = gridTemplateColumns.join(' ');
        }

        return gridTemplateColumns.length ? gridTemplateColumns.join(' ') : undefined;
    }

    resizerMouseMove = (e: MouseEvent): void => {
        if (this.resizerActiveDiv && this.resizerActiveIndex !== null) {
            const width = this.resizerOldWidth + e.clientX - this.resizerPosition;
            const widthNext = this.resizerOldWidthNext - e.clientX + this.resizerPosition;
            if (
                (!this.resizerMin || width > this.resizerMin) &&
                (!this.resizerMinNext || widthNext > this.resizerMinNext)
            ) {
                this.resizerCurrentWidths[this.resizerActiveIndex] = width;
                this.resizerCurrentWidths[this.resizerActiveIndex + 1] = widthNext;
                this.resizerApplyWidths();
            }
        }
    };

    resizerMouseUp = (): void => {
        ((window as any)._localStorage || window.localStorage).setItem(
            `App.${this.props.name || 'history'}.table`,
            JSON.stringify(this.resizerCurrentWidths),
        );

        this.resizerActiveIndex = null;
        this.resizerActiveDiv = null;
        window.removeEventListener('mousemove', this.resizerMouseMove);
        window.removeEventListener('mouseup', this.resizerMouseUp);
    };

    resizerMouseDown = (e: MouseEvent): void => {
        if (this.resizerActiveIndex === null || this.resizerActiveIndex === undefined) {
            console.log(`Mouse down ${(e.target as HTMLDivElement)?.dataset.index}`);
            this.resizerActiveIndex = parseInt((e.target as HTMLDivElement)?.dataset.index || '0', 10);
            this.resizerActiveDiv = e.target as HTMLDivElement;
            this.resizerMin = this.props.minWidths ? this.props.minWidths[this.resizerActiveIndex] : 0;
            this.resizerMinNext = this.props.minWidths ? this.props.minWidths[this.resizerActiveIndex + 1] : 0;
            this.resizerPosition = e.clientX;
            let ths;
            if (this.resizerCurrentWidths[this.resizerActiveIndex] === 'auto') {
                ths = this.resizerRefTable.current?.querySelectorAll('th');
                if (ths) {
                    this.resizerCurrentWidths[this.resizerActiveIndex] = ths[this.resizerActiveIndex].offsetWidth;
                }
            }
            if (this.resizerCurrentWidths[this.resizerActiveIndex + 1] === 'auto') {
                ths = ths || this.resizerRefTable.current?.querySelectorAll('th');
                if (ths) {
                    this.resizerCurrentWidths[this.resizerActiveIndex + 1] =
                        ths[this.resizerActiveIndex + 1].offsetWidth;
                }
            }

            this.resizerOldWidth = this.resizerCurrentWidths[this.resizerActiveIndex] as number;
            this.resizerOldWidthNext = this.resizerCurrentWidths[this.resizerActiveIndex + 1] as number;

            window.addEventListener('mousemove', this.resizerMouseMove);
            window.addEventListener('mouseup', this.resizerMouseUp);
        }
    };

    render(): React.JSX.Element {
        if (this.props.ready === false) {
            return <Skeleton />;
        }

        const style = { gridTemplateColumns: this.resizerApplyWidths() };

        return (
            <Table
                stickyHeader={this.props.stickyHeader}
                size={this.props.size || 'small'}
                className={this.props.className}
                sx={this.props.sx}
                ref={this.resizerRefTable}
                style={{ ...(this.props.style || undefined), ...style }}
            >
                {this.props.children}
            </Table>
        );
    }
}
