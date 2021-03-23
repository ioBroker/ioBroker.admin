# Todo

- Change color of expert icon on red(ON)

## Settings
- Add warning dialog when the user switches from default to beta repository:
  - The "Latest" repository contains adapter versions that have not been fully tested. Please report problems with these versions to the developer or in the relevant forum threads. Use at your own risk. (Do not implement it yet)

## Info
- Request info one time in a day and show new informaiton
  - admin.X.info.news => JSON https://github.com/ioBroker/ioBroker.docs/blob/master/info/news.json
  - admin.X.info.lastNewsId => consists of last read news
  - IF the user presses OK => So delete acknowledged news from the list.
  - news could have attribute "img" and if it is present, so show it at the top of the dialog
  - news could have attribute "link" if it present so show the button with "linkTitle"
  - Title of the dialog: You have unread news
  - Buttons of the dialog: "Acknowledge"
  - Subscribe on admin.X.info.news and test on update

## Adapters
- Adapters - update all adapters and allow to select from list (BF)
- Adapters - Use readme renderer from www.iobroker.net (BF)
<!-- - Adapters - add dialog Instal specific version (all entries in news) on "++"
  - Changedialog title: "Please select specific version of %s" -->
<!-- - Adapters in Tile mode show "connectionType": "local/cloud"
  - Add tooltip: "Adapter does not use the cloud for these devices/service" / "Adaper requires the specific cloud access for these devices/service" -->
<!-- - Adapter dataSource (How to show poll/push/assumption). Near the connection type: poll => arrow up, push => arrow down, assumption => | (with title) -->
<!-- - Show unmet dependencies: 
  - function checkDependencies(dependencies) { -->

## Instances  
- Instances - Open in new window must be shown only for instances with localLink (BF)
<!-- - Instances - allow to edit CRON/LogLevel/Restart/Name of instance
   - Show schedule and restart only for adapters with mode 'schedule' or 'daemon' -->

## Objects
<!-- - Objects - allow to filter only of states/channels/devices => another view (ack, ts, lc, etc) -->
- Objects - export/import and creation of new state
- Objects - edit of access control (similar to files)
- Objects - Add clear button by all text (and maybe select) filter fields//

## Others
- Files - bulk edit of access rights
- Hosts tab => show all hosts in a list with settings
- Easy admin mode

## After all is done
- config.json describes how configuration dialog looks like
