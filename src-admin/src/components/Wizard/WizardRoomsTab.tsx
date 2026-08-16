import React, { Component, type JSX } from 'react';

import { Button, Typography, Box, ButtonBase, LinearProgress } from '@mui/material';

import { Check as IconCheck, ArrowForward as IconNext, CheckCircle as IconSelected } from '@mui/icons-material';

import { type AdminConnection, Icon, type Translate, Utils } from '@iobroker/gui-components';

import WizardStepFrame from './WizardStepFrame';

interface RoomTemplate {
    _id: string;
    name: ioBroker.StringOrTranslated;
    icon: string;
    iconSvg?: string;
    translatedName?: string;
}

/** Rooms, which are shown before the user presses "Show more" */
const DEFAULT_ROOMS: string[] = [
    'living_room',
    'bedroom',
    'bathroom',
    'kitchen',
    'dining',
    'guest_room',
    'guest_bathroom',
    'anteroom',
    'playroom',
    'laundry_room',
    'boiler_room',
    'dressing_room',
    'equipment_room',
    'locker_room',
    'storeroom',
    'washroom',
];

/** Rooms, which are selected if the user has no rooms yet */
const PRESELECTED_ROOMS: string[] = ['living_room', 'bedroom', 'bathroom', 'kitchen'];

function getText(text: ioBroker.StringOrTranslated, lang: ioBroker.Languages): string {
    return typeof text === 'string' ? text : text[lang] || text.en || '';
}

interface WizardRoomsTabProps {
    t: Translate;
    socket: AdminConnection;
    /** Already selected rooms, so the step can be visited again */
    rooms: string[] | null;
    /** Go one step back */
    onBack?: () => void;
    /** Report an error to the wizard */
    onError: (error: string) => void;
    onDone: (selectedRooms: string[]) => void;
    lang: ioBroker.Languages;
}

interface WizardRoomsTabState {
    selectedRooms: string[];
    loading: boolean;
    /** Rooms, which existed as the step was opened. If nothing changed, no enums must be created */
    preSelected: string;
    showMore: boolean;
    creating: boolean;
}

export default class WizardRoomsTab extends Component<WizardRoomsTabProps, WizardRoomsTabState> {
    /** All known room templates. It is an instance variable, as the list is extended by the existing enums */
    private rooms: RoomTemplate[] = [];

    /** Rooms, which are shown without "Show more" */
    private importantRooms: string[] = [...DEFAULT_ROOMS];

    constructor(props: WizardRoomsTabProps) {
        super(props);

        this.state = {
            selectedRooms: props.rooms || [...PRESELECTED_ROOMS],
            loading: true,
            preSelected: JSON.stringify(props.rooms || []),
            showMore: false,
            creating: false,
        };
    }

    async componentDidMount(): Promise<void> {
        try {
            const json: { default: RoomTemplate[] } = await import(`../../assets/rooms/list.json`);
            // Work with a copy, as the templates are extended with the existing enums
            this.rooms = json.default.map(room => ({ ...room }));

            let selectedRooms = [...this.state.selectedRooms];
            const objects = await this.props.socket.getObjectViewSystem('enum');
            const existingRooms = Object.keys(objects || {}).filter(id => id.startsWith('enum.rooms.'));

            // if some rooms already exist, select them
            if (existingRooms.length) {
                selectedRooms = [];
                for (const roomId of existingRooms) {
                    const shortRoomId = roomId.replace('enum.rooms.', '');
                    selectedRooms.push(shortRoomId);

                    if (this.rooms.find(r => r._id === shortRoomId)) {
                        continue;
                    }

                    // The room does not exist in the predefined list, so try to find it by name
                    const roomByName = this.rooms.findIndex(
                        r => getText(r.name, this.props.lang) === getText(objects[roomId].common.name, this.props.lang),
                    );

                    if (roomByName !== -1) {
                        // Use the ID and the icon of the existing enum
                        this.importantRooms = this.importantRooms.filter(id => id !== this.rooms[roomByName]._id);
                        this.rooms[roomByName].iconSvg = objects[roomId].common.icon || '';
                        this.rooms[roomByName]._id = shortRoomId;
                        this.rooms[roomByName].translatedName = getText(objects[roomId].common.name, this.props.lang);
                    } else {
                        // The room is unknown, so add it to the list
                        this.rooms.push({
                            _id: shortRoomId,
                            name: objects[roomId].common.name || shortRoomId,
                            icon: objects[roomId].common.icon || '',
                            iconSvg: objects[roomId].common.icon || '',
                            translatedName: getText(objects[roomId].common.name, this.props.lang),
                        });
                    }

                    if (!this.importantRooms.includes(shortRoomId)) {
                        this.importantRooms.push(shortRoomId);
                    }
                }
                selectedRooms.sort();
            }

            // Read the icons of all templates
            await Promise.all(
                this.rooms.map(async room => {
                    room.translatedName ||= getText(room.name, this.props.lang);
                    if (room.iconSvg) {
                        return;
                    }
                    try {
                        const image: { default: string } = await import(`../../assets/rooms/${room.icon}.svg`);
                        room.iconSvg = await Utils.getSvg(image.default);
                    } catch {
                        console.warn(`Icon for room ${room.icon} not found`);
                    }
                }),
            );

            this.setState({
                loading: false,
                selectedRooms,
                // If the user was on this step already, the initial selection is kept
                preSelected: this.props.rooms ? this.state.preSelected : JSON.stringify(selectedRooms),
            });
        } catch (e) {
            this.setState({ loading: false });
            this.props.onError((e as Error).message || (e as string).toString());
        }
    }

