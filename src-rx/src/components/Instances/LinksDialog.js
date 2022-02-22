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

import Utils from '../Utils';

const styles = theme => ({
    img: {
        width: '100%',
        height: '100%',
    }
});

class LinksDialog extends Component {
    render() {
        if (!this.props.links || !this.props.links.length) {
            return null;
        }
        const firstPort = this.props.links[0].port;
        const showPort = this.props.links.find(item => item.port !== firstPort);

        return <Dialog onClose={() => this.props.onClose()} open={true}>
            <DialogTitle>{this.props.t('Links')}</DialogTitle>
            <List>
                {this.props.links.map(link => <ListItem
                    button
                    style={link.color ? {
                        backgroundColor: link.color,
                        color: Utils.getInvertedColor(link.color, this.props.themeType, true)
                    } : {}}
                    onClick={e => {
                        e.stopPropagation();
                        // replace IPv6 Address with [ipv6]:port
                        let url = link.link;
                        url = url.replace(/\/\/([0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*)(:\d+)?\//i, '//[$1]$2/');
                        window.open(url, this.props.instanceId);
                        this.props.onClose();
                    }}
                    key={link.name}
                >
                    <ListItemAvatar>
                        <Avatar variant="rounded">
                            <img className={this.props.classes.img} src={this.props.image} alt={this.props.instanceId}/>
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={link.name + (showPort ? ' [:' + link.port + ']' : '')} />
                </ListItem>)}
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
    themeType: PropTypes.string,
};

export default withStyles(styles)(LinksDialog);