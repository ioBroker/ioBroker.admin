# Todo
- Adapters - update all adapters and allow to select from list (BF)
- Adapters - show accept license dialog for non MIT licenses (common.license !== "MIT" => common.extIcon.split('/master')[0] + '/master/LICENSE'). Only if no instances yet.//
    - provide the current theme for dialog
- Adapters - if language <> 'en' => https://www.iobroker.net/<ru>/adapterref/iobroker.<ADAPTERNAME>/README.md (BF) Use readme renderer from www.iobroker.net
- Adapters - license button color//
- Adapters - Switch of hosts (if host only one, do not show the switcher)// (!only if more than one host)//
- Instances - Switch of hosts (if host only one, do not show the switcher)//(!only if more than one host)//

- Instances - Open in new window must be shown only for instances with localLink (BF)
- Instances - add filter // 
- Instances - add "Disk free: 97 %, Total RAM usage: 270 Mb / Free: 2% = 314 Mb [Host: MacBook-Pro-Igor.local - 5 p"//
- Instances - allow set of compact groups (only in compact mode) (new) socket.readBaseSettings => compact = true//
 - only for instances with common.compact == true, read group from common.compactGroup (default, 1, add)//
- Instances - allow to enable/disable sentry settings (new) common.plugin.sentry.enabled => false
- Instances - allow to edit CRON/LogLevel/Restart/Name of instance
- Instances - show in/out events and RAM not only by opened items (only in the expert mode)
- Instances - show instanes as tile too and toggle them with button
- Objects - allow to filter only of states/channels/devices => another view (ack, ts, lc, etc)
- Objects - export/import and creation of new state
- Objects - edit of access control (similar to files)
- Files - bulk edit of access rights
- Hosts tab//
- Easy admin mode

## After all is done
- config.json describes how configuration dialog looks like
