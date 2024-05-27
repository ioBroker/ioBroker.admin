import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

import {
    Dialog,
    DialogContent,
    DialogActions,
    DialogTitle,
    Rating,
    Button,
    IconButton,
    InputAdornment,
    TextField,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    InputLabel,
    MenuItem,
    FormControl,
    Select,
    Typography,
} from '@mui/material';

import {
    HowToVote as VoteIcon,
    Close as CloseIcon,
    Info as InfoIcon,
} from '@mui/icons-material';

const styles = theme => ({
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
        // maxHeight: 200,
    },
    listOwn: {
        backgroundColor: theme.name === 'colored' || theme.name === 'light' ? '#16516e2e' : theme.palette.secondary.dark,
    },
    listTitle: {
        backgroundColor: theme.palette.primary.dark,
        paddingTop: 4,
        paddingBottom: 4,
        marginBottom: 4,
        color: '#ffffff',
        textAlign: 'center',
    },
    languageFilter: {
        width: 300,
    },
    ratingTextControl: {
        width: 'calc(100% - 138px)',
        marginRight: 8,
    },
    ratingLanguageControl: {
        width: 130,
    },
    noComments: {
        width: '100%',
        textAlign: 'center',
        marginTop: theme.spacing(2),
    },
    commentCount: {
        marginTop: 2,
        marginLeft: theme.spacing(1),
        opacity: 0.8,
        fontSize: 10,
        float: 'right',
    },
    infoText: {
        textAlign: 'left',
        fontSize: '14px',
    },
    infoTextContainer: {
        display: 'flex',
        paddingBottom: '10px',
        alignItems: 'center',
        gap: '10px',
    },
});

const LANGUAGES = [
    {
        id: 'en',
        title: 'English',
    },
    {
        id: 'de',
        title: 'Deutsch',
    },
    {
        id: 'ru',
        title: 'русский',
    },
    {
        id: 'pt',
        title: 'Portugues',
    },
    {
        id: 'nl',
        title: 'Nederlands',
    },
    {
        id: 'fr',
        title: 'français',
    },
    {
        id: 'it',
        title: 'Italiano',
    },
    {
        id: 'es',
        title: 'Espanol',
    },
    {
        id: 'pl',
        title: 'Polski',
    },
    {
        id: 'uk',
        title: 'Українська',
    },
    {
        id: 'zh-ch',
        title: '简体中文',
    },
];

