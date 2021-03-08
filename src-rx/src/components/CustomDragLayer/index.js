
import React from 'react';
import { useDragLayer } from 'react-dnd';
import DrawerItem from '../DrawerItem';
import { withStyles } from '@material-ui/core/styles';

const layerStyles = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    width: '100%',
    height: '100%'
};

const snapToGrid = (x, y) => {
    const snappedX = Math.round(x / 32) * 32
    const snappedY = Math.round(y / 32) * 32
    return [snappedX, snappedY]
}

const getItemStyles = (initialOffset, currentOffset, isSnapToGrid) => {
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none'
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
        WebkitTransform: transform
    };
}

const styles = theme => ({
    root: {
        background: theme.palette.background.default,
    }
})
const CustomDragLayer = ({ classes }) => {
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
        targetIds: monitor.getTargetIds()
    }));

    const renderItem = () => {
        switch (itemType) {
            case 'box':
                return <div className={classes.root} style={{ width: 179, }}><DrawerItem
                    key={item.name}
                    editList={true}
                    visible={item.visible}
                    editListFunc={() => { }}
                    compact={item.compact}
                    // onClick={() => this.props.handleNavigation(tab.name)}
                    icon={item.iconJSX}
                    text={item.title}
                    selected={item.selected}
                    badgeContent={item.badgeContent}
                    badgeColor={item.badgeColor} /></div>;
            default:
                return null;
        }
    }

    if (!isDragging) {
        return null;
    }

    return <div style={layerStyles}>
        <div style={getItemStyles(initialOffset, currentOffset)}>
            {renderItem()}
        </div>
    </div>;
};

export default withStyles(styles)(CustomDragLayer);