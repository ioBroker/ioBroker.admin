import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogActions from '@material-ui/core/DialogActions';
import DialogTitle from '@material-ui/core/DialogTitle';
import Rating from '@material-ui/lab/Rating';
import { Button, TextField } from '@material-ui/core';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';

import VoteIcon from '@material-ui/icons/HowToVote';
import CloseIcon from '@material-ui/icons/Close';

const styles = theme => ({
        buttonIcon: {
            marginRight: theme.spacing(1),
        },
        rating: {
            marginBottom: 20,
        },
        listRating: {
            marginRight: theme.spacing(1),
        },
        listTime: {
            opacity: 0.5,
            fontStyle: 'italic',
        },
        list: {
            //maxHeight: 200,
        },
        listOwn: {
            backgroundColor: theme.name === 'colored' || theme.name === 'light' ? '#16516e2e' : theme.palette.secondary.dark
        },
        listTitle: {
            backgroundColor: theme.palette.primary.dark,
            paddingTop: 4,
            paddingBottom: 4,
            marginBottom: 4,
            color: '#ffffff'
        }
    }
);

class RatingDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ratingNumber: 0,
            ratingComment: '',
            votings: null
        };
    }

    componentDidMount() {
        fetch('https://rating.iobroker.net/adapter/' + this.props.adapter + '?uuid=' + this.props.uuid)
            .then(res => res.json())
            .then(votings => {
                votings = votings || {};
                votings.rating = votings.rating || {};
                const versions = Object.keys(votings.rating);
                versions.sort((a, b) => votings.rating[a].ts > votings.rating[b].ts ? -1 : (votings.rating[a].ts < votings.rating[b].ts ? 1 : 0));
                votings.comments && votings.comments.sort((a, b) => a.ts > b.ts ? -1 : (a.ts < b.ts ? 1 : 0));
                if (versions.length) {
                    const item = votings.rating[versions[0]];
                    this.setState({ votings, ratingNumber: item ? item.r : 0 });
                } else {
                    this.setState({ votings });
                }
            });
    }

    setAdapterRating(adapter, version, rating, comment) {
        return fetch('https://rating.iobroker.net/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            body: JSON.stringify({ uuid: this.props.uuid, adapter, version, rating, comment })
        })
            .then(res => res.json())
            .then(update => {
                window.alert(this.props.t('Vote:') + ' ' + adapter + '@' + version + '=' + rating);
                const repository = JSON.parse(JSON.stringify(this.props.repository));
                repository[adapter].rating = update;
                return repository;
            })
            .catch(e => {
                window.alert('Cannot vote: ' + e);
                return null;
            });
    }

    renderComments() {
        if (this.state.votings?.comments) {
            return <div style={{ width: '100%' }}>
                <h3 className={this.props.classes.listTitle}>{this.props.t('Comments')}</h3>
                <List classes={{ root: this.props.classes.list }} dense disablePadding>
                    {this.state.votings.comments.map(comment => <ListItem
                        title={comment.uuid ? this.props.t('Your comment') : ''}
                        classes={{ root: comment.uuid ? this.props.classes.listOwn : undefined }} dense>
                        <ListItemAvatar classes={{ root: this.props.classes.listRating }}>
                            <Rating readOnly defaultValue={comment.rating} size="small" />
                        </ListItemAvatar>
                        <ListItemText
                            primary={comment.comment}
                            secondary={new Date(comment.ts).toLocaleString() + ' / v' + comment.version}
                            classes={{ secondary: this.props.classes.listTime }}
                        />
                    </ListItem>)}
                </List>
            </div>
        } else {
            return null;
        }
    }

    render() {
        let item;
        let versions;
        if (this.state.votings) {
            const votings = this.state.votings.rating;
            versions = Object.keys(votings);
            versions.sort((a, b) => votings[a].ts > votings[b].ts ? -1 : (votings[a].ts < votings[b].ts ? 1 : 0));
            if (versions.length) {
                item = votings[versions[0]];
            }
        }

        return <Dialog
            open={true}
            onClose={() => this.props.onClose()}
        >
            <DialogTitle>{this.props.t('Review') + ' ' + this.props.adapter + '@' + this.props.version}</DialogTitle>
            <DialogContent style={{ textAlign: 'center' }}>
                <Rating
                    className={this.props.classes.rating}
                    name={this.props.adapter}
                    value={this.state.ratingNumber}
                    size="large"
                    onChange={(event, newValue) =>
                        this.setState({ ratingNumber: newValue })}
                />
                <br />
                <TextField
                    fullWidth
                    value={this.state.ratingComment}
                    label={this.props.t('Comment to version')}
                    inputProps={{ maxLength: 200 }}
                    helperText={this.props.t('Max length %s characters', 200)}
                    onChange={e =>
                        this.setState({ ratingComment: e.target.value })}
                />
                <div style={{ paddingTop: 20, paddingBottom: 16 }}>{this.props.t('Rate how good this version of the adapter works on your system. You can vote for every new version.')}</div>

                {versions && item ? <div>{this.props.t('You voted for %s on %s', versions[0], new Date(item.ts).toLocaleDateString())}</div> : null}
                {this.renderComments()}
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    autoFocus
                    color="primary"
                    disabled={!this.state.ratingNumber || this.state.votings === null}
                    onClick={() => {
                        if (this.state.ratingNumber !== item?.r || this.state.ratingComment) {
                            this.setAdapterRating(this.props.adapter, this.props.version, this.state.ratingNumber, this.state.ratingComment)
                                .then(repository => this.props.onClose(repository));
                        } else {
                            this.props.onClose();
                        }
                    }}
                >
                    <VoteIcon className={this.props.classes.buttonIcon} />{this.props.t('Rate')}
                </Button>
                <Button
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    color="default">
                    <CloseIcon className={this.props.classes.buttonIcon} />{this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

RatingDialog.propTypes = {
    t: PropTypes.func.isRequired,
    uuid: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired,
    adapter: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    repository: PropTypes.object,
};

export default withStyles(styles)(RatingDialog);
