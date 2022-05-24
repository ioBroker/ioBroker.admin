const withWidth = () => (WrappedComponent) => (props) => <WrappedComponent {...props} width="xs" />;

export default withWidth;