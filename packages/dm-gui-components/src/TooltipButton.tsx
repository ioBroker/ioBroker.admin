import React from 'react';
import { IconButton, Tooltip, Typography } from '@mui/material';

interface TooltipButtonProps {
    tooltip?: string;
    label?: string;
    disabled?: boolean;
    Icon: React.JSX.Element | null;
    onClick?: () => void;
}

export default function TooltipButton(props: TooltipButtonProps): React.JSX.Element {
    const {
        tooltip, label, disabled, Icon, onClick
    } = props;

    const text = !!label && <Typography variant="button" style={{ marginLeft: 4 }}>{label}</Typography>;

    if (tooltip) {
        return <Tooltip title={tooltip}>
            <span>
                <IconButton onClick={onClick} disabled={disabled} size="small">
                    {Icon}
                    {text}
                </IconButton>
            </span>
        </Tooltip>;
    }

    return <IconButton onClick={onClick} disabled={disabled} size="small">
        {Icon}
        {text}
    </IconButton>;
}
