import React from 'react';

import type { ActionBase, DeviceAction } from '@iobroker/dm-utils';
import TooltipButton from './TooltipButton';
import { renderActionIcon, getTranslation } from './Utils';

interface DeviceActionButtonProps {
    deviceId: string;
    action: DeviceAction;
    refresh: () => void;
    deviceHandler: (deviceId: string, action: ActionBase, refresh: () => void) => () => void;
    disabled?: boolean;
}

export default function DeviceActionButton(props: DeviceActionButtonProps): React.JSX.Element {
    const { deviceId, action, refresh, deviceHandler, disabled } = props;

    const icon = renderActionIcon(action);

    const tooltip = getTranslation(action.description ?? '') || (icon ? null : action.id);

    return (
        <TooltipButton
            tooltip={tooltip || undefined}
            disabled={disabled || action.disabled}
            Icon={icon}
            onClick={deviceHandler(deviceId, action, refresh)}
        />
    );
}
