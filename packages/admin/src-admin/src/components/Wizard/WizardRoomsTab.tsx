import React, { Component, type JSX } from 'react';

import { Toolbar, Button, Paper, Typography, Checkbox, Box } from '@mui/material';

import { Check as IconCheck, ArrowForward as IconNext } from '@mui/icons-material';

import { type AdminConnection, Icon, type Translate, Utils } from '@iobroker/adapter-react-v5';

// Import room SVGs
let typedRooms: {
    _id: string;
    name: ioBroker.StringOrTranslated;
    icon: string;
    iconSvg?: string;
    translatedName?: string;
}[] = [];

const TOOLBAR_HEIGHT = 64;

const VERY_IMPORTANT_ROOMS = [
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

function getText(text: ioBroker.StringOrTranslated, lang: ioBroker.Languages): string {
    return typeof text === 'string' ? text : text[lang] || text.en || '';
}

interface WizardRoomsTabProps {
    t: Translate;
    socket: AdminConnection;
    onDone: (selectedRooms: string[]) => void;
    lang: ioBroker.Languages;
}

interface WizardRoomsTabState {
    selectedRooms: string[];
    loading?: boolean;
    preSelected: string;
    showMore?: boolean;
}

export default class WizardRoomsTab extends Component<WizardRoomsTabProps, WizardRoomsTabState> {
    constructor(props: WizardRoomsTabProps) {
        super(props);

        this.state = {
            selectedRooms: ['living_room', 'bedroom', 'bathroom', 'kitchen'], // Default selected rooms
            loading: true,
            preSelected: '',
        };
    }

    componentDidMount(): void {
        this.setState({ loading: true }, async () => {
            let selectedRooms = [...this.state.selectedRooms];
            const roomsPromise: Promise<{
                default: typeof typedRooms;
            }> = import(`../../assets/rooms/list.json`);
            const json = await roomsPromise;
            typedRooms = json.default;

            const objects = await this.props.socket.getObjectViewSystem('enum');

            // if some rooms already exist, select them
            if (objects && Object.keys(objects).length) {
                selectedRooms = [];
                Object.keys(objects).forEach((roomId: string) => {
                    if (objects[roomId] && roomId.startsWith('enum.rooms.')) {
                        const shortRoomId = roomId.replace('enum.rooms.', '');
                        const room = typedRooms.find(r => r._id === shortRoomId);
                        selectedRooms.push(shortRoomId);
                        if (!room) {
                            const roomByName = typedRooms.findIndex(
                                r =>
                                    getText(r.name, this.props.lang) ===
                                    getText(objects[roomId].common.name, this.props.lang),
                            );
                            if (roomByName !== -1) {
                                const rId = VERY_IMPORTANT_ROOMS.indexOf(shortRoomId);
                                // If the room is already in the predefined list, remove it
                                if (rId !== -1) {
                                    VERY_IMPORTANT_ROOMS.splice(rId, 1);
                                }

                                // If the room is in the predefined list, update its icon
                                typedRooms[roomByName].iconSvg = objects[roomId].common.icon || '';
                                typedRooms[roomByName]._id = shortRoomId;
                                typedRooms[roomByName].translatedName = getText(
                                    objects[roomId].common.name,
                                    this.props.lang,
                                );
                            } else {
                                // If the room is not in the predefined list, add it
                                typedRooms.push({
                                    _id: shortRoomId,
                                    name: objects[roomId].common.name || shortRoomId,
                                    icon: objects[roomId].common.icon || '',
                                    iconSvg: objects[roomId].common.icon || '',
                                    translatedName: getText(objects[roomId].common.name, this.props.lang),
                                });
                            }
                            if (!VERY_IMPORTANT_ROOMS.includes(shortRoomId)) {
                                VERY_IMPORTANT_ROOMS.push(shortRoomId);
                            }
                        }
                    }
                });
            }

            const promises = typedRooms.map(async (template, i) => {
                if (!typedRooms[i].iconSvg) {
                    try {
                        const image: Promise<{ default: string }> = import(`../../assets/rooms/${template.icon}.svg`);
                        const im = await image;
                        typedRooms[i].iconSvg = await Utils.getSvg(im.default);
                    } catch {
                        console.warn(`Icon for room ${template.icon} not found`);
                    }
                }
            });
            selectedRooms.sort();
            typedRooms.forEach(room => {
                room.translatedName ||= getText(room.name, this.props.lang);
            });

            void Promise.all(promises).then(() =>
                this.setState({ loading: false, selectedRooms, preSelected: JSON.stringify(selectedRooms) }),
            );
        });
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
        const selectedRooms = this.state.selectedRooms;

        // Create room enums for each selected room
        for (const roomId of selectedRooms) {
            const room = typedRooms.find(r => r._id === roomId);
            if (room) {
                const enumId = `enum.rooms.${roomId}`;
                const roomEnum: ioBroker.EnumObject = {
                    _id: enumId,
                    type: 'enum',
                    common: {
                        name: room.name,
                        members: [],
                        icon: room.icon,
                    },
                    native: {},
                };

                try {
                    // Check if the enum already exists
                    const existingEnum = await this.props.socket.getObject(enumId);
                    if (!existingEnum) {
                        await this.props.socket.setObject(enumId, roomEnum);
                    }
                } catch (error) {
                    console.error(`Error creating room enum ${enumId}:`, error);
                }
            }
        }

        // Call onDone callback with selected rooms
        this.props.onDone(selectedRooms);
    };

    render(): JSX.Element {
        const roomList: string[] = this.state.showMore ? typedRooms.map(room => room._id) : VERY_IMPORTANT_ROOMS;
        if (this.state.showMore) {
            roomList.sort((a, b) => {
                const roomA = typedRooms.find(room => room._id === a);
                const roomB = typedRooms.find(room => room._id === b);
                if (roomA && roomB) {
                    return roomA.translatedName.localeCompare(roomB.translatedName);
                }
                return 0; // If either room is not found, maintain the original order
            });
        }

        return (
            <Paper
                style={{
                    height: '100%',
                    maxHeight: '100%',
                    maxWidth: '100%',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        height: `calc(100% - ${TOOLBAR_HEIGHT}px)`,
                        overflow: 'auto',
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box>
                        <Typography
                            variant="h5"
                            style={{ marginBottom: 16 }}
                        >
                            {this.props.t('Select the rooms in your home')}
                        </Typography>
                        <Typography variant="body1">
                            {this.props.t(
                                'Please select the rooms that exist in your home. You can add or remove rooms later in the categories tab.',
                            )}
                        </Typography>
                        {this.state.showMore ? (
                            <Typography variant="body1">
                                {this.props.t(
                                    'If you do not see the room you want to add, please add it in the categories tab.',
                                )}
                            </Typography>
                        ) : null}
                    </Box>
                    <Box
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            justifyContent: 'flex-start',
                            marginTop: 20,
                        }}
                    >
                        {roomList.map(roomId => {
                            const roomObj = typedRooms.find(room => room._id === roomId);
                            if (!roomObj) {
                                return null; // Skip if a room object is not found
                            }
                            return (
                                <Box
                                    key={roomId}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        margin: 8,
                                        padding: 8,
                                        width: 150,
                                        height: 150,
                                        cursor: 'pointer',
                                        border: '1px solid #ccc',
                                        borderRadius: 8,
                                        ...(this.state.selectedRooms.includes(roomId)
                                            ? {
                                                  border: '2px solid #2196f3',
                                                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                              }
                                            : undefined),
                                    }}
                                    onClick={() => this.toggleRoom(roomId)}
                                >
                                    <Icon
                                        src={roomObj.iconSvg}
                                        alt={roomObj.translatedName}
                                        style={{ width: 80, height: 80, marginBottom: 8 }}
                                    />
                                    <Typography variant="body2">{roomObj.translatedName}</Typography>
                                    <Checkbox
                                        checked={this.state.selectedRooms.includes(roomId)}
                                        onChange={() => this.toggleRoom(roomId)}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </Box>
                            );
                        })}
                        <Box
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: 8,
                                padding: 8,
                                width: 150,
                                height: 150,
                                cursor: 'pointer',
                                border: '1px solid #ccc',
                                borderRadius: 8,
                                fontSize: 20,
                            }}
                            onClick={() => this.setState({ showMore: !this.state.showMore })} // Show more rooms
                        >
                            {this.state.showMore ? this.props.t('Show less') : this.props.t('Show more')}
                        </Box>
                    </Box>
                </div>
                <Toolbar
                    style={{
                        height: TOOLBAR_HEIGHT,
                        lineHeight: `${TOOLBAR_HEIGHT}px`,
                        justifyContent: 'right',
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.createRoomEnums}
                        startIcon={
                            this.state.preSelected === JSON.stringify(this.state.selectedRooms) ? (
                                <IconNext />
                            ) : (
                                <IconCheck />
                            )
                        }
                    >
                        {this.state.preSelected === JSON.stringify(this.state.selectedRooms)
                            ? this.props.t('Next')
                            : this.props.t('Create rooms')}
                    </Button>
                </Toolbar>
            </Paper>
        );
    }
}
