// please do not delete React, as without it other projects could not be compiled: ReferenceError: React is not defined
import React from 'react';
import { Grid2 } from '@mui/material';

const styles: Record<string, React.CSSProperties> = {
    root: {
        height: '100%',
        overflow: 'hidden',
    },
    overflowAuto: {
        overflow: 'auto',
    },
};

interface TabContentProps {
    /** The content of the component. */
    children: React.JSX.Element | (React.JSX.Element | null | React.JSX.Element[])[];
    /** Overflow behavior */
    overflow?: 'auto';
    style?: React.CSSProperties;
    ref?: React.RefObject<HTMLDivElement>;
}

export function TabContent(props: TabContentProps): React.JSX.Element {
    return (
        <Grid2
            sx={{
                ...styles.root,
                ...(props?.style || undefined),
                ...(props.overflow === 'auto' ? styles.overflowAuto : undefined),
            }}
            ref={props.ref}
        >
            {props.children}
        </Grid2>
    );
}
