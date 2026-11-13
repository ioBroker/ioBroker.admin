<img src="admin/admin.svg" width="100" height="100" />

# ioBroker.admin

![Number of Installations](http://iobroker.live/badges/admin-installed.svg)
![Number of Installations](http://iobroker.live/badges/admin-stable.svg)
[![NPM version](http://img.shields.io/npm/v/iobroker.admin.svg)](https://www.npmjs.com/package/iobroker.admin)

![Test and Release](https://github.com/ioBroker/ioBroker.admin/workflows/Test%20and%20Release/badge.svg)
[![Translation status](https://weblate.iobroker.net/widgets/adapters/-/admin/svg-badge.svg)](https://weblate.iobroker.net/engage/adapters/?utm_source=widget)
[![Downloads](https://img.shields.io/npm/dm/iobroker.admin.svg)](https://www.npmjs.com/package/iobroker.admin)

User interface for configuration and administration of ioBroker.

**This adapter uses Sentry libraries to automatically report exceptions and code errors to the developers.** For more details and for information on how to disable the error reporting, see [Sentry-Plugin Documentation](https://github.com/ioBroker/plugin-sentry#plugin-sentry)! Sentry reporting is used starting with js-controller 3.0.

## JSON config schema

The JSON config schema description can be found at [JSON config schema](/packages/jsonConfig/README.md).

## Using common.localLink

-   `%ip%` - ioBroker ip address (address of the admin)
-   `%secure%` or `%protocol%` - read from `native.secure` the value and use http or https
-   `%web_protocol%` - looking for the first instance of web (e.g., `web.0`) and get `native.secure` from `system.adapter.web.0`
-   `%instance%` - instance of the adapter
-   `%someField%` - get someField from `native` of this adapter instance
-   `%web.0_bind%` - get `native.bind` from `system.adapter.web.0`
-   `%native_someField%` - get someField from `native` of this adapter instance

## Scheduled restart

Some adapters are not stable, or the connection disappears after one or two days.
To fix this, there is a scheduled restart setting.
To activate scheduled restart, just define CRON condition when to restart adapter.

It is suggested to restart in the night, when no one uses the adapter, e.g. `0 3 * * *` - at 3:00 every day.

## Let's Encrypt Certificates

To manage and update, let's encrypt certificates you need to use [`iobroker.acme`](https://github.com/iobroker-community-adapters/ioBroker.acme) adapter.

You will have so-called "collections" of certificates. Each collection has its own domains.
You can select in the configuration of the admin adapter if and which a collection to use.

## Simple instance's settings page

The user has the possibility to limit the access to the instance configuration dialog.
For that, the option "Allow access only to specific instances" must be activated.
It could be found on the "Access to the instances" tab.
Additionally, the allowed instances should be selected in the appeared configuration table.

If this option is disabled, the simple configuration page could be accessed under `http://IP:8081/configs.html`

## AI assistant

The admin interface includes an AI assistant (the floating button in the lower-right corner). It can answer
questions about your ioBroker system, recommend adapters for a device or service, and — in "Actions" mode — make
changes after your explicit confirmation. The assistant must first be enabled in the admin instance settings
(`native.disableMcp` must be off); then pick an AI provider, credential and model in the assistant settings dialog.

### Using the assistant without an API key (external MCP client)

If you do not want to configure an AI provider/API key inside ioBroker, you can instead drive the assistant from
an external AI client (Claude Desktop, Codex, Gemini CLI, …). The client connects directly to ioBroker through the
MCP (Model Context Protocol) server.

Open the assistant and click the **"Use without an API key"** button (the cable icon in the header). The dialog
walks you through three steps:

1.  **Install the MCP server** — install the `iobroker.mcp` adapter, ideally as a web extension of your `web`
    (or `admin`) instance. It exposes ioBroker's tools to any MCP-compatible AI client. The dialog shows whether
    the adapter is already installed.
2.  **Add the MCP server in your AI client** — register a new MCP server in your client using the URL shown in the
    dialog, e.g. `http(s)://<host>:<port>/mcp`. The dialog lists the actual endpoint(s) of your installation (the
    embedded admin endpoint and any `web`/`mcp` instances) together with a copy button.
3.  **System prompt** — the same dialog also shows the exact system prompt the built-in assistant uses, with a
    read-only/actions toggle and a copy button. It is intentionally not reproduced here; copy it from the dialog and
    paste it as the system/instructions prompt in your AI client to get the same behaviour.

## Reverse proxy

The reverse proxy documentation can be found at [Reverse proxy](REVERSE_PROXY.md).

## Used icons

This project uses icons from [Flaticon](https://www.flaticon.com/).

ioBroker GmbH has a valid license for all used icons.
The icons may not be reused in other projects without the proper flaticon license or flaticon subscription.

[Older changelog](CHANGELOG_OLD.md)

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### **WORK IN PROGRESS**
- (@GermanBluefox) Fixed: after "Check adapters for updates" or `iobroker update`, the adapter list shows when the repository was read and not when it was generated (#3729)
- (@GermanBluefox) Updated @iobroker/json-config to 10.1.20: `cron` in the JSON config does not offer the wizard of schedules anymore, which wrote `{}` into the field
- (@GermanBluefox) Updated @iobroker/gui-components to 10.4.6: the CRON dialog has the new mode "Hourly" for a fixed minute of every hour, does not overwrite a schedule that the simple mode cannot show and does not accept invalid values
- (@GermanBluefox) Fixed: the adapter list does not scroll to the top when an adapter is installed
- (@GermanBluefox) Overview shows a hint when a js-controller update is available (#3722, #1914)
- (@GermanBluefox) Fixed: the repository time stamp is updated on the first click of "Check adapters for updates" (#3724)
- (@GermanBluefox) Updated @iobroker/gui-components to 10.4.5: in the JSON config, `customFilter` of `objectId` with `common.role` as a string shows the matching objects and not all others
- (@GermanBluefox) Updated @iobroker/json-config to 10.1.21: `translate` for `text`, also in tables (#3721)
- (@GermanBluefox) Fixed: about 70 texts were not translated, e.g. "Invalid version of ... Required ... Current"; missing spaces in the Windows update commands of js-controller
- (@GermanBluefox) Fixed: a single sign-on ignored "Stay logged in" and always kept the login for 30 days in the browser. Tokens of an earlier login are removed before the new ones are stored, so they cannot hide them

### 8.3.11 (2026-11-07)
- (@GermanBluefox) Fixed: in the file rights dialog, a "different" permission could not be set for all files
- (@GermanBluefox) Updated @iobroker/json-config to 10.1.19: added the control `diskSelector` to select a file or a folder on the disk of the host where the instance runs (needs js-controller with `CONTROLLER_READ_DISK_DIR`)
- (@krobipd) Fixed: saving the instance settings writes only the settings changed in the dialog, so a setting the adapter wrote into its native while the dialog was open (e.g. its device list) is no longer set back (json-config 10.1.19)
- (@GermanBluefox) Updated @iobroker/socket-classes to 2.10.3: the host commands `readDiskDir` and `deleteDiskFile` need the permission for `cmdExec`

### 8.3.10 (2026-11-06)
- (@GermanBluefox) Fixed: "REAUTHENTICATE!" log flood (#3110)
- (@GermanBluefox) Fixed: the "connection lost" overlay appears only after 2 seconds; loading a tab shows a spinner instead of it
- (@GermanBluefox) Updated `@iobroker/gui-components` to 10.4.3: the loader uses the background of the theme
- (@GermanBluefox) Updated `@iobroker/json-config` to 10.1.17: `coordinates` shows the position on an OpenStreetMap with `map: true`, a click on the map or dragging the marker sets it, `mapStyle` chooses the colors and `readOnly` only shows it; `custom` shows web components of `@iobroker/web-components` (`webComponent`); the text patterns know `_instance`. Admin provides the map, loaded only when a configuration shows one

### 8.3.9 (2026-11-05)
- (@GermanBluefox) Changed: the dialog "Update all adapters" shows the overall progress and the result of each adapter
- (@GermanBluefox) Added: tabs without permission show a lock instead of errors
- (@GermanBluefox) Added: without write rights, instances, enums, users, files, objects and system settings are read-only
- (@GermanBluefox) Updated `@iobroker/json-config` to 10.1.13: the configuration dialogs use the animated icons: upload with progress and result, trash cans, copy with a check mark instead of the alert "Copied", `sendTo` and `setState` confirm the result in the button, rows of tables light up and slide out; fixes for `fileSelector`, `image` with `base64` and the CSV import into an empty table
- (@GermanBluefox) Updated `@iobroker/gui-components` to 10.4.1: animated trash cans, upload, copy and reload symbols in the file and object browser, placeholder rows while the objects are loading, `UploadImage` shows the upload
- (@GermanBluefox) Added: the rights of each object itself (owner, group, everybody) are checked as well

### 8.3.8 (2026-11-04)
- (@GermanBluefox) Added: menu badges jump when their number grows; a ring turns around the adapter icon while it is installed or updated
- (@GermanBluefox) Changed: instance rows fade into the color of the new status; all elements of a row are centered vertically
- (@GermanBluefox) Updated `@iobroker/gui-components` to 10.3.16: arrow up/down at changed numbers in the object browser, check mark after saving
- (@GermanBluefox) Added: admin serves React 19 and 18 as ES modules under `lib/esm/` for web components (`@iobroker/web-components`)
- (@GermanBluefox) Updated packages (`node-forge` 1.4.3, `@module-federation/vite` 1.23.9)

### 8.3.7 (2026-11-03)
- (@GermanBluefox) The `checkDocker` control showed the Docker of the admin host for an instance on that host, also if the instance uses another Docker - e.g. one on a NAS that the adapter names in `iobDockerApi` of its plugin config, or that is chosen in the instance settings. Now admin asks the js-controller of its host as well, if it can check Docker (`CONTROLLER_CHECK_DOCKER`): it checks the Docker connection of the instance, with the `@iobroker/plugin-docker` of the adapter. If it cannot - an older js-controller, an adapter without the plugin - admin checks the Docker of its host itself, as before
- (@GermanBluefox) Updated `@iobroker/json-config` to 10.1.11: `validatorErrorText` is shown below the element instead of the help text, also in the cells of a table (#1911)
- (@GermanBluefox) History data: live values are marked and replaced with the stored ones every 10 seconds; added a reload button (ioBroker.sql#600)
- (@GermanBluefox) An update can be ignored also if its dependencies are not met (#3713)
- (@GermanBluefox) Added: animated icons for start/stop, status, notifications, menu, reload, delete, connection and the result of a command
- (@GermanBluefox) Added: the start/stop button of an instance shows a ring until the instance really runs or stopped
- (@GermanBluefox) Changed: new expert mode symbol (mortarboard)
- (@GermanBluefox) Added: animated folders in the object browser; the restart button of an instance turns until the instance is alive again
- (@GermanBluefox) Changed: the pause button of the log shows the number of new lines as a badge
- (@GermanBluefox) Fixed: the access control dialog crashed with "Error in GUI" and the owner or group could not be changed, if the children had different owners or groups (#3711)

## License

The MIT License (MIT)

Copyright (c) 2014-2026 bluefox <dogafox@gmail.com>

[Full license text](LICENSE)
