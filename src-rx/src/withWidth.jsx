import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

function useWidth() {
    const theme = useTheme();
    const keys = [...theme.breakpoints.keys].reverse();
    return (
      keys.reduce((output, key) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const matches = useMediaQuery(theme.breakpoints.up(key));
        return !output && matches ? key : output;
      }, null) || 'xs'
    );
  }

// FIXME checkout https://mui.com/components/use-media-query/#migrating-from-withwidth
const withWidth = () => (WrappedComponent) => (props) => {
    const width = useWidth();
    return <WrappedComponent {...props} width={width} />
};

export default withWidth;