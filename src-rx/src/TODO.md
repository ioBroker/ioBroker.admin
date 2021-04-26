# Todo

## Bugs
- Ask "Discard data?" if instance config not saved for json config

- (BF) AdminSettings: Access to the instances: add infotexts for "Apply access rights" and "Allow access only"
- (BF)General: Support the new io-package fields that replace materialize and materializeTab (but we need to be backward compatible)
  common.adminUI: {
  custom: 'json',
  config: 'materialize',
  tab: 'html'
  }

## Intro
- (BF) Lists of elements are different in Admin4 and Admin5

## Easy Mode

## Settings
  
## Info

## Adapters
- Adapters - Use readme renderer from www.iobroker.net (BF)

## Wizard
- Settings: Map position not shown initially, change save button to primary
  system.config => common.licenseConfirmed = false

## Discovery
- Implement

## Logs
* When entering Message filter show clear button
## Instances
- if more than one host => host selector for every instance
- Logo icons are disappeared
## Objects
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image upload

- Objects ACL Edit Dialog - table layout need fixing (sometimes)

- (BF) Alias target do not jump to object - jump needs to open the tree
- (BF) Alias ID can be object with read and write properties. Show both alternatively or ignore this case on display
- (BF) Object editor Alias Tab: also allow to specify red/write ids

## Files

## Hosts
- Add Notifications button with "bubble" to hosts list and allow open Notification dialog per host if something is there. Gray button out if no notifications exist for that host

## Users

## Easy mode
- Back button for tabs
- https://github.com/ioBroker/ioBroker.admin/issues/756

## After all is done
- Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- show login dialog after TTL over

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)
- (BF) On Custom-Mass-Edit: When more than 10 data points are edited show a dialog to inform use about that mass edit and let him decide to do it or not: "The changes will be applied to %1 states. Are you sure?"