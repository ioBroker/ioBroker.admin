import React from 'react';
import TooltipButton from './TooltipButton';
import { renderIcon, getTranslation } from './Utils';

interface InstanceActionButtonProps {
    action: any;
    instanceHandler: (action: any) => () => void;
}

export default function InstanceActionButton(params: InstanceActionButtonProps): React.JSX.Element | null {
    const { action, instanceHandler } = params;

    const tooltip = getTranslation(action?.description ? action.description : '');
    const title = getTranslation(action?.title ? action.title : '');

    const icon = renderIcon(action);

    return <TooltipButton
        tooltip={tooltip}
        label={title}
        disabled={action.disabled}
        Icon={icon}
        onClick={instanceHandler(action)}
    />;
}
