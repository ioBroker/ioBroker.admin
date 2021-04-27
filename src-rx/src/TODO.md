# Todo

## Bugs
- (BF) AdminSettings: Access to the instances: add infotexts for "Apply access rights" and "Allow access only"
- (BF) General: Support the new io-package fields that replace materialize and materializeTab (but we need to be backward compatible)
  common.adminUI: {
  custom: 'json',
  config: 'materialize',
  tab: 'html'
  }

## Intro

## Easy Mode
- Show back button in strickt mode for tabs (and logo button always returns to #easy in strict mode) 

## Settings
- Show dialog, that RESTART only works on debian systems: https://github.com/ioBroker/ioBroker.admin/issues/754
- By changing of redis<=>file, show dialog that it must be done via CLI because no datapoints/objects will be converted
  
## Info

## Adapters
- Adapters - Use readme renderer from www.iobroker.net (BF)

## Wizard

## Discovery
- use stepper
- Wizard 1: Select methods
- Wizard 2: Show progress from variables discovery.0.*
- Wizard 3: Create instances
  - Show/hide suggested
  - Show/hide ignored
  - Create instances one by one
    - Show host selector if more than one ALIVE hosts
    - Show license dialog if not MIT
    - Ask parameters: text, password (with repeat), number, checkbox, Link button, select, comment
    - Call install command: "iobroker install adapter.instance" (this command only check and if need install new adapter)
    - Wait till install finished
    - socket.setObject(system.adapter." + adapter.instance, param)
    - Wait till instance is alive ? (only if common.type === 'daemon')
    - Show progress of command (if "show more" selected)
    - Go to the next instance

## Logs

## Instances
- if more than one host => host selector for every instance
- Mobile view:  smaller icons and some more space between status lamp and the icon - https://github.com/ioBroker/ioBroker.admin/issues/758

## Objects
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image upload

- Allow creation of folder and devices on non existing objects (JSON export too) - https://github.com/ioBroker/ioBroker.admin/issues/761
- Layout problem by defined columns widths: https://github.com/ioBroker/ioBroker.admin/issues/698

## Files

## Hosts

## Users

## After all is done
- Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- show login dialog after TTL over

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)
- On Custom-Mass-Edit: When more than 10 data points are edited show a dialog to inform use about that mass edit and let him decide to do it or not: "The changes will be applied to %1 states. Are you sure?"
- time - time picker
- date - date picker