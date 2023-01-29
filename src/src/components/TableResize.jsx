/**
 * Copyright 2022, bluefox <dogafox@gmail.com>
 *
 * MIT License
 *
 **/
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles} from '@mui/styles';

import Table from '@mui/material/Table';
import Skeleton from '@mui/material/Skeleton';

const styles = theme => ({
    table: {
        display: 'grid',
        '& tr': {
            display: 'contents',
        },
        '& thead': {
            display: 'contents',
        },
        '& tbody': {
            display: 'contents',
        },
        '& th': { // resizer
            position: 'sticky',
            userSelect: 'none',
        },
        '& .resize-handle': { // resizer
            display: 'block',
            position: 'absolute',
            cursor: 'col-resize',
            width: 7,
            right: 0,
            top: 2,
            bottom: 2,
            zIndex: 1,
            borderRight: '2px dotted #888',
            '&:hover': {
                borderColor: '#ccc',
                borderRightStyle: 'solid',
            }
            , '&.active': {
                borderColor: '#517ea5',
                borderRightStyle: 'solid',
            }
        }
    },
});

class TableResize extends Component {
    constructor(props) {
        super(props);
        this.resizerRefTable = React.createRef();
        this.resizerActiveIndex = null;
        this.resizerActiveDiv = null;
        this.resizerCurrentWidths = [];
    }

    componentDidMount() {
        this.resizerInstall();
    }

    componentWillUnmount() {
        this.resizerUninstall();
    }

