# Todo

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
- Adapters - Use readme renderer from www.iobroker.net (BF)
- Show number of possible updates on "Adapters" in menu on the left (impossible ?)

## Instances  
- Instances - Open in new window must be shown only for instances with localLink (BF)
- Sentry disabled => common.disableDataReporting = true common.plugins.senty
- compactGroup => 
  - with controller (0)
  - default (1) (if null of undefined)
  - 2

## Objects
- Objects - export/import and creation of new state
- Objects - edit of access control (similar to files)
  - obj.acl.object 
    - 0x2 => write everyone, 
    - 0x4 => read everyone
    - 0x20 => write group
    - 0x40 => read group
    - 0x200 => read owner
    - 0x400 => read owner
  - if (obj.acl.object & 0x40) => read group possible 
  - Set flag => obj.acl.object | 0x40
  - Clear flag => obj.acl.object & (~0x40)

  - obj.acl.state
- Objects - Add clear button by all text (and maybe select) filter fields//
- Decode quality code to text (BF)
- Replace all this.props.t() with this.texts.my_text... for often translations


## Files
- Files - bulk edit of access rights
  - file.acl.permissions
## Hosts  
- Hosts tab => show all hosts in a list with settings

## Easy mode
- Easy admin mode

## After all is done
- config.json describes how configuration dialog looks like
