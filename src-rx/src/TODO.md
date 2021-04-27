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

## Settings
- Show dialog, that resatrt only works on debian systems: https://github.com/ioBroker/ioBroker.admin/issues/754
  
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

## Objects
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image upload

- (BF) Alias target do not jump to object - jump needs to open the tree
- (BF) Alias ID can be object with read and write properties. Show both alternatively or ignore this case on display
- (BF) Object editor Alias Tab: also allow to specify red/write ids

- Allow creation of folder and devices on non existing objects (JSON export too) - https://github.com/ioBroker/ioBroker.admin/issues/761

## Files

## Hosts

## Users

## Easy mode
- Back button for tabs

## After all is done
- Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- show login dialog after TTL over

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)
- On Custom-Mass-Edit: When more than 10 data points are edited show a dialog to inform use about that mass edit and let him decide to do it or not: "The changes will be applied to %1 states. Are you sure?"
- time - time picker
- date - date picker
- accordion as special panel (https://github.com/ioBroker/ioBroker.admin/issues/752)