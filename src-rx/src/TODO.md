# Todo

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

## Instances

## Objects
- Decode quality code to text (BF)
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image upload
  
## Objects - Custom editor
- edit config by JSON
  
## Files
<!-- - File viewer can show: json, js, ts, md, css, html -->
- Edit file ACL for "adapter" or "instance" (All folders of the first level)
- Edit files (by pressing button "Edit" opened edit mode) : json, js, txt, html (only in expert mode)// 
not editable
  
## Hosts
- extend hostsWorker to detect updates of hosts

## Users
- Do not allow edit of user ID

## Easy mode
- Easy admin mode

## After all is done
- Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io)

## Login and authentication
- check and implement id needed

## JSON config - Admin settings dialog (index_m.html)
- write it with react (see [SCHEMA.md](SCHEMA.md))
- Should work: admin, cloud, email
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)

- room editor (multiple or single choose)
- func editor (multiple or single choose)
<!-- - chips (see javascript config) -->
<!-- //- table!!! -->
- json editor as control

- Write jsonCustom for:
  - lovelace
  - eventlist
  - mqtt-client
  - ??