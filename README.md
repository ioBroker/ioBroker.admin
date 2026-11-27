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
- (@GermanBluefox) Install dialog: npm recommended, clearer warnings, examples and CLI command (#3743)

### 8.3.16 (2026-11-26)
- (@GermanBluefox) Quick access: filter field above the cards
- (@GermanBluefox) Log: "All hosts" shows the logs of all hosts together
- (@GermanBluefox) Fixed: the note that an adapter allows only one instance per host showed "%s" instead of the host
- (@GermanBluefox) Updated @iobroker/gui-components to 10.4.9 and @iobroker/json-config to 10.1.25: the folder buttons of the object browser do not open or close on hover anymore

### 8.3.15 (2026-11-20)
- (@GermanBluefox) Installed version: its changes as tooltip, the change log on click
- (@GermanBluefox) Adapter list: warning when the active repository does not exist
- (@GermanBluefox) Adapters and hosts tabs follow updates of the repository
- (@GermanBluefox) A repository update no longer sends the whole repository to every admin page
- (@GermanBluefox) Fixed: quick access shows newly installed adapters only after a reload
- (@GermanBluefox) Updated @iobroker/gui-components to 10.4.8: status icons no longer cover a narrow ID column (#3741)

### 8.3.14 (2026-11-17)
- (@GermanBluefox) Deleting an adapter in a multihost system deletes it also on the other running hosts that hold its package but no longer need it: each host is asked with `getAdapterUsage` (js-controller 8.0 and newer), which also knows the packages a host keeps for the web extension of an instance on another host. A host that does not run or does not answer keeps the package. `iobroker del` on the command line still deletes on its own host only
- (@GermanBluefox) The dialog "Write value" shows how big a string or JSON value is
- (@GermanBluefox) Fixed: in the dialog "Write value" the value type was empty for JSON values and the type "JSON/Object" did not open the JSON editor
- (@GermanBluefox) Instances can get the log level "off" (no log at all, not even errors), if js-controller 8 runs on their host
- (@GermanBluefox) Updated @iobroker/json-config to 10.1.23: `selectSendTo` shows a text field instead of an endless spinner when the instance gives no list, `autocompleteSendTo` shows its `options`; the dialog of `diskSelector` comes from @iobroker/gui-components
- (@GermanBluefox) Updated @iobroker/gui-components to 10.4.7: new dialog `DialogSelectDiskPath` (file or folder on the disk of a host); the description of a CRON schedule is shown in Portuguese, Dutch and Chinese instead of English
- (@GermanBluefox) Overview: the panels have the same color as the tiles of the quick access
- (@GermanBluefox) Fixed: a `sendTo` button in the configuration showed a success after 30 s and lost the answer of an adapter that needed longer (#3737)
- (@GermanBluefox) Updated @iobroker/socket-client to 5.7.0 (`callbackTimeout`) and @iobroker/json-config to 10.1.24 (`sendTo` timeout)
- (@GermanBluefox) The device manager in the settings or a tab of an instance can be pinned to the navigation, like in the device manager tab (#3738)

### 8.3.13 (2026-11-15)
- (@GermanBluefox) Two-factor authentication with an authenticator app: every user sets it up in the user menu (QR code, backup codes), the login page asks for the code, administrators can switch it off for other users in the user dialog
- (@GermanBluefox) Updated @iobroker/webserver to 3.5.0: two-factor authentication (TOTP) for the login
- (@GermanBluefox) Updated @iobroker/socket-classes to 2.11.0: a user with two-factor authentication cannot connect with the password alone (basic authentication or `?user=&pass=`)

### 8.3.12 (2026-11-13)
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
- (@GermanBluefox) Updated @iobroker/webserver to 3.4.1: a disabled user cannot sign in with single sign-on anymore, like with a password (apart from `admin`)

## License

The MIT License (MIT)

Copyright (c) 2014-2026 bluefox <dogafox@gmail.com>

[Full license text](LICENSE)
