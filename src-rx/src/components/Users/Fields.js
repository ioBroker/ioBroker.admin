import TextField from '@material-ui/core/TextField';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

export function UsersTextField(props) {
    return <FormControl className={props.classes.formControl}>
        <InputLabel shrink>
            { props.t(props.label)}
        </InputLabel>
        <TextField
            label={ props.t(props.label)}
            value={props.value}
            onChange={props.onChange}
            InputLabelProps={{
                readOnly: false,
                shrink: true,
            }}
            type={props.type}
        />
    </FormControl>
}