class RatingDialog extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ratingNumber: 0,
            ratingComment: '',
            votings: null,
            ratingLang: this.props.lang,
            filterLang: (window._localStorage || window.localStorage).getItem('app.commentLang') || this.props.lang,
            commentsByLanguage: {},
        };
    }

    componentDidMount() {
        fetch(`https://rating.iobroker.net/adapter/${this.props.adapter}?uuid=${this.props.uuid}`)
            .then(res => res.json())
            .then(votings => {
                votings = votings || {};
                votings.rating = votings.rating || {};
                const versions = Object.keys(votings.rating);
                versions.sort((a, b) => (votings.rating[a].ts > votings.rating[b].ts ? -1 : (votings.rating[a].ts < votings.rating[b].ts ? 1 : 0)));
                const commentsByLanguage = {};

                if (votings.comments) {
                    votings.comments.sort((a, b) => (a.ts > b.ts ? -1 : (a.ts < b.ts ? 1 : 0)));

                    votings.comments.forEach(comment => {
                        commentsByLanguage[comment.lang] = commentsByLanguage[comment.lang] || 0;
                        commentsByLanguage[comment.lang]++;
                    });
                }

                if (versions.length) {
                    const item = votings.rating[versions[0]];
                    this.setState({ votings, ratingNumber: item ? item.r : 0, commentsByLanguage });
                } else {
                    this.setState({ votings, commentsByLanguage });
                }
            });
    }

    setAdapterRating(adapter, version, rating, comment, lang) {
        return fetch('https://rating.iobroker.net/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            body: JSON.stringify({
                uuid: this.props.uuid, adapter, version, rating, comment, lang,
            }),
        })
            .then(res => res.json())
            .then(update => {
                window.alert(`${this.props.t('Vote:')} ${adapter}@${version}=${rating}`);
                const repository = JSON.parse(JSON.stringify(this.props.repository));
                repository[adapter].rating = update;
                return repository;
            })
            .catch(e => {
                window.alert(`Cannot vote: ${e}`);
                return null;
            });
    }

    /**
     * Renders the info text component, which explains the rating section
     *
     * @return {JSX.Element}
     */
    renderInfoText() {
        return <div className={this.props.classes.infoTextContainer}>
            <InfoIcon />
            <Typography className={this.props.classes.infoText}>{this.props.t('use GitHub for issues')}</Typography>
        </div>;
    }

    renderComments() {
        if (this.state.votings?.comments && this.state.votings.comments.length) {
            const found = this.state.votings.comments.find(comment =>
                !(this.state.filterLang && this.state.filterLang !== '_' && comment.lang !== this.state.filterLang));

            return <div style={{ width: '100%', textAlign: 'left' }}>
                <h3 className={this.props.classes.listTitle}>{this.props.t('Comments')}</h3>
                <FormControl variant="standard" className={this.props.classes.languageFilter}>
                    <InputLabel>{this.props.t('Show comments in language')}</InputLabel>
                    <Select
                        variant="standard"
                        value={this.state.filterLang}
                        onChange={e => {
                            (window._localStorage || window.localStorage).setItem('app.commentLang', e.target.value);
                            this.setState({ filterLang: e.target.value });
                        }}
                    >
                        <MenuItem value="_">
                            {this.props.t('All')}
                            {' '}
                            <span className={this.props.classes.commentCount}>{this.state.votings.comments.length}</span>
                        </MenuItem>
                        {LANGUAGES.map(item => <MenuItem
                            key={item.id}
                            value={item.id}
                        >
                            {item.title}
                            {' '}
                            {this.state.commentsByLanguage[item.id] ? <span className={this.props.classes.commentCount}>{this.state.commentsByLanguage[item.id]}</span> : null}
                        </MenuItem>)}
                    </Select>
                </FormControl>
                <List classes={{ root: this.props.classes.list }} dense disablePadding>
                    {found && this.state.votings.comments.map((comment, i) => {
                        if (this.state.filterLang && this.state.filterLang !== '_' && comment.lang !== this.state.filterLang) {
                            return null;
                        }
                        return comment ? <ListItem
                            key={i}
                            title={comment.uuid ? this.props.t('Your comment') : ''}
                            classes={{ root: comment.uuid ? this.props.classes.listOwn : undefined }}
                            dense
                        >
                            <ListItemAvatar classes={{ root: this.props.classes.listRating }}>
                                <Rating readOnly defaultValue={comment.rating} size="small" />
                            </ListItemAvatar>
                            <ListItemText
                                primary={comment.comment}
                                secondary={`${new Date(comment.ts).toLocaleString()} / v${comment.version}`}
                                classes={{ secondary: this.props.classes.listTime }}
                            />
                        </ListItem> : null;
                    })}
                    {!found && <div className={this.props.classes.noComments}>{this.props.t('No comments in selected language')}</div>}
                </List>
            </div>;
        }
        return null;
    }

    render() {
        let item;
        let versions;
        if (this.state.votings) {
            const votings = this.state.votings.rating;
            versions = Object.keys(votings);
            versions.sort((a, b) => (votings[a].ts > votings[b].ts ? -1 : (votings[a].ts < votings[b].ts ? 1 : 0)));
            if (versions.length) {
                item = votings[versions[0]];
            }
        }

        return <Dialog
            open={!0}
            onClose={() => this.props.onClose()}
        >
            <DialogTitle>{`${this.props.t('Review')} ${this.props.adapter}${this.props.version ? `@${this.props.version}` : ''}`}</DialogTitle>
            <DialogContent style={{ textAlign: 'center' }} title={(this.props.currentRating && this.props.currentRating.title) || ''}>
                {this.renderInfoText()}
                <Rating
                    className={this.props.classes.rating}
                    name={this.props.adapter}
                    value={this.props.version ? this.state.ratingNumber : this.props.currentRating?.rating && this.props.currentRating.rating.r}
                    size="large"
                    readOnly={!this.props.version}
                    onChange={(event, newValue) =>
                        this.setState({ ratingNumber: newValue })}
                />
                {this.props.version ? <div style={{ width: '100%', textAlign: 'left' }}>
                    <TextField
                        variant="standard"
                        className={this.props.classes.ratingTextControl}
                        value={this.state.ratingComment}
                        label={this.props.t('Comment to version')}
                        inputProps={{ maxLength: 200 }}
                        helperText={this.props.t('Max length %s characters', 200)}
                        onChange={e =>
                            this.setState({ ratingComment: e.target.value })}
                        // eslint-disable-next-line react/jsx-no-duplicate-props
                        InputProps={{
                            endAdornment: this.state.ratingComment ? <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={() => this.setState({ ratingComment: '' })}
                                >
                                    <CloseIcon />
                                </IconButton>
                            </InputAdornment> : null,
                        }}
                    />
                    <FormControl variant="standard" className={this.props.classes.ratingLanguageControl}>
                        <InputLabel>{this.props.t('Language')}</InputLabel>
                        <Select
                            variant="standard"
                            value={this.state.ratingLang}
                            onChange={e => this.setState({ ratingLang: e.target.value })}
                        >
                            {LANGUAGES.map(it => <MenuItem key={it.id} value={it.id}>{it.title}</MenuItem>)}
                        </Select>
                    </FormControl>
                </div> : null}
                {this.props.version ?
                    <div style={{ paddingTop: 20, paddingBottom: 16 }}>{this.props.t('Rate how good this version of the adapter works on your system. You can vote for every new version.')}</div>
                    : null}

                {versions && item ? <div>{this.props.t('You voted for %s on %s', versions[0], new Date(item.ts).toLocaleDateString())}</div> : null}
                {this.renderComments()}
            </DialogContent>
            <DialogActions>
                {this.props.version && <Button
                    variant="contained"
                    autoFocus
                    color="primary"
                    disabled={!this.state.ratingNumber || this.state.votings === null}
                    onClick={() => {
                        if (this.state.ratingNumber !== item?.r || this.state.ratingComment) {
                            this.setAdapterRating(this.props.adapter, this.props.version, this.state.ratingNumber, this.state.ratingComment, this.state.ratingLang)
                                .then(repository => this.props.onClose(repository));
                        } else {
                            this.props.onClose();
                        }
                    }}
                    startIcon={<VoteIcon />}
                >
                    {this.props.t('Rate')}
                </Button>}
                <Button
                    autoFocus={!this.props.version}
                    variant="contained"
                    onClick={() => this.props.onClose()}
                    color="grey"
                    startIcon={<CloseIcon />}
                >
                    {this.props.t('Close')}
                </Button>
            </DialogActions>
        </Dialog>;
    }
}

RatingDialog.propTypes = {
    t: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
    uuid: PropTypes.string.isRequired,
    version: PropTypes.string,
    currentRating: PropTypes.object,
    adapter: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    repository: PropTypes.object,
};

export default withStyles(styles)(RatingDialog);
