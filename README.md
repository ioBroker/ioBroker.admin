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

## Used icons

This project uses icons from [Flaticon](https://www.flaticon.com/).

ioBroker GmbH has a valid license for all used icons.
The icons may not be reused in other projects without the proper flaticon license or flaticon subscription.

## Changelog
<!--
	### **WORK IN PROGRESS**
-->
### 7.7.3 (2025-09-25)
- Many GUI changes: See previous changelog below for details

### 7.7.2 (2025-09-24)
- (@copilot) Fixed JSONCONFIG table validator bug where validation errors persisted after deleting table rows
- (@GermanBluefox) Made small fix for JsonConfig component `state`
- (@copilot) Fixed repository refresh issue: repositories are now automatically refreshed when switching repository source (stable/latest) without requiring manual "Check for updates"
- (@copilot) Added CSV file editing support in file browser - CSV files can now be edited directly in the file manager
- (@copilot) Implemented sortable columns for instances table (name, status, memory, ID, host, loglevel)
- (@copilot) Fixed adapter license icon linking to use commercial license URL instead of GitHub license
- (@copilot) Fixed license icon spacing in list view to maintain consistent layout
- (@GermanBluefox) Allows entering minus values with JsonConfig number component
- (@copilot) Fixed textIP checkbox inconsistency between Objects and States tabs for the same host configuration
- (@GermanBluefox) Added icon to `www` folder for windows
- (@copilot) Confirmed and documented Copilot issue handling guidelines: PRs use neutral language (no "fixes" keywords), issues closed manually by maintainers, and "fixed" labels added when appropriate
- (@copilot) Enhanced Copilot instructions to make issue management policy more prominent - no auto-closing issues, manual validation required
- (@copilot) Enhanced repository timestamp display to show both generated and read timestamps - shows when repository data was generated and when it was last read by admin backend
- (@copilot) Fixed jsonConfig port validation to properly account for bind addresses, allowing the same port on different IP addresses
- (@copilot) Added error indicators to JSON Config tabs and accordions to improve the visibility of validation errors
- (@copilot) Added export/import functionality for accordion sections in JsonConfig allowing users to save accordion data as JSON files and import them back with replace or add options
- (@copilot) Fixed time difference warning that incorrectly appeared when the browser tab was inactive for a while
- (@copilot) For GitHub-installed adapters, show version + commit hash instead of just version
- (@copilot) Fixed table export error when table items contain null values
- (@copilot) Object Browser: Added formatted duration display for values with role "value.duration" - shows time durations in HH:mm:ss format instead of raw seconds
- (@copilot) Enhanced GitHub Actions to skip tests when only README.md is changed, speeding up CI for Copilot PRs (tested with mixed file changes)
- (@GermanBluefox) Added the docker checker in JSON config
- (@copilot) Fixed js-controller update notifications to use "The js-controller" instead of "Adapter js-controller"
- (@copilot) Fixed JSONConfig sendTo jsonData attribute parser problem where backslashes (\) in text inputs caused JSON parsing errors
- (@copilot) Fixed step type behavior in chart display - "Schritte" now shows value until next point (step after) instead of step before
- (@copilot) Added all three-step type options (stepStart, stepMiddle, stepEnd) to chart display with clearer descriptions
- (@copilot) Fixed React error #62 in the Files tab caused by malformed CSS calc() function
- (@copilot) Added loading indicator to JSONConfig autocompleteSendTo component during sendTo operations
- (@copilot) Mark adapters removed from repository with "not maintained" text instead of empty version field
- (@copilot) Enhanced responsive design: modals and popups now use full screen on xs and sm breakpoints
- (@copilot) Added logout dropdown menu to user icon for improved user experience
- (@copilot) Updated OAuth2 documentation in DEVELOPER.md to include both cloud-based and direct callback approaches with clear guidance on when to use each method
- (@copilot) Only show adapters with satisfied dependencies in update all dialog
- (@copilot) Added new `readOnly` attribute for jsonEditor in jsonConfig - allows opening the editor to view JSON content without allowing modifications
- (@GermanBluefox) Reading of same instances was optimized in GUI
- (@GermanBluefox) Do not show the http page if admin is secured
- (@GermanBluefox) Show loading progress for custom tabs
- (@GermanBluefox) Fixing change of the language in the admin

### 7.7.1 (2025-06-20)
- (@GermanBluefox) Fixing clearing of the filter on the object tab

### 7.7.0 (2025-06-17)
- (@foxriver76) Added the concept for single-side-on authentication (SSO)

### 7.6.20 (2025-06-16)
- (@GermanBluefox) Allowed using of * in the filter of objects
- (@GermanBluefox) Small GUI improvements

## License

The MIT License (MIT)

Copyright (c) 2014-2025 bluefox <dogafox@gmail.com>
