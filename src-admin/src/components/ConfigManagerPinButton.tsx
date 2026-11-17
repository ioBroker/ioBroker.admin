import React, { type JSX, useEffect, useState } from 'react';

import { IconButton, Tooltip } from '@mui/material';
import { PushPin, PushPinOutlined } from '@mui/icons-material';

import { I18n } from '@iobroker/gui-components';

import {
    CONFIG_MANAGER_PINS_CHANGED_EVENT,
    CONFIG_MANAGER_PINS_STORAGE_KEY,
    isConfigManagerInstancePinned,
    setConfigManagerInstancePinned,
} from '@/helpers/configManagerPins';

/** The pin of an instance that is in the menu. A color of its own is seen at a glance */
const PINNED_ICON_STYLE: React.CSSProperties = { color: '#ffca28' };

/**
 * Marks the pin as active.
 *
 * The toolbar of the device list is grey and everything in it is white, so its toggles mark their active
 * state with a translucent pill instead of a color. The pin uses the same pill, so that it does not look
 * like a different kind of button
 */
const PIN_ACTIVE_SX = {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.35)' },
};

/**
 * Pins the device manager of an instance to the navigation, or removes it from there.
 *
 * Sits in the toolbar of the device list - in the device manager tab and wherever the configuration of
 * an instance shows its device manager. It follows the stored pins, so it changes also when the pin is
 * removed elsewhere, e.g. in another browser tab.
 */
export default function ConfigManagerPinButton(props: {
    /** Like `shelly.0` */
    instance: string;
}): JSX.Element {
    const { instance } = props;
    const [pinned, setPinned] = useState(() => isConfigManagerInstancePinned(instance));

    useEffect(() => {
        const update = (event?: Event): void => {
            // `storage` fires for every key another browser tab writes, a null key means a cleared storage
            if (event instanceof StorageEvent && event.key && event.key !== CONFIG_MANAGER_PINS_STORAGE_KEY) {
                return;
            }
            setPinned(isConfigManagerInstancePinned(instance));
        };
        update();
        window.addEventListener(CONFIG_MANAGER_PINS_CHANGED_EVENT, update);
        window.addEventListener('storage', update);
        return () => {
            window.removeEventListener(CONFIG_MANAGER_PINS_CHANGED_EVENT, update);
            window.removeEventListener('storage', update);
        };
    }, [instance]);

    return (
        <Tooltip
            title={I18n.t(pinned ? 'Remove from navigation' : 'Pin to navigation')}
            slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
        >
            <IconButton
                color="inherit"
                size="small"
                sx={{ mr: 1, ...(pinned ? PIN_ACTIVE_SX : undefined) }}
                aria-label={I18n.t(pinned ? 'Remove from navigation' : 'Pin to navigation')}
                // the event of the change sets the state, see above
                onClick={() => setConfigManagerInstancePinned(instance, !pinned)}
            >
                {pinned ? <PushPin style={PINNED_ICON_STYLE} /> : <PushPinOutlined />}
            </IconButton>
        </Tooltip>
    );
}
