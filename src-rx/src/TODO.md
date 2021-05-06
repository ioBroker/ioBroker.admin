# Todo

Marked with "!" must be in release candidate

## Bugs
- (BF) AdminSettings: Access to the instances: add infotexts for "Apply access rights" and "Allow access only"
- !(BF) General: Support the new io-package fields that replace materialize and materializeTab (but we need to be backward compatible)
  common.adminUI: {
    custom: 'json''
    config: 'materialize', 'none', 'html'
    tab: 'html'
  }
- Tooltips on drawer in half-closed mode  

## Intro
- For links: jump to link by clicking of the whole card and not only link: https://github.com/ioBroker/ioBroker.admin/issues/685

## Easy Mode

## Settings

## Info

## Enums

## Adapters
- Update of available versions does not work: https://github.com/ioBroker/ioBroker.admin/issues/830
- Check if adapter can be installed from github: https://github.com/ioBroker/ioBroker.admin/issues/527
  - common.nogit = true

## Wizard

## Discovery
## Logs
- !ON multihost no source at all - https://github.com/ioBroker/ioBroker.admin/issues/777 //not track
- !On safari new coming entries have invalid time https://github.com/ioBroker/ioBroker.admin/issues/783 //not track

## Instances
<!-- - Allow change of log level on the fly https://github.com/ioBroker/ioBroker.admin/issues/571 system.adapter.<adaptername>.<instance>.logLevel -->
- Extended filter: 
  - Filter Adapters without existing instance (https://github.com/ioBroker/ioBroker.admin/issues/281)
  - gestartet / gestoppt
  - by mode (daemon/schedule/once/none)
  - by status (https://github.com/ioBroker/ioBroker.admin/issues/283)
      - grey - disabled
      - red - enabled, but not alive
      - orange - enabled, alive, but not connected to controller
      - orange - enabled, alive, connected, but not connected to device or service
      - green - enabled and OK
- Group by category https://github.com/ioBroker/ioBroker.admin/issues/293

## Objects
<!-- - If width of ID not defined => TODO see objectBrowser -->
<!-- - Show button for configure of columns as active if auto is off -->
- Show in tooltip of button which types could be created on selected node
  <!-- - If button is disabled, show the full list of possibilities: https://github.com/ioBroker/ioBroker.admin/issues/761#issuecomment-831030077 -->

## Files

## Hosts
<!-- - Update is not displayed. it should be shown as in instances with change log and so on ..... -->

<!-- - Allow change of log level on the fly https://github.com/ioBroker/ioBroker.admin/issues/571 system.host.HOST.logLevel (Will be reset to the saved log level after restart of controller) -->

<!-- - Upgrade dialog => Button "Show instructions": https://github.com/ioBroker/ioBroker.admin/issues/536
For  -->


## Users

## After all is done
- ! (BF) Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- (BF) show login dialog after TTL over

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)

- On Custom-Mass-Edit: When more than 10 data points are edited show a dialog to inform use about that mass edit and let him decide to do it or not: "The changes will be applied to %1 states. Are you sure?"
- (BF) Add progress bar if writing more than 1 object
<!-- - time - time picker
- date - date picker -->