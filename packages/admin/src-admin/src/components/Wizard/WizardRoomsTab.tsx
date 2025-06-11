import React, { Component, type JSX } from 'react';

import {
    Grid2,
    Toolbar,
    Button,
    Paper,
    Typography,
    Checkbox,
    FormControlLabel,
    Box,
} from '@mui/material';

import { Check as IconCheck } from '@mui/icons-material';

import { type AdminConnection, I18n, type Translate, withWidth } from '@iobroker/adapter-react-v5';

// Import room SVGs
import AnteroomSvg from '@/assets/rooms/Anteroom.svg';
import BathroomSvg from '@/assets/rooms/Bathroom.svg';
import BedroomSvg from '@/assets/rooms/Bedroom.svg';
import BoilerRoomSvg from '@/assets/rooms/Boiler Room.svg';
import DiningRoomSvg from '@/assets/rooms/Dining Room.svg';
import DressingRoomSvg from '@/assets/rooms/Dressing Room.svg';
import EquipmentRoomSvg from '@/assets/rooms/Equipment Room.svg';
import GuestBathroomSvg from '@/assets/rooms/Guest Bathroom.svg';
import GuestRoomSvg from '@/assets/rooms/Guest Room.svg';
import LaundryRoomSvg from '@/assets/rooms/Laundry Room.svg';
import LivingRoomSvg from '@/assets/rooms/Living Room.svg';
import LockerRoomSvg from '@/assets/rooms/Locker Room.svg';
import PlayroomSvg from '@/assets/rooms/Playroom.svg';
import StoreroomSvg from '@/assets/rooms/Storeroom.svg';
import WashroomSvg from '@/assets/rooms/Washroom.svg';

const TOOLBAR_HEIGHT = 64;

const styles: Record<string, React.CSSProperties> = {
    paper: {
        height: '100%',
        maxHeight: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
    },
    mainGrid: {
        height: `calc(100% - ${TOOLBAR_HEIGHT}px)`,
        overflow: 'auto',
        padding: 16,
    },
    grow: {
        flexGrow: 1,
    },
    toolbar: {
        height: TOOLBAR_HEIGHT,
        lineHeight: `${TOOLBAR_HEIGHT}px`,
    },
    roomItem: {
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
    },
    roomItemSelected: {
        border: '2px solid #2196f3',
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
    },
    roomIcon: {
        width: 80,
        height: 80,
        marginBottom: 8,
    },
    roomsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginTop: 20,
    },
    title: {
        marginBottom: 16,
    },
};

// Define available rooms
const AVAILABLE_ROOMS = [
    { id: 'livingroom', name: 'Living Room', icon: LivingRoomSvg },
    { id: 'bedroom', name: 'Bedroom', icon: BedroomSvg },
    { id: 'bathroom', name: 'Bathroom', icon: BathroomSvg },
    { id: 'kitchen', name: 'Kitchen', icon: DiningRoomSvg },
    { id: 'diningroom', name: 'Dining Room', icon: DiningRoomSvg },
    { id: 'guestroom', name: 'Guest Room', icon: GuestRoomSvg },
    { id: 'guestbathroom', name: 'Guest Bathroom', icon: GuestBathroomSvg },
    { id: 'anteroom', name: 'Anteroom', icon: AnteroomSvg },
    { id: 'playroom', name: 'Playroom', icon: PlayroomSvg },
    { id: 'laundryroom', name: 'Laundry Room', icon: LaundryRoomSvg },
    { id: 'boilerroom', name: 'Boiler Room', icon: BoilerRoomSvg },
    { id: 'dressingroom', name: 'Dressing Room', icon: DressingRoomSvg },
    { id: 'equipmentroom', name: 'Equipment Room', icon: EquipmentRoomSvg },
    { id: 'lockerroom', name: 'Locker Room', icon: LockerRoomSvg },
    { id: 'storeroom', name: 'Storeroom', icon: StoreroomSvg },
    { id: 'washroom', name: 'Washroom', icon: WashroomSvg },
];

interface WizardRoomsTabProps {
    t: Translate;
    socket: AdminConnection;
    onDone: (selectedRooms: string[]) => void;
}

interface WizardRoomsTabState {
    selectedRooms: string[];
}

class WizardRoomsTab extends Component<WizardRoomsTabProps, WizardRoomsTabState> {
    constructor(props: WizardRoomsTabProps) {
        super(props);

        this.state = {
            selectedRooms: ['livingroom', 'bedroom', 'bathroom', 'kitchen'], // Default selected rooms
        };
    }

    toggleRoom = (roomId: string): void => {
        const selectedRooms = [...this.state.selectedRooms];
        const index = selectedRooms.indexOf(roomId);

        if (index === -1) {
            selectedRooms.push(roomId);
        } else {
            selectedRooms.splice(index, 1);
        }

        this.setState({ selectedRooms });
    };

    createRoomEnums = async (): Promise<void> => {
        const selectedRooms = this.state.selectedRooms;

        // Create room enums for each selected room
        for (const roomId of selectedRooms) {
            const room = AVAILABLE_ROOMS.find(r => r.id === roomId);
            if (room) {
                const enumId = `enum.rooms.${roomId}`;
                const roomEnum: ioBroker.EnumObject = {
                    _id: enumId,
                    type: 'enum',
                    common: {
                        name: this.props.t(room.name),
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
        return (
            <Paper style={styles.paper}>
                <Grid2
                    container
                    direction="column"
                    style={styles.mainGrid}
                >
                    <Typography variant="h5" style={styles.title}>
                        {this.props.t('Select the rooms in your home')}
                    </Typography>
                    <Typography variant="body1">
                        {this.props.t('Please select the rooms that exist in your home. You can add or remove rooms later in the categories tab.')}
                    </Typography>
                    <Typography variant="body1">
                        {this.props.t('If you do not see the room you want to add, please add it in the categories tab.')}
                    </Typography>

                    <Box style={styles.roomsContainer}>
                        {AVAILABLE_ROOMS.map(room => (
                            <Box
                                key={room.id}
                                style={{
                                    ...styles.roomItem,
                                    ...(this.state.selectedRooms.includes(room.id) ? styles.roomItemSelected : {})
                                }}
                                onClick={() => this.toggleRoom(room.id)}
                            >
                                <img src={room.icon} alt={room.name} style={styles.roomIcon} />
                                <Typography variant="body2">{this.props.t(room.name)}</Typography>
                                <Checkbox
                                    checked={this.state.selectedRooms.includes(room.id)}
                                    onChange={() => this.toggleRoom(room.id)}
                                    onClick={e => e.stopPropagation()}
                                />
                            </Box>
                        ))}
                    </Box>
                </Grid2>
                <Toolbar style={styles.toolbar}>
                    <div style={styles.grow} />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={this.createRoomEnums}
                        startIcon={<IconCheck />}
                    >
                        {this.props.t('Save')}
                    </Button>
                    <div style={styles.grow} />
                </Toolbar>
            </Paper>
        );
    }
}

export default withWidth()(WizardRoomsTab);
