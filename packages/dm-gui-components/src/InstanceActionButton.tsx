import React from 'react';

import type { ActionBase, InstanceAction } from '@iobroker/dm-utils';

import TooltipButton from './TooltipButton';
import { getTranslation, renderActionIcon } from './Utils';

interface InstanceActionButtonProps {
    action: InstanceAction;
    instanceHandler: (action: ActionBase) => () => void;
}

export default function InstanceActionButton(params: InstanceActionButtonProps): React.JSX.Element | null {
    const { action, instanceHandler } = params;

    const tooltip = getTranslation(action?.description ? action.description : '');
    const title = getTranslation(action?.title ? action.title : '');

    const icon = renderActionIcon(action);

    return (
        <TooltipButton
            tooltip={tooltip}
            label={title}
            disabled={action.disabled}
            Icon={icon}
            onClick={instanceHandler(action)}
        />
    );
}
