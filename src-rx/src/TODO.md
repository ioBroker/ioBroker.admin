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
  - "This adapter cannot be installed from git as must be built before installation."

## Wizard

## Discovery
## Logs
- !ON multihost no source at all - https://github.com/ioBroker/ioBroker.admin/issues/777 //not track
- !On safari new coming entries have invalid time https://github.com/ioBroker/ioBroker.admin/issues/783 //not track

## Instances
- Read log level from system.adapter.<adaptername>.<instance>.logLevel (subscribe on it) and show 2 levels if it differs "warn/debug" with tooltip => "saved: warn / actual: debug" 
- Extended filter: 
  - Filter Adapters without existing instance (https://github.com/ioBroker/ioBroker.admin/issues/281)
  - started / stopped
  - by mode (daemon/schedule/once/none)
  - by status (https://github.com/ioBroker/ioBroker.admin/issues/283)
      - grey - disabled
      - red - enabled, but not alive
      - orange - enabled, alive, but not connected to controller
      - orange - enabled, alive, connected, but not connected to device or service
      - green - enabled and OK
- Group by category https://github.com/ioBroker/ioBroker.admin/issues/293

## Objects
- If width of ID not defined => TODO see objectBrowser
- Show in tooltip of button which types could be created on selected node
  - If button is disabled or object does not exist or other types, show in the tooltip the full list of possibilities: https://github.com/ioBroker/ioBroker.admin/issues/761#issuecomment-831030077
    - Only following structures of objects are available:
    - Folder => State
    - Folder => Channel => State
    - Folder => Device => Channel => state
    - Device => channel => state
    - Channel => State

    Non-experts may create new objects only in "0_userdata.0" or "alias.0".
    The experts may create objects everywhere but from second level (e.g. vis.0 or javascript.0).
    
## Files

## Hosts
- Subscribe on hosts and update information (especially about updates)

## Users

## After all is done
- ! (BF) Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- (BF) show login dialog after TTL over

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)