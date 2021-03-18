# Todo
- Adapters - update all adapters and allow to select from list (BF)
- Adapters - if language <> 'en' => https://www.iobroker.net/<ru>/adapterref/iobroker.<ADAPTERNAME>/README.md (BF) Use readme renderer from www.iobroker.net
- Adapters - Switch of hosts (if host only one, do not show the switcher)// (!only if more than one host)//
- Instances - Switch of hosts (if host only one, do not show the switcher)//(!only if more than one host)//
- Adapters/Instances/Logs - all have host selector//
  - Logs: this.logsWorker && this.logsWorker.setCurrentHost(this.state.currentHost);//
- Instances - make delete button work.
- Instances - Open in new window must be shown only for instances with localLink (BF)
- Instances - allow set of compact groups (only in compact mode) (new) socket.readBaseSettings => compact = true//
    - show only if system.adapter.NAME => common.compact==true and "base settings compact" === true, compactGroup = null, 0, ...

 - only for instances with common.compact == true, read group from common.compactGroup (default, 1, add)//
    - make it possible to enabled /disable compact mode
- Base settings => after changes are saved and dialog closed => make reload (no matter with restart or without)
- Instances - allow to enable/disable sentry settings (new) common.plugin.sentry.enabled => false
- Instances - allow to edit CRON/LogLevel/Restart/Name of instance
- Instances - show in/out events and RAM not only by opened items (only in the expert mode)//
- Instances - show instanes as tile too and toggle them with button//
- Objects - allow to filter only of states/channels/devices => another view (ack, ts, lc, etc)
- Objects - export/import and creation of new state
- Objects - edit of access control (similar to files)
- Files - bulk edit of access rights
- Hosts tab//
- Easy admin mode

## After all is done
- config.json describes how configuration dialog looks like
