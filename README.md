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
- `%ip%` - ioBroker ip address (address of the admin)
- `%secure%` or `%protocol%` - read from `native.secure` the value and use http or https
- `%web_protocol%` - looking for the first instance of web (e.g., `web.0`) and get `native.secure` from `system.adapter.web.0`
- `%instance%` - instance of the adapter
- `%someField%` - get someField from `native` of this adapter instance
- `%web.0_bind%` - get `native.bind` from `system.adapter.web.0`
- `%native_someField%` - get someField from `native` of this adapter instance

## Scheduled restart
Some adapters are not stable or connection disappears after one or two days.
To fix this, there is a scheduled restart setting.
To activate scheduled restart, just define CRON condition when to restart adapter.

It is suggested to restart in the night, when no one use the adapter, e.g. `0 3 * * *` - at 3:00 every day.

## Let's Encrypt Certificates
To manage and update let's encrypt certificates you need to use [`iobroker.acme`](https://github.com/iobroker-community-adapters/ioBroker.acme) adapter.

You will have so-called "collections" of certificates. Each collection has its own domains.
You can select in configuration of admin adapter if and which collection to use.

## Simple instance's settings page
The user has the possibility to limit the access to the instance configuration dialog.
For that, the option "Allow access only to specific instances" must be activated.
It could be found on the "Access to the instances" tab.
Additionally, the allowed instances should be selected in the appeared configuration table.

If this option is disabled, the simple configuration page could be accessed under http://IP:8081/configs.html

## Reverse proxy
Please be sure that you forward not only the http/https requests, but the web-socket traffic too. It is essential for communication.

From version 6.1.0 you have the possibility to tune intro page for usage with reverse proxy.

### Example 
Your `ioBroker.admin` runs on port 8081 behind reverse proxy with domain `iobroker.mydomain.com` under path `/ioBrokerAdmin/`. 
And you set up e.g., nginx to forward the requests to the `http://local-iobroker.IP:8081`. 

The same is with your web instance: `https://iobroker.mydomain.com/ioBrokerWeb/ => http://local-iobroker.IP:8082`.
And with rest-api instance: `https://iobroker.mydomain.com/ioBrokerAPI/ => http://local-iobroker.IP:8093`.

You can add the following lines into Reverse Proxy tab to let Intro tab run behind reverse proxy properly:

| Global path       | Instance      | Instance path behind proxy |
|-------------------|---------------|----------------------------|
| `/ioBrokerAdmin/` | `web.0`       | `/ioBrokerWeb/`            |
|                   | `rest-api.0`  | `/ioBrokerAPI/`            |
|                   | `admin.0`     | `/ioBrokerAdmin/`          |
|                   | `eventlist.0` | `/ioBrokerWeb/eventlist/`  |

So all links of instances that use web server, like `eventlist`, `vis`, `material` and so on will use `https://iobroker.mydomain.com/ioBrokerWeb/` path

## OAuth2.0 Authentication flow
There is a possibility to use OAuth2.0 authentication for other services. Admin has an endpoint `oauth2_callbacks`. 

The calls like `http(s)://ip:port/oauth2_callbacks/adapterName.X/?state=ABC&code=123&param=true&param2` will be processed and the special message `oauth2Callback` will be sent to `adapterName.X` instance with query parameters `{"state": "ABC", "code": 123, "param": true, "param2": true}`.

As mandatory response the admin expects the object like: `{"result": "Show this text to user by success", "error": "ERROR: Result will be ignored"}`. The result or error will be shown to the user. Please send already translated messages.

## Used icons
This project uses icons from [Flaticon](https://www.flaticon.com/).

ioBroker GmbH has a valid license for all used icons.
The icons may not be reused in other projects without the proper flaticon license or flaticon subscription.

<!--
	### **WORK IN PROGRESS**
-->

## Changelog
### 6.6.4 (2023-07-28)
* (bluefox) Better licenses handling (especially for vis-2)

### 6.6.3 (2023-07-27)
* (foxriver76) fixed "Let's Encrypt" link not being clickable inside system settings
* (foxriver76) fixed false positives for "not much space left on device" warning
* (foxriver76) fixed issue with npm version determination on some installations
* (foxriver76) reset the logout timer UI if session is extended
* (rovo89) apply button color change of v6.6.1 for all buttons
* (foxriver76) correctly display materialized tabs when configured with io-package `adminUi` property
* (foxriver76) enable keyboard navigation for objects tab

### 6.6.1 (2023-07-17)
* (foxriver76) Many GUI improvements
* (bluefox) New json config component added: license agreement
* (foxriver76) also show non-stable repo warning on the hosts tab
* (foxriver76) fixed jsonConfig slider with different max/min values than 0/100
* (foxriver76) fixed jsonConfig number element arrows
* (foxriver76) fixed jsonConfig coordinates not triggering onChange and not being prefilled
* (foxriver76) fixed jsonConfig jsonEditor component
* (foxriver76) assume status as offline if status state value has been deleted (e.g., via `setState` with `expire` option)
* (foxriver76) fixed jsonConfig CheckLicense edge case error
* (foxriver76) added tooltip to ObjectBrowserValue to show that ack-flag cannot be used to control a device
* (foxriver76) fixed host name not being visible on some themes
* (foxriver76) fixed issue with jsonConfig CRON placeholder overlapping input
* (foxriver76) button color in non-expert mode will not be changed according to ack/q anymore
* (foxriver76) fixed multiple problems with jsonConfig coordinates when using `useSystemName` and separate `latitude`/`longitutde` states
* (foxriver76) when adding an icon to an object, to not show already uploaded non-existing image initially
* (foxriver76) when the session timer falls below the 2 - minute mark, show button to extend the session

### 6.6.0 (2023-07-05)
* (klein0r) New json config component added: accordion
* (bluefox) Added site name and corrected the system dialog

### 6.5.9 (2023-06-19)
* (bluefox) Added support for update of the js-controller slaves

## License
The MIT License (MIT)

Copyright (c) 2014-2023 bluefox <dogafox@gmail.com>
