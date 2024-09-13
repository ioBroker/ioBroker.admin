import React from 'react';

import { Grid2 as Grid, IconButton, TableCell, TableRow, Typography } from '@mui/material';

import { blue, green } from '@mui/material/colors';

import { ChevronRight as ChevronRightIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

import { type Translate } from '@iobroker/adapter-react-v5';

import MaterialDynamicIcon from '../../helpers/MaterialDynamicIcon';

const styles: Record<string, React.CSSProperties> = {
    name: {
        flexWrap: 'nowrap',
        width: 300,
        marginTop: 0,
    },
    nameDiv: {
        display: 'flex',
        alignItems: 'center',
    },
    categoryName: {
        fontWeight: 'bold',
        cursor: 'pointer',
    },
    green: {
        color: green[500],
    },
    blue: {
        color: blue[700],
    },
    category: {
        backgroundColor: 'background.default',
    },
    marginRight5: {
        marginRight: 5,
    },
};

interface AdapterCategoryRowProps {
    descHidden: boolean;
    categoryName: string;
    expanded: boolean;
    installedCount: number;
    /** Translated name */
    name: string;
    /** If category is toggled */
    onToggle: () => void;
    /** Number of adapters in category */
    count: number;
    t: Translate;
}

function AdapterCategoryRow(props: AdapterCategoryRowProps) {
    const { installedCount, name, categoryName } = props;

    return (
        <TableRow hover={false} sx={styles.category}>
            <TableCell>
                <Grid container spacing={1} alignItems="center" style={styles.name}>
                    <Grid component="div">
                        <IconButton size="small" onClick={props.onToggle}>
                            {props.expanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
                        </IconButton>
                    </Grid>
                </Grid>
            </TableCell>
            <TableCell onClick={props.onToggle}>
                <div style={{ ...styles.nameDiv, ...styles.categoryName }}>
                    <MaterialDynamicIcon objIconBool iconName={categoryName} style={styles.marginRight5} />
                    {name}
                </div>
            </TableCell>
            <TableCell colSpan={props.descHidden ? 5 : 6}>
                <Typography component="span" variant="body2" style={styles.green}>
                    {installedCount}
                </Typography>
                {` ${props.t('of')} `}
                <Typography component="span" variant="body2" style={styles.blue}>
                    {props.count}
                </Typography>
                {` ${props.t('Adapters from this Group installed')}`}
            </TableCell>
        </TableRow>
    );
}

export default AdapterCategoryRow;
