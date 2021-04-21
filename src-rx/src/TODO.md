# Todo

## Bugs
- Adapter tab: The version will not be automatically updated: https://github.com/ioBroker/ioBroker.admin/issues/688
- Ask "Discard data?" if instance config not saved for json config


Issues Admin5 Collection #1
* Intro
  * Camera tile delete missing

* Settings:
  * (BF)Copy the Statistic/Diag Info Text from non-react (was changed there but not in react)

* Expert Settings:
  * (BF)Below Compact mode checkbox add info text: "When enabled adapter instances can run in one or few
    processes to save RAM usage."
  * (BF)Below "Slave connection allow" add info text: "When activated this host can be discovered by other
    iobroker installations in your network to become the master of a multihost system."
  * Main Dialog title: add current hostname and Rename to "Host Base Settings: <hostname>"
  * (BF) Objects/States: support sentinel redis db configurations with multiple IPs. The host value in json
    can be Array like
    "host": [
    "192.168.178.119",
    "192.168.178.128",
    "192.168.178.129"
    ] OR ... a comma-separated list like 192.168.178.119,192.168.178.128,192.168.178.129
  * (BF) Objects/States redis: family should be a selection with values 0 (auto), 4 (IPv4) or 6 (IPv6)
  * Log: Move the "+" buttons to bottom of the page
  * Log: Change accordion title of log entries to other background color

* Adapter
  * Tile view: add Github logo (in front of installed version)
  * List view: Remove "Bugreport icon" on adapter logo and add as Sentry icon after the
    cloud/connection-type logos
  * Tile view: Add sentry icon if sentry plugin is used aside the cloud/conn-type logos
  * List view: Increase size of Adapter Logos (padding 0, size 32)
  * Both views: Update All dialog: move select all/none to right to be "over" the other checkboxes
  * List view: Custom Install warnings (both tabs) - add some more space on top of "Warning" text
  * Repository Version info need to be updated on reload
  * Rating dialog: Add info text: Rate how good this version of the adapter works on your system. You can vote for every new version.
  * Rating dialog: add close button
  * Add Rating in Listview below Adaptername
  
<!-- * Instances -->
  <!-- * Both views: (only expert mode) Add "common.tier" selection as dialog with infotext: "Tiers define the order of adapters when the
    system starts.". Tiers: 
    - "1: Logic adapters", 
    - "2: Data provider adapters", 
    - "3: Other adapters". If
    common.tier is not 1 or 2 display as 3
    - If nothing set, show 3 -->
  * If settings change for an adapter, the jump-link need to be updated
  
* Adapter Update Dialog: Only show "Dependency list" when at least one dep is not met
* Objects
  * Remove "Role" from "Edit Object dialog" when not state
  * Objects ACL Edit Dialog - table layout need fixing (sometimes)
  * Stateview: Headline "Quality Code" change to Quality
  * Stateview: Check alignment headline Timestamp, lastchange and Value to data columns
  * Filter for "Custom instance" not working
  * State updates should get the green blink of the value
  * State value color: Make "not-ack" red color lighter
  * Use default acl in table if object/state ACT does not exist, instead of showing NaN
  * Alias target do not jump to object - jump needs to open the tree
  * Alias ID can be object with read and write properties. Show both alternatively or ignore this case on display
  * Object editor Alias Tab: also allow to specify red/write ids
  * Too long roles need to be cut in table (e.g. indicator.maintenance.unreach)
  * Rename "Acknowledged flag" in State value tooltip to only "Acknowledge"
  * Role in table should only be editable in expert mode
  * Custom Edit History Data: Make "from" column wider (e.g. system.host.io-test)
  * Custom Edit History Data: Selection "Custom range" should be not grey

* Logs
  * When entering Message filter show clear button

* Hosts
  * Remove color effect and make indicator narrow (3-4px) in tile view and list
  * Line view: host color should be used
  * Move "Host base settings dialog" to Hosts tab and leave as wrench, but only show in expert mode
  * Add Notifications button with "bubble" to hosts list and allow open Notification dialog per host if something is there. Gray button out if no notifications exist for that host

* Easy Mode
  * Add padding at the page bottom

* AdminSettings: Access to instances: add infotexts for  "Apply access rights" and "Allow access only"

* General: Support the new io-package fields that replace materialize and materializeTab (but we need to be backward compatible)
  common.adminUI: {
  custom: 'json',
  config: 'materialize',
  tab: 'html'
  }
  
* JSonConfig: Implement cron editor
  * dependsOn -> alsoDependsOn und in confirm schieben

* Installation Wizard
  * Update License year for agreement
  * Switch position of Buttons on "License agreement" page (Agree to right)
  * Password Page: change color of "set Admin Password" button to primary
  * Settings: Map position not shown initially, change save button to primary
  * Finish Page: Have fun automating your home with <ioBroker-name logo>
  * Finish-Page: Jump to "Adapter" page when clicking Finish


## Settings
  
## Info

## Adapters
- Adapters - Use readme renderer from www.iobroker.net (BF)
- Update all adapters => Keep only one check box (Indeterminate => All => none). And move them to the right on the one line with others. And add tooltip (Select/unselect all)

## Wizard
- Theme switcher

## Discovery
- todo

## Logs
- Toggle the PID => layout problem

## Instances

## Objects
- Decode quality code to text (BF)
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image upload

## Files
## Hosts
- show - / - and not null / null, but only if events are not 0.

## Users
## Easy mode
<!-- - Show admin tabs: 
   - config => JsonConfig(jsonConfig: true),  index_m.html (materialize: true), index.html
   - admin => tab_m.html (materialize: true), tab_html -->

## After all is done
- Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)
- Table, move items up and down if add/delete possible 