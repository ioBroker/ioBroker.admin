import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';
import {
    Grid,
    Tooltip,
    Typography,
} from '@mui/material';

const styles = () => ({
    nowrap:{
        flexFlow: 'nowrap',
        overflow: 'hidden',
    },
    width:{
        width:'100%',
        overflow: 'hidden',

    },
});
const InstanceInfo = props => <Grid
    item
    container
    title={props.icon ? '' : props.tooltip || ''}
    alignItems="center"
    direction="row"
    spacing={1}
    className={props.classes.nowrap}
>
    <Grid item>
        { props.icon &&
                <Tooltip title={props.tooltip || ''}>
                    { props.icon }
                </Tooltip>}
    </Grid>
    <Grid
        className={props.classes.width}
        item
    >
        <Tooltip title={props.tooltip || ''}>
            <Typography component="div">
                { props.children }
            </Typography>
        </Tooltip>
    </Grid>
</Grid>;

InstanceInfo.propTypes = {
    children: PropTypes.node,
    icon: PropTypes.node,
    tooltip: PropTypes.string,
};

export default withStyles(styles)(InstanceInfo);
