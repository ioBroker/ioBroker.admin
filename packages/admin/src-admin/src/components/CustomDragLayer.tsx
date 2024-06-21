import React from 'react';
import { useDragLayer } from 'react-dnd';

import { Box } from '@mui/material';

import type { IobTheme } from '@iobroker/adapter-react-v5';

import DrawerItem from './DrawerItem';

const layerStyles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
};

function snapToGrid(x: number, y: number) {
    const snappedX = Math.round(x / 32) * 32;
    const snappedY = Math.round(y / 32) * 32;
    return [snappedX, snappedY];
}

function getItemStyles(
    initialOffset: { x: number; y: number },
    currentOffset: { x: number; y: number },
    isSnapToGrid?: boolean,
): React.CSSProperties {
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none',
        };
    }
    let { x, y } = currentOffset;
    if (isSnapToGrid) {
        x -= initialOffset.x;
        y -= initialOffset.y;
        [x, y] = snapToGrid(x, y);
        x += initialOffset.x;
        y += initialOffset.y;
    }
    const transform = `translate(${x}px, ${y}px)`;
    return {
        transform,
        WebkitTransform: transform,
    };
}

const styles: Record<string, any> = {
    root: (theme: IobTheme) => ({
        background: theme.palette.background.default,
    }),
};

function CustomDragLayer()  {
    const {
        itemType,
        isDragging,
        item,
        initialOffset,
        currentOffset,
        // targetIds
    } = useDragLayer(monitor => ({
        item: monitor.getItem(),
        itemType: monitor.getItemType(),
        initialOffset: monitor.getInitialSourceClientOffset(),
        currentOffset: monitor.getSourceClientOffset(),
        isDragging: monitor.isDragging(),
        // targetIds: monitor.getTargetIds(),
    }));

    function renderItem() {
        if (itemType === 'box') {
            return <Box component="div" sx={styles.root} style={{ width: 179 }}>
                <DrawerItem
                    key={item.name}
                    visible={item.visible}
                    editListFunc={() => undefined}
                    compact={item.compact}
                    icon={item.iconJSX}
                    text={item.title}
                    selected={item.selected}
                    badgeContent={item.badgeContent}
                    badgeColor={item.badgeColor}
                />
            </Box>;
        }
        return null;
    }

    if (!isDragging) {
        return null;
    }

    return <div style={layerStyles}>
        <div style={getItemStyles(initialOffset, currentOffset)}>
            {renderItem()}
        </div>
    </div>;
}

export default CustomDragLayer;