    toggleRoom = (roomId: string): void => {
        const selectedRooms = [...this.state.selectedRooms];
        const index = selectedRooms.indexOf(roomId);

        if (index === -1) {
            selectedRooms.push(roomId);
            selectedRooms.sort();
        } else {
            selectedRooms.splice(index, 1);
        }

        this.setState({ selectedRooms });
    };

    createRoomEnums = async (): Promise<void> => {
        const { selectedRooms } = this.state;

        this.setState({ creating: true });

        // Create room enums for each selected room
        for (const roomId of selectedRooms) {
            const room = this.rooms.find(r => r._id === roomId);
            if (!room) {
                continue;
            }
            const enumId = `enum.rooms.${roomId}`;

            try {
                // Check if the enum already exists
                const existingEnum = await this.props.socket.getObject(enumId);
                if (!existingEnum) {
                    await this.props.socket.setObject(enumId, {
                        _id: enumId,
                        type: 'enum',
                        common: {
                            name: room.name,
                            members: [],
                            icon: room.icon,
                        },
                        native: {},
                    });
                }
            } catch (error) {
                console.error(`Error creating room enum ${enumId}:`, error);
                this.props.onError((error as Error).message || (error as string).toString());
            }
        }

        this.setState({ creating: false });

        // Call onDone callback with selected rooms
        this.props.onDone(selectedRooms);
    };

    /** True if the selection was not changed by the user, so nothing must be created */
    isUnchanged(): boolean {
        return this.state.preSelected === JSON.stringify(this.state.selectedRooms);
    }

    renderRoom(roomId: string): JSX.Element | null {
        const room = this.rooms.find(r => r._id === roomId);
        if (!room) {
            return null;
        }
        const selected = this.state.selectedRooms.includes(roomId);

        return (
            <ButtonBase
                key={roomId}
                disabled={this.state.creating}
                onClick={() => this.toggleRoom(roomId)}
                sx={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    gap: 1,
                    p: 1,
                    height: 150,
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: selected ? 'primary.main' : 'divider',
                    backgroundColor: selected ? 'action.selected' : 'transparent',
                    transition: 'border-color 0.2s, background-color 0.2s',
                    '&:hover': { borderColor: selected ? 'primary.main' : 'text.disabled' },
                }}
            >
                {selected ? (
                    <IconSelected
                        color="primary"
                        sx={{ position: 'absolute', top: 6, right: 6, fontSize: 20 }}
                    />
                ) : null}
                <Icon
                    src={room.iconSvg}
                    alt={room.translatedName}
                    style={{ width: 72, height: 72, opacity: selected ? 1 : 0.7 }}
                />
                <Typography
                    variant="body2"
                    sx={{ textAlign: 'center', lineHeight: 1.2 }}
                >
                    {room.translatedName}
                </Typography>
            </ButtonBase>
        );
    }

    render(): JSX.Element {
        const roomList: string[] = this.state.showMore
            ? this.rooms
                  .map(room => room._id)
                  .sort((a, b) => {
                      const roomA = this.rooms.find(room => room._id === a);
                      const roomB = this.rooms.find(room => room._id === b);
                      return (roomA?.translatedName || a).localeCompare(roomB?.translatedName || b, this.props.lang);
                  })
            : this.importantRooms;

        const unchanged = this.isUnchanged();

        return (
            <WizardStepFrame
                title={this.props.t('Select the rooms in your home')}
                description={`${this.props.t(
                    'Please select the rooms that exist in your home. You can add or remove rooms later in the categories tab.',
                )}${
                    this.state.showMore
                        ? `\n${this.props.t('If you do not see the room you want to add, please add it in the categories tab.')}`
                        : ''
                }`}
                onBack={this.props.onBack}
                busy={this.state.creating}
                actions={
                    <Button
                        variant="contained"
                        color="primary"
                        loading={this.state.creating}
                        onClick={this.createRoomEnums}
                        startIcon={unchanged ? <IconNext /> : <IconCheck />}
                    >
                        {unchanged ? this.props.t('Next') : this.props.t('Create rooms')}
                    </Button>
                }
            >
                {this.state.loading ? (
                    <LinearProgress />
                ) : (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: 1.5,
                        }}
                    >
                        {roomList.map(roomId => this.renderRoom(roomId))}
                        <ButtonBase
                            disabled={this.state.creating}
                            onClick={() => this.setState({ showMore: !this.state.showMore })}
                            sx={{
                                height: 150,
                                borderRadius: 2,
                                border: '2px dashed',
                                borderColor: 'divider',
                                color: 'text.secondary',
                                '&:hover': { borderColor: 'text.disabled' },
                            }}
                        >
                            <Typography variant="body2">
                                {this.state.showMore ? this.props.t('Show less') : this.props.t('Show more')}
                            </Typography>
                        </ButtonBase>
                    </Box>
                )}
            </WizardStepFrame>
        );
    }
}
