import Dialog from '@material-ui/core/Dialog';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import devices from '../../assets/devices/list.json';
import rooms from '../../assets/rooms/list.json';

function getSvg(url) {
    return fetch(url)
        .then(response => response.blob())
        .then(blob => {
            return new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = function() {
                    resolve(this.result);
                };
                reader.readAsDataURL(blob);
            });
        }) ;
}

function EnumTemplateDialog(props) {
    if (!props.open) {
        return null;
    }
    let templates = props.category === 'functions' ? devices : rooms;
    return <Dialog PaperProps={{className: props.classes.dialogPaper}} open={props.open} onClose={props.onClose}>
        <Box className={props.classes.deleteDialog}>
            <h2>
                
            </h2>
            <div>
                {templates.map(template => {
                    const image = require('../../assets/devices/' + template.icon);
                    return <Button onClick={()=>{
                        props.onClose();
                        getSvg(image.default).then(icon => {
                            props.createEnumTemplate('enum.' + props.category, {
                                _id: 'enum.' + props.category + '.' + template._id,
                                common: {
                                    name: template.name,
                                    icon: icon
                                }
                            });
                        })
                    }}>
                        {template.name} {template._id} <img src={image.default} width="22" />
                    </Button>})
                }
                <Button onClick={() => {
                    props.onClose();
                    props.showEnumEditDialog(props.getEnumTemplate('enum.' + props.category), true)
                }}>
                    {props.t('Custom group')}
                </Button>
            </div>
            <div>
                <Button onClick={props.onClose}>Cancel</Button>
            </div>
        </Box>
    </Dialog>;
}

export default EnumTemplateDialog;