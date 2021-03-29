# Todo

- send change of theme into iframe via messages
  - and expert mode change

## Settings
- Allow set the expert mode in settings
  - Save expert mode in session storage
  
## Info
- Request info one time in a day and show new information
  - admin.X.info.newsFeed => JSON https://github.com/ioBroker/ioBroker.docs/blob/master/info/news.json
  - admin.X.info.lastNewsId => consists of last read news
  - IF the user presses OK => So delete acknowledged news from the list.
  - news could have the attribute "img" and if it is present, so show it at the top of the dialog
  - news could have the attribute "link" if it presents so show the button with "linkTitle"
  - Title of the dialog: You have unread news
  - Buttons of the dialog: "Acknowledge"
  - Subscribe on `admin.X.info.newsFeed` and test on update

- Support of notifications: https://github.com/ioBroker/ioBroker.js-controller/pull/1153 
  - system.host.HOSTNAME.notifications

## Adapters
- Adapters - Use readme renderer from www.iobroker.net (BF)
- Show number of possible updates on "Adapters" in menu on the left (impossible ?)
- Open the configuration dialog for just installed instance (only if document.hidden === false) (https://github.com/ioBroker/ioBroker.admin/issues/541)
- Show which version is minimal required by the dependencies' problem (https://github.com/ioBroker/ioBroker.admin/issues/507)
  - https://github.com/ioBroker/ioBroker.admin/issues/557

## Instances
<!-- - fix layout by long adapter names (see screenshot in telegram) -->
<!-- - Check what happens if CRON has value like "03 0,6,13,22 *" (https://github.com/ioBroker/ioBroker.admin/issues/360) -->
<!-- - Mode in which the whole title background indicates the state of instance (https://github.com/ioBroker/ioBroker.admin/issues/652) -->

## Objects
- Decode quality code to text (BF)
<!-- - ACL dialog scroll only checkboxes -->
<!-- - ACL settings for non-existing objects with '---' and "apply to children" selected -->
<!-- - highlight "different" with (opacity: 0.5) -->
<!-- - Create object of type "folder": only in "alias.0" and "0_userdata.0" (https://github.com/ioBroker/ioBroker.admin/issues/577) -->

## Objects - Custom editor
- edit config by JSON

## Files
- Files - bulk edit of access rights
  - file.acl.permissions//
- File viewer can show: json, js, ts, md,css
- Allow switch of background color for images: jpg, png, bmp, svg, ico, jpeg
  
## Hosts  
- Hosts tab => show all hosts in a list with settings

## Users
- Do not allow edit of user ID

## Easy mode
- Easy admin mode

## After all is done
- Add encryption in frontend
- config.json describes how configuration dialog looks like

## Login and authentication
- check and implement id needed

## Admin settings dialog (index_m.html)
- write it with react