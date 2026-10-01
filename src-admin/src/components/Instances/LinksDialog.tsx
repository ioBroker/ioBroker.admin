import React, { Component, type JSX } from 'react';

import { List, ListItemButton, ListItemText, DialogTitle, Dialog, ListItemAvatar, Avatar } from '@mui/material';

import { I18n, type ThemeType, type Translate, Utils } from '@iobroker/gui-components';

import AdminUtils from '../../helpers/AdminUtils';

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
    /** The admin was opened through the remote access, and this address only works in the local network */
    unreachable?: boolean;
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
    render(): JSX.Element | null {
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
                            disabled={link.unreachable}
                            title={link.unreachable ? this.props.t('Only reachable in the local network') : undefined}
                            style={
                                link.color && !link.unreachable
                                    ? {
                                          backgroundColor: link.color,
                                          color: Utils.getInvertedColor(link.color, this.props.themeType, true),
                                      }
                                    : {}
                            }
                            onClick={e => {
                                e.stopPropagation();
                                if (link.unreachable) {
                                    return;
                                }
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
