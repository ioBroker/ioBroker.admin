import {importShared} from './__federation_fn_import.js'
const {default:React} = await importShared('react')
const {default:PropTypes} = await importShared('prop-types')
const {ConfigGeneric,i18n} = await importShared('@iobroker/adapter-react-v5')
const {withStyles} = await importShared('@mui/styles')
const {TableContainer,Table,TableHead,TableRow,TableCell,TableBody,Checkbox} = await importShared('@mui/material')

const styles = (theme) => ({
  table: {
    minWidth: 400
  },
  header: {
    fontSize: 16,
    fontWeight: "bold"
  }
});
class ConfigCustomEasyAccess extends ConfigGeneric {
  componentDidMount() {
    super.componentDidMount();
    this.props.socket.getAdapterInstances().then((instances) => {
      instances = instances.filter((instance) => instance?.common?.adminUI && (instance.common.adminUI.config !== "none" || instance.common.adminUI.tab)).map((instance) => ({
        id: instance._id.replace(/^system\.adapter\./, ""),
        config: instance.common.adminUI.config !== "none",
        adminTab: instance.common.adminTab
      })).sort((a, b) => a.id > b.id ? 1 : a.id < b.id ? -1 : 0);
      this.setState({ instances });
    });
  }
  renderItem(error, disabled, defaultValue) {
    if (!this.state.instances) {
      return null;
    } else {
      const accessAllowedConfigs = ConfigGeneric.getValue(this.props.data, "accessAllowedConfigs") || [];
      const accessAllowedTabs = ConfigGeneric.getValue(this.props.data, "accessAllowedTabs") || [];
      return /* @__PURE__ */ React.createElement(TableContainer, null, /* @__PURE__ */ React.createElement(Table, {
        className: this.props.classes.table,
        size: "small"
      }, /* @__PURE__ */ React.createElement(TableHead, null, /* @__PURE__ */ React.createElement(TableRow, null, /* @__PURE__ */ React.createElement(TableCell, {
        className: this.props.classes.header
      }, i18n.t("Instance")), /* @__PURE__ */ React.createElement(TableCell, {
        className: this.props.classes.header
      }, i18n.t("Config")), /* @__PURE__ */ React.createElement(TableCell, {
        className: this.props.classes.header
      }, i18n.t("Tab")))), /* @__PURE__ */ React.createElement(TableBody, null, this.state.instances.map((row) => /* @__PURE__ */ React.createElement(TableRow, {
        key: row.id
      }, /* @__PURE__ */ React.createElement(TableCell, {
        component: "th",
        scope: "row"
      }, row.id), /* @__PURE__ */ React.createElement(TableCell, null, row.config ? /* @__PURE__ */ React.createElement(Checkbox, {
        checked: accessAllowedConfigs.includes(row.id),
        onClick: () => {
          const _accessAllowedConfigs = [...accessAllowedConfigs];
          const pos = _accessAllowedConfigs.indexOf(row.id);
          if (pos !== -1) {
            _accessAllowedConfigs.splice(pos, 1);
          } else {
            _accessAllowedConfigs.push(row.id);
            _accessAllowedConfigs.sort();
          }
          this.onChange("accessAllowedConfigs", _accessAllowedConfigs);
        }
      }) : null), /* @__PURE__ */ React.createElement(TableCell, null, row.adminTab ? /* @__PURE__ */ React.createElement(Checkbox, {
        checked: accessAllowedTabs.includes(row.id),
        onClick: () => {
          const _accessAllowedTabs = [...accessAllowedTabs];
          const pos = _accessAllowedTabs.indexOf(row.id);
          if (pos !== -1) {
            _accessAllowedTabs.splice(pos, 1);
          } else {
            _accessAllowedTabs.push(row.id);
            _accessAllowedTabs.sort();
          }
          this.onChange("accessAllowedTabs", _accessAllowedTabs);
        }
      }) : null))))));
    }
  }
}
ConfigCustomEasyAccess.propTypes = {
  socket: PropTypes.object.isRequired,
  themeType: PropTypes.string,
  themeName: PropTypes.string,
  style: PropTypes.object,
  className: PropTypes.string,
  data: PropTypes.object.isRequired,
  schema: PropTypes.object,
  onError: PropTypes.func,
  onChange: PropTypes.func
};
var ConfigCustomEasyAccess$1 = withStyles(styles)(ConfigCustomEasyAccess);

export { ConfigCustomEasyAccess$1 as C };
//# sourceMappingURL=ConfigCustomEasyAccess.0ab5e2fd.js.map
