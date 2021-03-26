# Todo

## Settings

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

## Adapters
- Adapters - Use readme renderer from www.iobroker.net (BF)
- Show number of possible updates on "Adapters" in menu on the left (impossible ?)
## Instances

## Objects
- Decode quality code to text (BF)
- ACL dialog scroll only checkboxes
<!-- - By bulc ACL edit, collect different options, show them with intermediate or --different-- and by apply do not change intermediate do different attributes if not set.   -->
- ACL settings for non-existing objects with '---' and "apply to children" selected
- highlight "different with (opacity: 0.5)

## Files
- Files - bulk edit of access rights
  - file.acl.permissions
  
## Hosts  
- Hosts tab => show all hosts in a list with settings

## Easy mode
- Easy admin mode

## After all is done
- config.json describes how configuration dialog looks like
