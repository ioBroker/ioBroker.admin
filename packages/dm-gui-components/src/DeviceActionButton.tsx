import React from 'react';

import TooltipButton from './TooltipButton';
import { renderIcon, getTranslation } from './Utils';
import type { ActionBase } from '@iobroker/dm-utils/build/types/base';

interface DeviceActionButtonProps {
    deviceId: string;
    action: any;
    refresh: () => void;
    deviceHandler: (deviceId: string, action: ActionBase<'api'>, refresh: () => void) => () => void;
    disabled?: boolean;
}

export default function DeviceActionButton(props: DeviceActionButtonProps): React.JSX.Element {
    const {
        deviceId, action, refresh, deviceHandler, disabled,
    } = props;

    const tooltip = getTranslation(action.description);

    const icon = renderIcon(action);

    return <TooltipButton
        label={action.label || (icon ? null : action.id)}
        tooltip={tooltip}
        disabled={disabled || action.disabled}
        Icon={icon}
        onClick={deviceHandler(deviceId, action, refresh)}
    />;
}
