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

## Intro

## Easy Mode
- !Show back button in strickt mode for tabs (and logo button always returns to #easy in strict mode) 

## Settings
- <!--(Base settings) Show dialog, that RESTART only works on debian systems: https://github.com/ioBroker/ioBroker.admin/issues/754-->

## Info

## Enums

## Adapters
- Use only icons for update adapter: https://github.com/ioBroker/ioBroker.admin/issues/810
  - "Ignore", Icon "Update", Icon "close" on mobile ()
  
- Save the "close when finished" in localStorage: https://github.com/ioBroker/ioBroker.admin/issues/815
- Update adapter list by host change: https://github.com/ioBroker/ioBroker.admin/issues/819
- Show host name in the summary (not in details) if enough space: https://github.com/ioBroker/ioBroker.admin/issues/799
- Show number of instances in tile and row: https://github.com/ioBroker/ioBroker.admin/issues/822

## Wizard

## Discovery
- Show icons of hosts

## Logs
- !ON multihost no source at all - https://github.com/ioBroker/ioBroker.admin/issues/777
- !On safari new coming entries have invalid time https://github.com/ioBroker/ioBroker.admin/issues/783
- host sicon and name => nowrap

## Instances
- Invalid status of instance (only icon): https://github.com/ioBroker/ioBroker.admin/issues/816
- Show info.connection in instance if string and not boolean: https://github.com/ioBroker/ioBroker.admin/issues/817

## Objects
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image upload

- !Layout problem by defined columns widths: https://github.com/ioBroker/ioBroker.admin/issues/698
- !On small display show only Icons for "Edit object dialog" buttons (see ObjectCustomDialog)
- On small display show smaller font and smaller margins between checkbox and text: https://github.com/ioBroker/ioBroker.admin/issues/810

## Files

## Hosts
- Update is not displayed. it should be shown as in instances with change log and so on

## Users

## After all is done
- ! (BF) Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- show login dialog after TTL over

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)
- On Custom-Mass-Edit: When more than 10 data points are edited show a dialog to inform use about that mass edit and let him decide to do it or not: "The changes will be applied to %1 states. Are you sure?"
- time - time picker
- date - date picker