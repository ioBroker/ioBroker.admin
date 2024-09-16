import React, { type JSX } from 'react';
import { Accordion, AccordionDetails, AccordionSummary } from '@mui/material';

import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

import MaterialDynamicIcon from '../../helpers/MaterialDynamicIcon';

const styles: Record<string, React.CSSProperties> = {
    row: {
        paddingLeft: 8,
        flexDirection: 'row-reverse',
        minHeight: '48px !important',
        height: 48,
        fontWeight: 'bold',
        fontSize: 16,
    },
    iconStyle: {
        marginRight: 10,
    },
    wrapperName: {
        margin: '0 10px',
        display: 'flex',
        alignItems: 'center',
    },
    wrapperChildren: {
        width: '100%',
    },
    accordionDetails: {
        padding: 0,
    },
    accordion: {
        margin: '1px 0 !important',
    },
};

interface InstanceCategoryProps {
    name: string;
    key: string;
    children: React.JSX.Element[] | React.JSX.Element;
    expanded: boolean;
    onExpand: (expanded: boolean) => void;
}

function InstanceCategory({ name, key, children, expanded, onExpand }: InstanceCategoryProps): JSX.Element {
    return (
        <Accordion
            expanded={!!expanded}
            onChange={() => onExpand(!expanded)}
            style={styles.accordion}
            key={key}
            square
        >
            <AccordionSummary
                style={styles.row}
                expandIcon={<ExpandMoreIcon />}
            >
                <div style={styles.wrapperName}>
                    <MaterialDynamicIcon
                        iconName={name}
                        style={styles.iconStyle}
                    />
                    {name}
                </div>
            </AccordionSummary>
            <AccordionDetails style={styles.accordionDetails}>
                <div style={styles.wrapperChildren}>{children}</div>
            </AccordionDetails>
        </Accordion>
    );
}

export default InstanceCategory;
