import React, { Component, type JSX } from 'react';

import { List, ListItemButton, ListItemText, DialogTitle, Dialog, ListItemAvatar, Avatar } from '@mui/material';

import { I18n, type ThemeType, type Translate, Utils } from '@iobroker/adapter-react-v5';

import AdminUtils from '../../AdminUtils';

const styles: Record<string, React.CSSProperties> = {
    img: {
        width: '100%',
        height: '100%',
    },
};

export interface InstanceLink {
    name?: ioBroker.StringOrTranslated;
    link: string;
    port?: number;
    color?: string;
}

interface LinksDialogProps {
    links: InstanceLink[];
    onClose: () => void;
    t: Translate;
    instanceId: string;
    image: string;
    themeType: ThemeType;
}

class LinksDialog extends Component<LinksDialogProps> {
    render() {
        if (!this.props.links || !this.props.links.length) {
            return null;
        }
        const firstPort = this.props.links[0].port;
        const showPort = this.props.links.find(item => item.port !== firstPort);

        return (
            <Dialog
                onClose={() => this.props.onClose()}
                open={!0}
            >
                <DialogTitle style={{ padding: '8px 0 0 0', textAlign: 'center' }}>{this.props.t('Links')}</DialogTitle>
                <List>
                    {this.props.links.map(link => (
                        <ListItemButton
                            style={
                                link.color
                                    ? {
                                          backgroundColor: link.color,
                                          color: Utils.getInvertedColor(link.color, this.props.themeType, true),
                                      }
                                    : {}
                            }
                            onClick={e => {
                                e.stopPropagation();
                                // replace IPv6 Address with [ipv6]:port
                                let url = link.link;
                                url = url.replace(
                                    /\/\/([0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*:[0-9a-f]*)(:\d+)?\//i,
                                    '//[$1]$2/',
                                );
                                window.open(url, this.props.instanceId);
                                this.props.onClose();
                            }}
                            key={AdminUtils.getText(link.name, I18n.getLanguage())}
                        >
                            <ListItemAvatar>
                                <Avatar variant="rounded">
                                    <img
                                        style={styles.img}
                                        src={this.props.image}
                                        alt={this.props.instanceId}
                                    />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    AdminUtils.getText(link.name, I18n.getLanguage()) +
                                    (showPort ? ` [:${link.port}]` : '')
                                }
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Dialog>
        );
    }
}

export default LinksDialog;
