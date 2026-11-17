import React, { type JSX, useEffect, useState } from 'react';

import DeviceList from '@iobroker/dm-gui-components';
import type { DeviceManagerPropsProps } from '@iobroker/json-config';

import ConfigManagerPinButton from '@/components/ConfigManagerPinButton';

const DeviceManager = DeviceList as unknown as React.FC<DeviceManagerPropsProps>;

/**
 * The device list that admin hands to jsonConfig for the `deviceManager` component: the same list, with
 * the pin button of the device manager tab in front of the title (#3738).
 *
 * The button is only shown if the instance announces its device manager in `supportedMessages`. The menu
 * shows a pinned instance only then and removes every other pin at once - a button that seems to do
 * nothing would be worse than none.
 */
export default function DeviceManagerWithPin(props: DeviceManagerPropsProps): JSX.Element {
    const { selectedInstance, socket } = props;
    const [canPin, setCanPin] = useState(false);

    useEffect(() => {
        let active = true;
        setCanPin(false);
        if (selectedInstance) {
            socket
                .getObject(`system.adapter.${selectedInstance}`)
                .then(obj => {
                    if (active) {
                        setCanPin(
                            !!(obj as ioBroker.InstanceObject | null | undefined)?.common?.supportedMessages
                                ?.deviceManager,
                        );
                    }
                })
                .catch(() => {
                    // without the object nothing is known - no pin
                });
        }
        return () => {
            active = false;
        };
    }, [selectedInstance, socket]);

    // The list renders `title` as a plain child at the start of its toolbar, but types it as `string`
    const title = (
        <>
            {canPin ? <ConfigManagerPinButton instance={selectedInstance} /> : null}
            {props.title}
        </>
    ) as unknown as string;

    return (
        <DeviceManager
            {...props}
            title={title}
        />
    );
}
