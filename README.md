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
- (@GermanBluefox) Fixed: the `checkDocker` control of a configuration dialog showed the Docker of the host admin runs on, also for an instance on another host. Admin asks the host of the instance now; that host needs a js-controller with `CONTROLLER_CHECK_DOCKER`. With an older js-controller there, the dialog says that Docker cannot be checked instead of showing the wrong host
- (@GermanBluefox) Updated `@iobroker/json-config` to 10.1.9: the `checkDocker` control names the host of the instance
- (@GermanBluefox) Added: OpenRouter as provider in the AI settings of the system settings (`@iobroker/ai-core` 0.0.6, `@iobroker/ai-gui` 0.0.5)

### 8.3.5 (2026-10-26)
- (@GermanBluefox) Fixed: after a single sign-on the access and refresh token were put into the address (`?ssoLoginResponse=`), so they ended up in the browser history and in the logs of a reverse proxy. Only a one-time code is there now, admin fetches the tokens with it. The ID token that came back after connecting an identity (`?id_token=`, with name and e-mail) is not kept any more, nothing used it
- (@GermanBluefox) Fixed: the session cookie of a single sign-on was readable by scripts and sent along cross-site requests, unlike the one of a password login
- (@GermanBluefox) Fixed: behind a reverse proxy with https the single sign-on sent `http://.../sso-callback` to the identity provider, which did not match the registered redirect URI. The protocol now comes from `X-Forwarded-Proto`, and the external address of admin can be set in the SSO settings
- (@GermanBluefox) Important for everybody who had the single sign-on switched on with an admin before 8.3.4: an identity that somebody else connected with a user stays connected after the update. Check on the "Users" page that every user with single sign-on is connected with the right account, and disconnect the others
- (@GermanBluefox) Fixed: the device manager crashed if a slider of a device got a value that is not a number (#3699)
- (@GermanBluefox) Added: the system settings have an "AI" tab to set up the AI provider, its API key and the model once for the whole system; only one provider can be active
- (@GermanBluefox) Changed: the tabs of the system settings stand on the left with icons, on a phone on top
- (@GermanBluefox) Changed: the AI assistant takes provider, key and model from the "AI" tab of the system settings

### 8.3.4 (2026-10-25)
- (@typhosj) Fixed: the license dialog of a paid adapter stayed empty and could not be accepted, so the adapter could not be installed. The dialog loaded `licenseInformation.link` as the license text, but that link names the page with prices and where to buy, which the browser may not read. The license text comes from the repository of the adapter again, and the link is shown next to it. A license text that cannot be loaded no longer blocks the dialog, and a short Markdown text that needs no scrolling can be accepted (#3311, ioBroker/ioBroker.vis-2#707)
- (@agross) Improved the English wording of the active repository warning.
- (@GermanBluefox) Fixed: "Add Single-Sign On" in the user dialog sent the display name of the user instead of the user ID, so connecting failed for every user whose name differs from the ID

### 8.3.3 (2026-10-23)
- (@GermanBluefox) Fixed: the object browser showed an object twice and copied its row while scrolling, if a sibling ID began with the same text followed by a space (#3693)

### 8.3.2 (2026-10-23)
- (@GermanBluefox) Fixed: the adapter list was empty after an adapter update and switching between the tabs (#3695)
- (@GermanBluefox) Fixed: an adapter updated while the adapter list was loading was still offered for update with the same version

### 8.3.1 (2026-10-22)
- (@GermanBluefox) Added: sort icon and tooltip on the sort button in the adapters tab (#3684)
- (@GermanBluefox) Added: disk and RAM usage of the host are shown as bars with tooltip in the instances tab
- (@GermanBluefox) Added: the repository version of an adapter can be installed with one click, if a newer or a self-installed version (e.g., from GitHub) is installed (#2973)

## License

The MIT License (MIT)

Copyright (c) 2014-2026 bluefox <dogafox@gmail.com>

[Full license text](LICENSE)
