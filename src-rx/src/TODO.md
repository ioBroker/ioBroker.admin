# Todo
 <!-- - Move logout button to menu . Always last and not orderable -->
## Bugs
<!-- - No restart after system settings changed. (At least after the language changed it must be reloaded) -->
- Number on drawer is not corresponding with actual number of updatable adapters
<!-- - Tooltips: https://github.com/ioBroker/ioBroker.admin/issues/687 -->
<!-- - The version will not be automatically updated: https://github.com/ioBroker/ioBroker.admin/issues/688 -->
<!-- - Adapter => Filter installed adapters => The button has no primary color if active: https://github.com/ioBroker/ioBroker.admin/issues/689 -->
<!-- - Update log level if changed: https://github.com/ioBroker/ioBroker.admin/issues/690 -->
<!-- - Ask "Discard data?" if instance config not saved -->
<!-- - After some adapter with tab (like event list, node.red, ...) installed it must automaticall appear in drawer -->

## Settings
  
## Info

## Adapters
- Adapters - Use readme renderer from www.iobroker.net (BF)

## Wizard
<!-- - Theme switcher -->

## Discovery
- todo

## Logs
<!-- - Redesign - very much space for nothing -->
<!-- - PID hide/show, default hidden -->

## Instances

## Objects
- Decode quality code to text (BF)
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image uploa

## Files
- Instead of modal dialog with "OK" about cannor read, replace it with window.alert  
## Hosts

## Users
## Easy mode
<!-- - Easy admin mode -->
<!-- - If not strict mode, show button back to admin -->
<!-- - By clicking on ioBroker logo => #easy -->
- Show admin tabs: 
   - config => JsonConfig(jsonConfig: true),  index_m.html (materialize: true), index.html
   - admin => tab_m.html (materialize: true), tab_html

## After all is done
- Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)
