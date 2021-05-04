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
- Show admin version number if width > 800: https://github.com/ioBroker/ioBroker.admin/issues/820
  - this.props.socket.getVersion
  
- Check if the host is alive by setting of current host at the very beginning


## Intro

## Easy Mode
- !Show back button in strickt mode for tabs (and logo button always returns to #easy in strict mode) 

## Settings
- (Base settings) Show dialog, that RESTART only works on debian systems: https://github.com/ioBroker/ioBroker.admin/issues/754

## Info

## Enums

## Adapters
- Highlight version numbers in update dialog (in news). Make it somehow visible that new version description starts.
- Show number of instances in tile and row: https://github.com/ioBroker/ioBroker.admin/issues/822

## Wizard

## Discovery
## Logs
- !ON multihost no source at all - https://github.com/ioBroker/ioBroker.admin/issues/777 //not track
- !On safari new coming entries have invalid time https://github.com/ioBroker/ioBroker.admin/issues/783 //not track

## Instances
- Do not wrap information for info.connection (icon on the same line). update tooltip too (Dont forget card view)
- Show color and icons of hosts in row view and everywhere where it possiobe (e.g. by edit)

## Objects
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image upload

- !Layout problem by defined columns widths: https://github.com/ioBroker/ioBroker.admin/issues/698
  - On small displays:
    - < 700 => ID Calc(100% - 300), Room: 100, Value 200
    - < 430 => ID (Calc100% - 200), Value 200,
    - < 300 => ID 

## Files

## Hosts
- Update is not displayed. it should be shown as in instances with change log and so on .....

## Users

## After all is done
- ! (BF) Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- (BF) show login dialog after TTL over

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)

- On Custom-Mass-Edit: When more than 10 data points are edited show a dialog to inform use about that mass edit and let him decide to do it or not: "The changes will be applied to %1 states. Are you sure?"
- (BF) Add progress bar if writing more than 1 object
- time - time picker
- date - date picker