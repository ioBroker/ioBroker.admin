# Todo


## Bugs
- Adapter tab: The version will not be automatically updated: https://github.com/ioBroker/ioBroker.admin/issues/688
- Ask "Discard data?" if instance config not saved for json config
* AdminSettings: Access to the instances: add infotexts for "Apply access rights" and "Allow access only"
* Update expert mode in APP if changed in the system settings.

* General: Support the new io-package fields that replace materialize and materializeTab (but we need to be backward compatible)
  common.adminUI: {
  custom: 'json',
  config: 'materialize',
  tab: 'html'
  }

## Intro
<!--   * Camera tile delete missing -->
- Lists of elements are different in Admin4 and Admin5

## Easy Mode

## Settings
  
## Info

## Adapters
- Adapters - Use readme renderer from www.iobroker.net (BF)
<!-- * Tile view: add Github logo (in front of installed version) -->
<!-- * Check logic of command dialog:
  - if command dialog is closed, is running is still set
  - If command dialog is in background, next install just opens this dialog and do nothing. -->

## Wizard
- Settings: Map position not shown initially, change save button to primary

## Discovery
- Implement

## Logs
- Toggle the PID => layout problem
- NaN on safari
* When entering Message filter show clear button
* On clear log => update log size

## Instances

## Objects
- Decode quality code to text (BF)
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image upload

* Remove "Role" from "Edit Object dialog" when not state
* Objects ACL Edit Dialog - table layout need fixing (sometimes)
* Stateview: Check alignment headline Timestamp, lastchange and Value to data columns
* State updates should get the green blink of the value
* State value color: Make "not-ack" red color lighter
* Use default acl in table if object/state ACT does not exist, instead of showing NaN

* Alias target do not jump to object - jump needs to open the tree
* Alias ID can be object with read and write properties. Show both alternatively or ignore this case on display
* Object editor Alias Tab: also allow to specify red/write ids

* Too long roles need to be cut in table (e.g. `indicator.maintenance.unreach`)
* User can create a new role

* Role in table should only be editable in expert mode

## Files

## Hosts
- show - / - and not null / null, but only if events are not 0.
* Remove color effect and make indicator narrow (3-4px) in tile view and list
* Line view: host color should be used
* Move "Host base settings dialog" to Hosts tab and leave as wrench, but only show in expert mode
* Add Notifications button with "bubble" to hosts list and allow open Notification dialog per host if something is there. Gray button out if no notifications exist for that host
* Disable host settings (not color/icon) and restart if host not alive

## Users

## Easy mode
- Back button for tabs

## After all is done
- Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)
- Table, move items up and down if add/delete possible 
* On Custom-Mass-Edit: When more than 10 data points are edited show a dialog to inform use about that mass edit and let him decide to do it or not: "The changes will be applied to %1 states. Are you sure?"