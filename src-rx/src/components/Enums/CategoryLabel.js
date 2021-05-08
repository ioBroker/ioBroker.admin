import { useDrop } from 'react-dnd';
import Color from 'color';
import PropTypes from 'prop-types';

import IconButton from '@material-ui/core/IconButton';

import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';

const CategoryLabel = (props) => {
    const [, drop] = useDrop(() => ({
        accept: ['enum'],
        drop: () => ({ enum_id: props.categoryData._id }),
        collect: (monitor) => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));

    let textColor = null
    if (props.categoryData.common.color) {
        textColor = Color(props.categoryData.common.color).hsl().object().l > 50 ? '#000000' : '#FFFFFF';
    }

    return <span ref={drop} className={props.classes.categoryTitle} style={{color: textColor}}>
        {props.categoryData.common.icon ? <span
            className={ props.classes.icon }
            style={{ backgroundImage: "url(" + props.categoryData.common.icon + ")" }}
        /> : null}
        {typeof props.categoryData.common.name === 'string' ? props.categoryData.common.name : props.categoryData.common.name.en}
        <IconButton
            size="small"
            style={{color: props.categoryData.common.color ? textColor : null}}
            onClick={()=>{props.showEnumEditDialog(props.categoryData, false)}}
        >
            <EditIcon />
        </IconButton>
        {props.categoryData.common.dontDelete ? null : <IconButton
            size="small"
            style={{color: props.categoryData.common.color ? textColor : null}}
            onClick={()=>{props.showEnumDeleteDialog(props.categoryData)}}
        >
            <DeleteIcon />
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
};

export default CategoryLabel;