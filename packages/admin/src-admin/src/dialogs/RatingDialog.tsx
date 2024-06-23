import React, { Component } from 'react';

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
    Typography, Box,
} from '@mui/material';

import {
    HowToVote as VoteIcon,
    Close as CloseIcon,
    Info as InfoIcon,
} from '@mui/icons-material';

import type { IobTheme, Translate } from '@iobroker/adapter-react-v5';

const styles: Record<string, any> = {
    rating: {
        marginBottom: 20,
    },
    listRating: {
        marginRight: 8,
    },
    listTime: {
        opacity: 0.5,
        fontStyle: 'italic',
    },
    list: {
        // maxHeight: 200,
    },
    listOwn: (theme: IobTheme) => ({
        backgroundColor: theme.name === 'colored' || theme.name === 'light' ? '#16516e2e' : theme.palette.secondary.dark,
    }),
    listTitle: (theme: IobTheme) => ({
        backgroundColor: theme.palette.primary.dark,
        pt: '4px',
        pb: '4px',
        mb: '4px',
        color: '#ffffff',
        textAlign: 'center',
    }),
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
        marginTop: 16,
    },
    commentCount: {
        marginTop: 2,
        marginLeft: 8,
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
};

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
// {
//     "adapter": "history",
//     "rating": {
//     "r": 3.5,
//         "c": 20
//     },
//     "3.0.1": {
//         "r": 3.8,
//         "c": 5
//     }
// }
export interface RatingDialogRepository {
    rating: {
        r: number;
        ts: number;
    };
    [version: string]: {
        r: number;
        ts: number;
    };
}

interface RatingDialogVotings {
    rating?: Record<string, { r: number; ts: number }>;
    comments?: Array<{ comment: string; lang: string; rating: number; ts: number; uuid: string; version: string }>;
}

interface RatingDialogProps {
    t: Translate;
    lang: string;
    uuid: string;
    version: string;
    currentRating: { rating?: { r: number; c: number }; title: string };
    adapter: string;
    onClose: (update?: RatingDialogRepository) => void;
}

interface RatingDialogState {
    ratingNumber: number;
    ratingComment: string;
    votings: RatingDialogVotings;
    ratingLang: string;
    filterLang: string;
    commentsByLanguage: Record<string, number>;
}

class RatingDialog extends Component<RatingDialogProps, RatingDialogState> {
    constructor(props: RatingDialogProps) {
        super(props);

        this.state = {
            ratingNumber: 0,
            ratingComment: '',
            votings: null,
            ratingLang: this.props.lang,
            filterLang: ((window as any)._localStorage as Storage || window.localStorage).getItem('app.commentLang') || this.props.lang,
            commentsByLanguage: {},
        };
    }

    componentDidMount() {
        fetch(`https://rating.iobroker.net/adapter/${this.props.adapter}?uuid=${this.props.uuid}`)
            .then(res => res.json())
            .then((votings: RatingDialogVotings) => {
                votings = votings || {};
                votings.rating = votings.rating || {};
                const versions = Object.keys(votings.rating);
                versions.sort((a, b) => (votings.rating[a].ts > votings.rating[b].ts ? -1 : (votings.rating[a].ts < votings.rating[b].ts ? 1 : 0)));
                const commentsByLanguage: Record<string, number> = {};

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

    setAdapterRating(
        adapter: string,
        version: string,
        rating: number,
        comment: string,
        lang: string,
    ): Promise<RatingDialogRepository> {
        return fetch('https://rating.iobroker.net/vote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            redirect: 'follow',
            body: JSON.stringify({
                uuid: this.props.uuid,
                adapter,
                version,
                rating,
                comment,
                lang,
            }),
        })
            .then(res => res.json())
            .then((update: RatingDialogRepository & { adapter: string }) => {
                window.alert(`${this.props.t('Vote:')} ${adapter}@${version}=${rating}`);
                delete update.adapter;
                return update;
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
        return <div style={styles.infoTextContainer}>
            <InfoIcon />
            <Typography style={styles.infoText}>{this.props.t('use GitHub for issues')}</Typography>
        </div>;
    }

    renderComments() {
        if (this.state.votings?.comments && this.state.votings.comments.length) {
            const found = this.state.votings.comments.find(comment =>
                !(this.state.filterLang && this.state.filterLang !== '_' && comment.lang !== this.state.filterLang));

            return <div style={{ width: '100%', textAlign: 'left' }}>
                <Box component="h3" sx={styles.listTitle}>{this.props.t('Comments')}</Box>
                <FormControl variant="standard" style={styles.languageFilter}>
                    <InputLabel>{this.props.t('Show comments in language')}</InputLabel>
                    <Select
                        variant="standard"
                        value={this.state.filterLang}
                        onChange={e => {
                            ((window as any)._localStorage as Storage || window.localStorage).setItem('app.commentLang', e.target.value);
                            this.setState({ filterLang: e.target.value });
                        }}
                    >
                        <MenuItem value="_">
                            {this.props.t('All')}
                            {' '}
                            <span style={styles.commentCount}>{this.state.votings.comments.length}</span>
                        </MenuItem>
                        {LANGUAGES.map(item => <MenuItem
                            key={item.id}
                            value={item.id}
                        >
                            {item.title}
                            {' '}
                            {this.state.commentsByLanguage[item.id] ? <span style={styles.commentCount}>{this.state.commentsByLanguage[item.id]}</span> : null}
                        </MenuItem>)}
                    </Select>
                </FormControl>
                <List style={styles.list} dense disablePadding>
                    {found && this.state.votings.comments.map((comment, i) => {
                        if (this.state.filterLang && this.state.filterLang !== '_' && comment.lang !== this.state.filterLang) {
                            return null;
                        }
                        return comment ? <ListItem
                            key={i}
                            title={comment.uuid ? this.props.t('Your comment') : ''}
                            sx={{ '&.MuiListItem-root': comment.uuid ? styles.listOwn : undefined }}
                            dense
                        >
                            <ListItemAvatar style={styles.listRating}>
                                <Rating readOnly defaultValue={comment.rating} size="small" />
                            </ListItemAvatar>
                            <ListItemText
                                primary={comment.comment}
                                secondary={`${new Date(comment.ts).toLocaleString()} / v${comment.version}`}
                                sx={{ '& .MuiListItemText-secondary': styles.listTime }}
                            />
                        </ListItem> : null;
                    })}
                    {!found && <div style={styles.noComments}>{this.props.t('No comments in selected language')}</div>}
                </List>
            </div>;
        }
        return null;
    }

    render() {
        let item: { r: number; ts: number };
        let versions: string[];
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
            <DialogContent style={{ textAlign: 'center' }} title={this.props.currentRating?.title || ''}>
                {this.renderInfoText()}
                <Rating
                    style={styles.rating}
                    name={this.props.adapter}
                    value={this.props.version ? this.state.ratingNumber : this.props.currentRating?.rating?.r}
                    size="large"
                    readOnly={!this.props.version}
                    onChange={(event, newValue) =>
                        this.setState({ ratingNumber: newValue })}
                />
                {this.props.version ? <div style={{ width: '100%', textAlign: 'left' }}>
                    <TextField
                        variant="standard"
                        style={styles.ratingTextControl}
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
                    <FormControl variant="standard" style={styles.ratingLanguageControl}>
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
                                .then(update => this.props.onClose(update));
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

export default RatingDialog;
