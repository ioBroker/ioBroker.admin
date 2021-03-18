# Todo
- Adapters - update all adapters and allow to select from list (BF)
- Adapters - if language <> 'en' => https://www.iobroker.net/<ru>/adapterref/iobroker.<ADAPTERNAME>/README.md (BF) Use readme renderer from www.iobroker.net
- Adapters/Instances/Logs - all have host selector
  - Hosts could have own icons: system.host.NAME => common.icon and common.color (think about contrast)
    https://github.com/ioBroker/adapter-react/blob/master/src/Components/Utils.js#L925
- Adapters - add dialog show Change log (all entries in news) on "++"
  
- Instances - make delete button work.
  - executeCommand(`del ADAPTER_NAME.x`)
- Instances - Open in new window must be shown only for instances with localLink (BF)
<<<<<<< HEAD
=======
- Instances - allow set of compact groups (only in compact mode) (new) socket.readBaseSettings => compact = true//
    - show only if system.adapter.NAME => common.compact==true and "base settings compact" === true, compactGroup = null, 0, ...

 - only for instances with common.compact == true, read group from common.compactGroup (default, 1, add)//
    - make it possible to enabled /disable compact mode
- Base settings => after changes are saved and dialog closed => make reload (no matter with restart or without)
>>>>>>> 9e7b79cdd001a917b364d1b4df76873dd4633c37
- Instances - allow to enable/disable sentry settings (new) common.plugin.sentry.enabled => false
  - Fix it
- Instances - allow to edit CRON/LogLevel/Restart/Name of instance
 - Name edit dialog must have only one line for input and dialog title: "Enter title for %s" => I18n.t("AAA %s", instance)
 - Add title for restart dialog: "Edit restart rule for %s"
 - Add title for schedule dialog: "Edit schedule rule for %s"
 - Replace Schedule dialog with CRON

- Instances/List view - show in/out events and RAM not only by opened items (only in the expert mode)
  - Input Events, Output Events, RAM usage, log level
  - add tooltips "input events", "output events"
  - Change color of restart icon to orange
  - Make compact group smaller 
  - Remove sentry settings in not expert mode
  - Show schedule only for instances with common.mode === 'schedule'
     - https://github.com/iobroker-community-adapters/ioBroker.weatherunderground/blob/master/io-package.json#L269
- Instances - List view has to have all edit possibilities as Tile view
- Objects - allow to filter only of states/channels/devices => another view (ack, ts, lc, etc)
- Objects - export/import and creation of new state
- Objects - edit of access control (similar to files)
- Objects - Add clear button by all text (and maybe select) filter fields
- Files - bulk edit of access rights
- Hosts tab => show all hosts in a list with settings
- Easy admin mode

## After all is done
- config.json describes how configuration dialog looks like
