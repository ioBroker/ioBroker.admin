import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';

import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';

import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import Utils from "@iobroker/adapter-react/Components/Utils";

const CategoryLabel = (props) => {
    const [, drop] = useDrop(() => ({
        accept: ['enum'],
        drop: () => ({ enumId: props.categoryData._id }),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));

    const textColor = Utils.getInvertedColor(props.categoryData.common.color, props.themeType, true);

    return <span ref={drop} className={props.classes.categoryTitle} style={{color: textColor}}>
        {props.categoryData.common.icon ? <span
            className={ props.classes.icon }
            style={{ backgroundImage: 'url(' + props.categoryData.common.icon + ')' }}
        /> : null}
        {typeof props.categoryData.common.name === 'string' ? props.categoryData.common.name : props.categoryData.common.name.en}
        <IconButton
            size="small"
            style={{color: textColor}}
            onClick={() => {props.showEnumEditDialog(props.categoryData, false)}}
        >
            <Tooltip title={props.t('Edit')} placement="top">
                <EditIcon />
            </Tooltip>
        </IconButton>
        {props.categoryData.common.dontDelete ? null : <IconButton
            size="small"
            style={{color: textColor}}
            onClick={() => {props.showEnumDeleteDialog(props.categoryData)}}
        >
            <Tooltip title={props.t('Delete')} placement="top">
                <DeleteIcon />
            </Tooltip>
        </IconButton> }
    </span>;
}

CategoryLabel.propTypes = {
    categoryData: PropTypes.object,
    showEnumEditDialog: PropTypes.func,
    showEnumDeleteDialog: PropTypes.func,
    classes: PropTypes.object,
    t: PropTypes.func,
    lang: PropTypes.string,
    socket: PropTypes.object,
    themeType: PropTypes.string,
};

export default CategoryLabel;