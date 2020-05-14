![Logo](admin/admin.png)
# ioBroker.admin

[![NPM version](http://img.shields.io/npm/v/iobroker.admin.svg)](https://www.npmjs.com/package/iobroker.admin)
[![Downloads](https://img.shields.io/npm/dm/iobroker.admin.svg)](https://www.npmjs.com/package/iobroker.admin)
[![Stable](http://iobroker.live/badges/admin-stable.svg)](http://iobroker.live/badges/admin-stable.svg)
[![installed](http://iobroker.live/badges/admin-installed.svg)](http://iobroker.live/badges/admin-installed.svg)

[![NPM](https://nodei.co/npm/iobroker.admin.png?downloads=true)](https://nodei.co/npm/iobroker.admin/)

User interface for configuration and administration of ioBroker.

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## Using common.localLink
- %ip% - ioBroker ip address (address of the admin)
- %secure% or %protocol% - read from native.secure the value and use http or https
- %web_protocol% - looking for the first instance of web (e.g. web.0) and get "native.secure" from "system.adapter.web.0"
- %instance% - instance of the adapter
- %someField% - get someField from "native" of this adapter instance
- %web.0_bind% - get native.bind from "system.adapter.web.0"
- %native_someField% - get someField from "native" of this adapter instance

## Scheduled restart
Some adapters re not stable or connection disappear after one or two days.
To fix this there is a scheduled restart setting.
To activate scheduled restart just define CRON condition when to restart adapter.

It is suggested to restart in the night, when no one use the adapter, e.g. "0 3 * * *" - at 3:00 every day.

## Let's Encrypt Certificates
Let’s Encrypt is a free, automated, and open certificate authority brought to you by the non-profit Internet Security Research Group (ISRG).

You can read about Let’s Encrypt [here](https://letsencrypt.org/).

Some installations use Dynamic DNS and Co to get the domain name and to reach under this domain name own web sites.
ioBroker supports automatic request and renew of certificates from Let’s Encrypt Organisation.

There is an option to activate free certificates from Let’s Encrypt almost in every adapter, that can start some web server and supports HTTPS.

If you just enable the using of certificates and will not activate an automatic update the instance will try to use stored certificates.

If the automatic update is activated the instance will try to request certificates from Let’s Encrypt and will automatically update it.

The certificates will be first requested when the given domain address will be accessed. E.g you have "sub.domain.com" as address, when you try to access https://sub.domain.com the certificates will be first requested and it can last a little before first answer will come.

The issuing of certificates is rather complex procedure, but if you will follow the explanation you will easy get free certificates.

Description:

1. The new account will be created with given email address (you must set it up in system settings)
2. Some random key will be created as password for the account.
3. After the account is created the system starts on port 80 the small web site to confirm the domain.
4. Let's encrypt use **always** port **80** to check the domain.
5. If port 80 is occupied by other service see point 4.
6. After the small web server is up the request to get certificates for given domains (system settings) will be sent to the Let's encrypt server.
7. Let's encrypt server sends back some challenge phrase as answer on the request and after a while tries to read this challenge phrase on "http://yourdomain:80/.well-known/acme-challenge/<CHALLENGE>"
8. If challenge phrase from our side comes back the Let's encrypt server send us the certificates. They will be stored in the given directory (system settings).

Sounds complex, but everything what you must do is to activate checkboxes and specify your email and domain in system settings.

The received certificates are valid ca. 90 days.
After the certificates are received the special task will be started to automatically renew the certificates.

The topic is rather complex and 1000 things can go wrong. If you cannot get certificates please use cloud service to reach your installation from internet.

**Let's encrypt works only from node.js version>=4.5**

## Simple instance's settings page
The user have the possibility to limit the access to the instance configuration dialog.
For that the option "Allow access only to specific instances" must be activated.
It could be found on the "Access to instances" tab.
Additionally the allowed instances should be selected in the appeared configuration table.

If this option is disabled, the simple configuration page could be accessed under http://IP:8081/configs.html

## Todo
- move html tooltips to materialize tooltips
- tiles for hosts (additionally to table - low prior)
- tiles for instances (additionally to table - low prior)

## Used icons
This project uses some icons from [Flaticon](https://www.flaticon.com/):
- <img src="src/img/rooms/006-double-bed.svg" height="48" /> - designed by [smalllikeart](https://www.flaticon.com/authors/smalllikeart) from [Flaticon](https://www.flaticon.com/)
- <img src="src/img/rooms/016-armchair-1.svg" height="48" /> - designed by [smalllikeart](https://www.flaticon.com/authors/smalllikeart) from [Flaticon](https://www.flaticon.com/)
- <img src="src/img/rooms/022-sofa-1.svg" height="48" /> - designed by [smalllikeart](https://www.flaticon.com/authors/smalllikeart) from [Flaticon](https://www.flaticon.com/)
- <img src="src/img/devices/light-bulb.svg" height="48" /> - Icons made by [Vectors Market](https://www.flaticon.com/authors/vectors-market) from [Flaticon](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/).
- <img src="src/img/rooms/garage.svg" height="48" /> - designed by [Pause08](https://www.flaticon.com/authors/Pause08) from [Flaticon](https://www.flaticon.com/)
- <img src="src/img/rooms/toilet.svg" height="48" /> - Icons made by [Freepik](http://www.freepik.com) from [www.flaticon.com](https://www.flaticon.com/) is licensed by [CC 3.0 BY](http://creativecommons.org/licenses/by/3.0/)

## Changelog
### 4.0.10 (2020-05-14)
* (bluefox/Apollon77) Caught the web server errors
* (Apollon77) Prepare for js-controller 3.0 release

### 4.0.9 (2020-04-19)
* (Apollon77) Fix password encryption logics and make compatible to js-controller 3.x again

### 4.0.8 (2020-04-18)
* (bluefox) The attempt to process error by the gz log show.
* (bluefox) Implement new automatic encryption/decryption for js-controller 3.0
* (bluefox) add Sentry for error reporting with js-controller 3.0

### 4.0.5 (2020-02-23)
* (Apollon77) Workaround for socket.io bug #3555 added to make sure always the correct client files are delivered
* (Apollon77) remove socket.io-client dep again because we lookup via socket.io lib
* (klein0r) Added a warning message to Custom/GitHub installs (thanky @ldittmar81 for translations)

### 4.0.4 (2020-02-19)
* (Apollon77) Fix socket.io-client dependency

### 4.0.3 (2020-02-19)
* (bluefox) Encrypted configuration was corrected.

### 4.0.2 (2020-02-12)
* (Apollon77) Downgrade semver to 6.3 to stay compatible with nodejs 8

### 4.0.1 (2020-02-07)
* (bluefox) Fixed the loading of some adapter configurations

### 4.0.0 (2020-01-15)
* (Apollon77) upgrade all dependencies, especially socketio to current version! This might break ipad 1/2 devices

## License

The MIT License (MIT)

Copyright (c) 2014-2020 bluefox <dogafox@gmail.com>
