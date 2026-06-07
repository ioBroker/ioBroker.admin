<img src="packages/admin/admin/admin.svg" width="100" height="100" />

# ioBroker.admin

![Number of Installations](http://iobroker.live/badges/admin-installed.svg)
![Number of Installations](http://iobroker.live/badges/admin-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.admin.svg)](https://www.npmjs.com/package/iobroker.admin)

![Test and Release](https://github.com/ioBroker/ioBroker.admin/workflows/Test%20and%20Release/badge.svg)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/admin/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)
[![Downloads](https://img.shields.io/npm/dm/iobroker.admin.svg)](https://www.npmjs.com/package/iobroker.admin)

User interface for configuration and administration of ioBroker.

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information how to disable the error reporting see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## JSON config schema

The JSON config schema description can be found at [JSON config schema](/packages/jsonConfig/SCHEMA.md).

## Using common.localLink

-   `%ip%` - ioBroker ip address (address of the admin)
-   `%secure%` or `%protocol%` - read from `native.secure` the value and use http or https
-   `%web_protocol%` - looking for the first instance of web (e.g., `web.0`) and get `native.secure` from `system.adapter.web.0`
-   `%instance%` - instance of the adapter
-   `%someField%` - get someField from `native` of this adapter instance
-   `%web.0_bind%` - get `native.bind` from `system.adapter.web.0`
-   `%native_someField%` - get someField from `native` of this adapter instance

## Scheduled restart

Some adapters are not stable or connection disappears after one or two days.
To fix this, there is a scheduled restart setting.
To activate scheduled restart, just define CRON condition when to restart adapter.

It is suggested to restart in the night, when no one use the adapter, e.g. `0 3 * * *` - at 3:00 every day.

## Let's Encrypt Certificates

To manage and update, let's encrypt certificates you need to use [`iobroker.acme`](https://github.com/iobroker-community-adapters/ioBroker.acme) adapter.

You will have so-called "collections" of certificates. Each collection has its own domains.
You can select in configuration of admin adapter if and which collection to use.

## Simple instance's settings page

The user has the possibility to limit the access to the instance configuration dialog.
For that, the option "Allow access only to specific instances" must be activated.
It could be found on the "Access to the instances" tab.
Additionally, the allowed instances should be selected in the appeared configuration table.

If this option is disabled, the simple configuration page could be accessed under `http://IP:8081/configs.html`

## Reverse proxy

The reverse proxy documentation can be found at [Reverse proxy](REVERSE_PROXY.md).

## Used icons

This project uses icons from [Flaticon](https://www.flaticon.com/).

ioBroker GmbH has a valid license for all used icons.
The icons may not be reused in other projects without the proper flaticon license or flaticon subscription.

## Changelog
<!--
	### **WORK IN PROGRESS**
-->
### 7.7.22 (2025-12-15)
- (@GermanBluefox) Layout fix in edit object dialog

### 7.7.20 (2025-11-15)
- (@GermanBluefox) Small optimizations
- (@GermanBluefox) Allowed to upload objects via text

### 7.7.19 (2025-10-26)
- (@GermanBluefox) Updated schema location for JsonConfig

### 7.7.18 (2025-10-25)
- (@GermanBluefox) Improvement of categories: drag&drop, visibility
- (@copilot) Added missing filterFunc property to jsonConfig objectId schema to match documentation and implementation
- (@copilot, @SimonFischer04) Added extended reverse proxy example section with screenshots, limitations (admin root requirement), and adapter compatibility notes
- (@copilot, @SimonFischer04) Fixed instances page reverse proxy link mapping so adapter localLinks are rewritten to the configured proxy paths (prefix matching + web port replacement, with duplicate link collapse)
- (@copilot, @SimonFischer04) Fixed intro page reverse proxy link remapping so links are correctly rewritten immediately and after navigating away and back (load reverseProxy config before instance scan and use prefix startsWith matching)
- (@GermanBluefox) Fixed multi-selection in the select ID dialog

### 7.7.3 (2025-09-25)
- Many GUI changes: See previous changelog below for details

## License

The MIT License (MIT)

Copyright (c) 2014-2025 bluefox <dogafox@gmail.com>
