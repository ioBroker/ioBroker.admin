# Todo

## Settings
- Add warning dialog when the user switches from default to beta repository:
  - The "Latest" repository contains adapter versions that have not been fully tested. Please report problems with these versions to the developer or in the relevant forum threads. Use at your own risk. (Do not implement it yet)

## Info
- Request info one time in a day and show new information
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
- compactGroup => 
  - rows
- Filter does not work (e.g. email)  

## Objects
- Hide ACL for non experts
- Move Trash aligned with states for objects
- Decode quality code to text (BF)
- Add tooltip for ACL with full descripton: 
  - Owner: Admin, 
  - Group: Administrator
  - Owner can write object, 0x200  // green
  - Owner can read object, 0x400,
  - Group can write, Group can read, Everyone can read
  - Owner can write state // blue
- By bulc ACL edit, collect different options, show them with intermediate or --different-- and by apply do not change intermediate do different attributes if not set.  
- Replace all this.props.t() with this.texts.my_text... for often translations
  - For select category too
  
## Files
- Files - bulk edit of access rights
  - file.acl.permissions
  
## Hosts  
- Hosts tab => show all hosts in a list with settings

## Easy mode
- Easy admin mode

## After all is done
- config.json describes how configuration dialog looks like
