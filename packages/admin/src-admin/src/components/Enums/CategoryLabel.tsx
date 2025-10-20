import React, { type JSX } from 'react';
import { useDrop } from 'react-dnd';

import { Tooltip, IconButton, Box } from '@mui/material';

import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';

import { Icon, type ThemeType, type Translate, Utils } from '@iobroker/adapter-react-v5';

interface CategoryLabelProps {
    categoryData: Record<string, any>;
    showEnumEditDialog: (category: Record<string, any>, isNew: boolean) => void;
    showEnumDeleteDialog: (category: Record<string, any>) => void;
    t: Translate;
    lang: ioBroker.Languages;
    styles: Record<string, React.CSSProperties>;
    themeType: ThemeType;
}

export default function CategoryLabel(props: CategoryLabelProps): JSX.Element {
    const [, drop] = useDrop(() => ({
        accept: ['enum'],
        drop: () => ({ enumId: props.categoryData._id }),
        collect: monitor => ({
            isOver: monitor.isOver(),
            canDrop: monitor.canDrop(),
        }),
    }));

    const textColor = Utils.getInvertedColor(props.categoryData.common.color, props.themeType, true);

    return (
        <Box
            component="span"
            ref={drop}
            style={{ ...props.styles.categoryTitle, color: textColor }}
            sx={{
                '.enum-button': {
                    visibility: 'hidden',
                },
                '&:hover .enum-button': {
                    visibility: 'visible',
                },
            }}
        >
            {props.categoryData.common.icon ? (
                <Icon
                    style={props.styles.icon}
                    src={props.categoryData.common.icon}
                />
            ) : null}
            {typeof props.categoryData.common.name === 'string'
                ? props.categoryData.common.name
                : props.categoryData.common.name[props.lang] || props.categoryData.common.name.en}
            <IconButton
                className="enum-button"
                size="small"
                style={{ color: textColor }}
                onClick={() => {
                    props.showEnumEditDialog(props.categoryData, false);
                }}
            >
                <Tooltip
                    title={props.t('Edit')}
                    placement="top"
                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                >
                    <EditIcon />
                </Tooltip>
            </IconButton>
            {props.categoryData.common.dontDelete ? null : (
                <IconButton
                    className="enum-button"
                    size="small"
                    style={{ color: textColor }}
                    onClick={() => props.showEnumDeleteDialog(props.categoryData)}
                >
                    <Tooltip
                        title={props.t('Delete')}
                        placement="top"
                        slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                    >
                        <DeleteIcon />
                    </Tooltip>
                </IconButton>
            )}
        </Box>
    );
}
