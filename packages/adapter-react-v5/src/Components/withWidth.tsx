import React, { type JSXElementConstructor, type JSX } from 'react';
import { useTheme } from '@mui/material/styles';
import { type Breakpoint, useMediaQuery } from '@mui/material';

function useWidth(): Breakpoint {
    const theme = useTheme();
    const keys = [...theme.breakpoints.keys].reverse();
    return (
        keys.reduce((output: Breakpoint | null, key: Breakpoint) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const matches = useMediaQuery(theme.breakpoints.up(key));
            return !output && matches ? key : output;
        }, null) || 'xs'
    );
}

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
export function withWidth() {
    return (WrappedComponent: JSXElementConstructor<any>) => {
        return function AnyComponent(props: Record<string, any>): JSX.Element {
            const width = useWidth();
            return (
                <WrappedComponent
                    {...props}
                    width={width}
                />
            );
        };
    };
}
