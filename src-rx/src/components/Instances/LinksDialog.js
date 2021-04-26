import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';

const styles = theme => ({

});

class LinksDialog extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return <Dialog onClose={() => this.props.onClose()} open={true}>
            <DialogTitle>{this.props.t('Links')}</DialogTitle>
            <List>
                {this.props.links.map(link => (
                    <ListItem
                        button
                        onClick={e => {
                            e.stopPropagation();
                            window.open(link.link, this.props.instanceId);
                            this.props.onClose();
                        }}
                        key={link.name}
                    >
                        <ListItemAvatar>
                            <Avatar variant="rounded">
                                <img src={this.props.image} alt={this.props.instanceId}/>
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={link.name} />
                    </ListItem>
                ))}
            </List>
        </Dialog>;
    }
}

LinksDialog.propTypes = {
    links: PropTypes.array.isRequired,
    onClose: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    instanceId: PropTypes.string.isRequired,
    image: PropTypes.string,
};

export default withStyles(styles)(LinksDialog);