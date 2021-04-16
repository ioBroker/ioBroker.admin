# Todo
 - Move logout button to menu . Always last and not orderable
 - Remove in mobile view from instances the RAM info
 - Files. layout in mobile is broken
 - Files. Make from copy content just "Copy" on mobile mode
 - Files. Title rtl + elipsis
## Settings
  
## Info
- Request info one time in a day and show new information
  <!-- - admin.X.info.newsFeed => JSON https://github.com/ioBroker/ioBroker.docs/blob/master/info/news.json -->
  <!-- - admin.X.info.lastNewsId => consists of last read news -->
  - IF the user presses OK => So delete acknowledged news from the list.
  <!-- - Subscribe on `admin.X.info.newsFeed` and test on update -->
  - start news check with 5 sec delay

  <!-- - news could have the attribute "img" and if it is present, so show it at the top of the dialog
  - news could have the attribute "link" if it presents so show the button with "linkTitle" -->
  <!-- - Title of the dialog: You have unread news -->
  <!-- - Buttons of the dialog: "Acknowledge" -->


<!-- - Support of notifications: https://github.com/ioBroker/ioBroker.js-controller/pull/1153 
  - system.host.HOSTNAME.notifications -->
  <!-- - this.props.socket.getRawSocket().emit('sendToHost', host, 'getNotifications', {}, notifications =>);
  - this.props.socket.getRawSocket().emit('sendToHost', host, 'clearNotifications', {category: name}, 
  notifications =>); -->
  - start notifications check with 4 sec delay
  - Read notifications by host change


## Adapters
- Adapters - Use readme renderer from www.iobroker.net (BF)
- Show number of possible updates on "Adapters" in menu on the left (impossible ?)

## Wizard
- Theme switcher

## Discovery
- todo

## Logs
- Redesign - very much space for nothing

## Instances

## Objects
- Decode quality code to text (BF)
- Add in object edit the possibility to set color and icon (icon could be uploaded as base64 and may not be bigger than 5k) and use it for text color. Add possibility to scale the images.
  - Integrate https://react-dropzone.js.org/#!/Doka for image upload

- make formatDate accept settings about date format

## Files
<!-- - File viewer can show: json, js, ts, md, css, html (use ace aditor for viewing too) -->
  
## Hosts

## Users
- Do not allow edit of user ID

## Easy mode
- Easy admin mode

## After all is done
- Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- check and implement if needed

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)
- comport selector (BF)
<!-- - json editor as control -->

<!-- - Write jsonCustom for:
  - lovelace
  - eventlist
  - mqtt-client
  - ?? -->