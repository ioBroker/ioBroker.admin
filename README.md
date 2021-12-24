![Logo](admin/admin.png)
# ioBroker.admin

![Number of Installations](http://iobroker.live/badges/admin-installed.svg)
![Number of Installations](http://iobroker.live/badges/admin-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.admin.svg)](https://www.npmjs.com/package/iobroker.admin)

![Test and Release](https://github.com/ioBroker/ioBroker.admin/workflows/Test%20and%20Release/badge.svg)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/admin/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)
[![Downloads](https://img.shields.io/npm/dm/iobroker.admin.svg)](https://www.npmjs.com/package/iobroker.admin)

User interface for configuration and administration of ioBroker.

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## Using common.localLink
- %ip% - ioBroker ip address (address of the admin)
- %secure% or %protocol% - read from `native.secure` the value and use http or https
- %web_protocol% - looking for the first instance of web (e.g. web.0) and get `native.secure` from `system.adapter.web.0`
- %instance% - instance of the adapter
- %someField% - get someField from `native` of this adapter instance
- %web.0_bind% - get native.bind from `system.adapter.web.0`
- %native_someField% - get someField from `native` of this adapter instance

## Scheduled restart
Some adapters are not stable or connection disappear after one or two days.
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

The certificates will be first requested when the given domain address will be accessed. E.g. you have "sub.domain.com" as address, when you try to access https://sub.domain.com the certificates will be first requested, and it can last a little before first answer will come.

The issuing of certificates is rather complex procedure, but if you will follow the explanation you will easy get free certificates.

Description:

1. The new account will be created with given email address (you must set it up in system settings)
2. Some random key will be created as password for the account.
3. After the account is created the system starts on port 80 the small website to confirm the domain.
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
The user has the possibility to limit the access to the instance configuration dialog.
For that the option "Allow access only to specific instances" must be activated.
It could be found on the "Access to the instances" tab.
Additionally, the allowed instances should be selected in the appeared configuration table.

If this option is disabled, the simple configuration page could be accessed under http://IP:8081/configs.html

## Reverse proxy
Please be sure that you forward not only the http/https requests, but the web-socket traffic too. It is essential for communication.

## Used icons
This project uses icons from [Flaticon](https://www.flaticon.com/).

ioBroker GmbH has a valid license for all of used icons.
The icons may not be reused in other projects without the proper flaticon license or flaticon subscription.

<!--
	Placeholder for the next version (at the beginning of the line):
	### __WORK IN PROGRESS__
-->

## Changelog
### 5.2.3 (2021-12-24)
* (bluefox) Fixed error in `AutocompleteSendTo`
* (bluefox) Fixed error in charts

### 5.2.2 (2021-12-21)
* (bluefox) Changed the minimal required js-controller version to 3.3.22 
* (bluefox) Used web-socket library 8 (no node 10 support anymore)

### 5.2.1 (2021-11-28)
* (bluefox) Allow in expert mode the creation of states and channels in mqtt branch

### 5.2.0 (2021-11-26)
* (Apollon77) Fix crash cases reported via sentry
* (bluefox) Added support for multi-repositories

### 5.1.28 (2021-11-10)
* (bluefox) Fixed discovery function
* (bluefox) Fixed some GUI bugs

## License
The MIT License (MIT)

Copyright (c) 2014-2021 bluefox <dogafox@gmail.com>