    resizerInstall() {
        if (this.resizerRefTable.current && !this.resizerRefTable.current._installed) {
            this.resizerRefTable.current._installed = true;
            const ths = this.resizerRefTable.current.querySelectorAll('th');

            const widthsStored = (window._localStorage || window.localStorage).getItem(`App.${this.props.name || 'history'}.table`);
            this.widthFilled = false;

            if (widthsStored) {
                try {
                    this.resizerCurrentWidths = JSON.parse(widthsStored);
                    this.widthFilled = true;
                } catch (e) {
                    // ignore
                }
            }
            if (this.widthFilled) {
                if (this.resizerCurrentWidths.length !== ths.length) {
                    this.resizerCurrentWidths = [];
                    this.widthFilled = false;
                } else {
                    const tableWidth = this.resizerRefTable.current.offsetWidth;
                    let storedWidth = 0;
                    for (let w = 0; w < this.resizerCurrentWidths.length; w++) {
                        if (isFinite(this.resizerCurrentWidths[w])) {
                            storedWidth += this.resizerCurrentWidths[w];
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

                // last column does need handle
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
                this.resizerInstall()
            }, 100);
        }
    }

    resizerReset = () => {
        for (let c = 0; c < this.resizerCurrentWidths.length; c++) {
            this.resizerCurrentWidths[c] = (this.props.initialWidths || [])[c] || 'auto';
        }

        (window._localStorage || window.localStorage).setItem(`App.${this.props.name || 'history'}.table`, JSON.stringify(this.resizerCurrentWidths));
        this.resizerApplyWidths();
    }

    resizerUninstall() {
        this.installTimeout && clearTimeout(this.installTimeout);

        // resizer
        if (this.resizerRefTable.current && this.resizerRefTable.current._installed) {
            this.resizerRefTable.current._installed = true;
            const ths = this.resizerRefTable.current.querySelectorAll('th');
            for (let i = 0; i < ths.length; i++) {
                const div = ths[i].querySelector('.resize-handle');
                if (div) {
                    div.onmousedown = null;
                    div.remove();
                }
            }
        }
    }

    resizerApplyWidths() {
        const gridTemplateColumns = [];
        if (this.resizerCurrentWidths.length) {
            for (let c = 0; c < this.resizerCurrentWidths.length; c++) {
                if (this.resizerCurrentWidths[c]) {
                    gridTemplateColumns.push(this.resizerCurrentWidths[c] !== 'auto' ? this.resizerCurrentWidths[c] + 'px' : 'auto');
                } else if (this.props.initialWidths && this.props.initialWidths[c]) {
                    gridTemplateColumns.push(this.props.initialWidths[c] !== 'auto' ? this.props.initialWidths[c] + 'px' : 'auto');
                } else {
                    gridTemplateColumns.push('auto');
                }
            }
        } else if (this.props.initialWidths) {
            for (let c = 0; c < this.props.initialWidths.length; c++) {
                if (this.props.initialWidths[c]) {
                    gridTemplateColumns.push(this.props.initialWidths[c] !== 'auto' ? this.props.initialWidths[c] + 'px' : 'auto');
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

    resizerMouseMove = e => {
        if (this.resizerActiveDiv) {
            const width = this.resizerOldWidth + e.clientX - this.resizerPosition;
            const widthNext = this.resizerOldWidthNext - e.clientX + this.resizerPosition;
            if ((!this.resizerMin     || width     > this.resizerMin) &&
                (!this.resizerMinNext || widthNext > this.resizerMinNext)) {
                this.resizerCurrentWidths[this.resizerActiveIndex] = width;
                this.resizerCurrentWidths[this.resizerActiveIndex + 1] = widthNext;
                this.resizerApplyWidths();
            }
        }
    }

    resizerMouseUp = () => {
        (window._localStorage || window.localStorage).setItem(`App.${this.props.name || 'history'}.table`, JSON.stringify(this.resizerCurrentWidths));

        this.resizerActiveIndex = null;
        this.resizerActiveDiv = null;
        window.removeEventListener('mousemove', this.resizerMouseMove);
        window.removeEventListener('mouseup', this.resizerMouseUp);
    }

    resizerMouseDown = e => {
        if (this.resizerActiveIndex === null || this.resizerActiveIndex === undefined) {
            console.log('Mouse down ' + e.target.dataset.index);
            this.resizerActiveIndex = parseInt(e.target.dataset.index, 10);
            this.resizerActiveDiv = e.target;
            this.resizerMin = this.props.minWidths ? this.props.minWidths[this.resizerActiveIndex] : 0;
            this.resizerMinNext = this.props.minWidths ? this.props.minWidths[this.resizerActiveIndex + 1] : 0;
            this.resizerPosition = e.clientX;
            let ths;
            if (this.resizerCurrentWidths[this.resizerActiveIndex] === 'auto') {
                ths = ths || this.resizerRefTable.current.querySelectorAll('th');
                this.resizerCurrentWidths[this.resizerActiveIndex] = ths[this.resizerActiveIndex].offsetWidth;
            }
            if (this.resizerCurrentWidths[this.resizerActiveIndex + 1] === 'auto') {
                ths = ths || this.resizerRefTable.current.querySelectorAll('th');
                this.resizerCurrentWidths[this.resizerActiveIndex + 1] = ths[this.resizerActiveIndex + 1].offsetWidth;
            }

            this.resizerOldWidth = this.resizerCurrentWidths[this.resizerActiveIndex];
            this.resizerOldWidthNext = this.resizerCurrentWidths[this.resizerActiveIndex + 1];

            window.addEventListener('mousemove', this.resizerMouseMove);
            window.addEventListener('mouseup', this.resizerMouseUp);
        }
    };

    render() {
        if (this.props.ready === false) {
            return <Skeleton />;
        }

        const style = { gridTemplateColumns: this.resizerApplyWidths() };

        return <Table
            stickyHeader={this.props.stickyHeader}
            size={this.props.size || 'small'}
            className={ this.props.classes.table + (this.props.className ? ' ' + this.props.className : '')}
            ref={ this.resizerRefTable }
            style={ Object.assign({}, this.props.style || {}, style) }
        >
            { this.props.children }
        </Table>;
    }
}

TableResize.propTypes = {
    name: PropTypes.string,
    ready: PropTypes.bool,
    stickyHeader: PropTypes.bool,
    size: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object,
    initialWidths: PropTypes.array,
    minWidths: PropTypes.array,
    dblTitle: PropTypes.string,
};

export default withStyles(styles)(TableResize);