# Todo

Marked with "!" must be in release candidate

## Bugs
- (BF) AdminSettings: Access to the instances: add infotexts for "Apply access rights" and "Allow access only"
- !(BF) General: Support the new io-package fields that replace materialize and materializeTab (but we need to be backward compatible)
  common.adminUI: {
    custom: 'json''
    config: 'materialize', 'none', 'html'
    tab: 'html'
  }
- News check does not work: https://github.com/ioBroker/ioBroker.admin/issues/839

## Intro

## Easy Mode

## Settings

## Info

## Enums

## Adapters
- Update of available versions does not work: https://github.com/ioBroker/ioBroker.admin/issues/830

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
<!-- - Subscribe on hosts and update information (especially about updates) -->

## Users

## After all is done
- ! (BF) Add encryption in frontend (Is it required? User can use encrypt / decrypt function of socket io) (BF)

## Login and authentication
- (BF) show login dialog after TTL over

## JSON config - Admin settings dialog (index_m.html)
- Write gulp script, that collects words from jsonConfig/jsonCustom and creates i18n files automatically (BF)