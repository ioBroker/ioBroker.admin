# Todo

- Change color of expert icon on red(ON)

## Adapters
- Adapters - update all adapters and allow to select from list (BF)
- Adapters - Use readme renderer from www.iobroker.net (BF)
- Adapters/Instances/Logs - 
  - Hosts could have own icons: system.host.NAME => common.icon and common.color (think about contrast)
    https://github.com/ioBroker/adapter-react/blob/master/src/Components/Utils.js#L925
- Adapters - add dialog Instal specific version (all entries in news) on "++"
  - cmd  `upgrade NAME@1.6.7`
- Adapters - save in localStorage "close on exit" by cmd dialog
- Adapters in Tile mode show "connectionType": "local/cloud"
- Adapter dataSource (How to show poll/push/assumption) ? (BF)

## Instances  
- Instances - Open in new window must be shown only for instances with localLink (BF)
- Instances - allow to edit CRON/LogLevel/Restart/Name of instance
   - CRON/Restart Use ComplexCron dialog
 - Name edit dialog must have only one line for input and dialog title: 
   - Disable OK Button if no changes
- Instances - Add for compact group icon: auto_awesome_motion
- Instances/List mode - move all info inside of accordeon 

## Objects
- Objects - allow to filter only of states/channels/devices => another view (ack, ts, lc, etc)
- Objects - export/import and creation of new state
- Objects - edit of access control (similar to files)
- Objects - Add clear button by all text (and maybe select) filter fields

## Others
- Files - bulk edit of access rights
- Hosts tab => show all hosts in a list with settings
- Easy admin mode

## After all is done
- config.json describes how configuration dialog looks like
