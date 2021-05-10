# Todo

Marked with "!" must be in release candidate

## Bugs
- (BF) AdminSettings: Access to the instances: add infotexts for "Apply access rights" and "Allow access only"
- Add to expert dialog: don't show anymore

## Intro
- Images have different width

## Easy Mode

## Settings

## Info

## Enums
- Find icon of object (state => channel => device)
- Show in second row ID in state
- Use default Icon depends on type (state, channel, device)
- Create enums, that not exists automatically. E.g. `enum.rooms.A.kitchen` exists, but `enum.rooms.A` not, So `enum.rooms.A` must be created.
- Update structure of enums by changes from outside
- Expand/Collapse all in tree
- Expand/Collapse of one enumeration to make it narrow with showing the number of objects inside
- expand/collapse all to narrow view and back  
- Scroll to new created/copied enumeration

## Adapters
- Update of available versions does not work: https://github.com/ioBroker/ioBroker.admin/issues/830
- Switch of host does not make any effect: https://github.com/ioBroker/ioBroker.admin/issues/819 

## Wizard

## Discovery
## Logs
- !ON multihost no source at all - https://github.com/ioBroker/ioBroker.admin/issues/777 //not track
- !On safari new coming entries have invalid time https://github.com/ioBroker/ioBroker.admin/issues/783 //not track

## Instances
- Extended filter: 
  - save all filters in localStorage  

- Group by category https://github.com/ioBroker/ioBroker.admin/issues/293

## Objects
    
## Files

## Hosts

## Users

## After all is done
- ! (BF) Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- (BF) show login dialog after TTL over

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)
