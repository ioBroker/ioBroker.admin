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

## Dependencies between the ioBroker packages
Admin is two npm projects: the backend in `package.json` (runs in Node.js) and the frontend in `src-admin/package.json`
(bundled by vite into `www/`). The `@iobroker/*` packages nest like this (versions as of admin 8.0.11):

```
ioBroker.admin
├── Backend (package.json, Node.js)
│   ├── @iobroker/adapter-core          adapter API (peers: @iobroker/types, @iobroker/js-controller-common-db)
│   ├── @iobroker/webserver             HTTP(S) server, certificates, OAuth2 login: /oauth/token, access_token cookie
│   ├── @iobroker/ws-server             WebSocket server: upgrade request, its authentication, message framing
│   ├── @iobroker/socket-classes        socket commands, permissions, token/session check of every command
│   │   └── @iobroker/adapter-core
│   ├── @iobroker/mcp-server            MCP endpoint of the AI assistant
│   │   ├── @iobroker/type-detector
│   │   └── @iobroker/webserver@2       its own, older copy (not the one above)
│   ├── @iobroker/plugin-docker
│   │   └── @iobroker/plugin-base
│   └── dev only
│       ├── @iobroker/ws                browser WebSocket client; `npm run build` copies build/esm/socket.io.min.js
│       │                               to src-admin/public/lib/js/socket.io.js, served as lib/js/socket.io.js
│       ├── @iobroker/types, @iobroker/dm-utils (-> adapter-core), @iobroker/build-tools
│       └── @iobroker/eslint-config, @iobroker/testing, @iobroker/legacy-testing
└── Frontend (src-admin/package.json, browser)
    ├── @iobroker/gui-components        React components (formerly adapter-react-v5), I18n, themes
    │   ├── @iobroker/socket-client     Connection/AdminConnection: commands over the socket, token storage and refresh
    │   │   └── @iobroker/ws            at runtime only: the global `io` from lib/js/socket.io.js, no npm dependency
    │   ├── @iobroker/type-detector
    │   └── @iobroker/types, @iobroker/js-controller-common(-db)   types and helpers only
    ├── @iobroker/json-config           JSON config renderer (admin settings and every adapter settings page)
    │   └── @iobroker/gui-components
    ├── @iobroker/dm-gui-components     device manager tab
    │   ├── @iobroker/gui-components
    │   └── @iobroker/json-config
    └── dev only: @iobroker/socket-client (listed directly, must match the version gui-components uses), @iobroker/dm-utils
```

The login and the session live in four places: `@iobroker/webserver` issues the tokens and sets the cookie,
`@iobroker/ws-server` and `@iobroker/socket-classes` check the token when the socket connects and on every command,
`@iobroker/socket-client` refreshes the token in the browser, and `src-admin/src/login/Login.tsx` is the login page.

Which packages have to be published and bumped after a change (each step: publish, then raise the version in the
next package):

| Changed package               | Then update, in this order                                                                                                                                         |
|-------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@iobroker/ws` (client)       | admin `package.json` (dev). `npm run build` copies it into `src-admin/public/lib/js/socket.io.js`                                                                  |
| `@iobroker/ws-server`         | admin `package.json`                                                                                                                                               |
| `@iobroker/socket-classes`    | admin `package.json` (also ioBroker.web, ioBroker.socketio, ioBroker.ws)                                                                                           |
| `@iobroker/webserver`         | admin `package.json` (also ioBroker.web; `@iobroker/mcp-server` carries its own copy)                                                                              |
| `@iobroker/adapter-core`      | admin `package.json`, `@iobroker/socket-classes`, `@iobroker/dm-utils`                                                                                             |
| `@iobroker/socket-client`     | `@iobroker/gui-components` -> `@iobroker/json-config` and `@iobroker/dm-gui-components` -> `src-admin/package.json` (both the direct entry and the three packages) |
| `@iobroker/gui-components`    | `@iobroker/json-config` -> `@iobroker/dm-gui-components` -> `src-admin/package.json` (all three)                                                                   |
| `@iobroker/json-config`       | `@iobroker/dm-gui-components` -> `src-admin/package.json` (both)                                                                                                   |
| `@iobroker/dm-gui-components` | `src-admin/package.json`                                                                                                                                           |

The frontend packages must end up with one copy each: if `src-admin/package.json` and `@iobroker/json-config` ask for
ranges of `@iobroker/gui-components` that do not overlap, vite bundles two copies and React contexts, I18n and themes
break in the parts that got the second copy. The same holds for `@iobroker/socket-client`.

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### **WORK IN PROGRESS**
- (@GermanBluefox) Fixed: the admin sent the user to the login page and sometimes logged them out for good, when the access token expired while the browser tab was in the background. The refresh timer of a hidden tab fires late, and the server cut the connection the very second the token expired. Together with the new `@iobroker/socket-classes` and `@iobroker/socket-client` the connection now refreshes the token when the server asks for it, and a refresh that was already done by another tab is no longer mistaken for an invalid login
- (@GermanBluefox) Fixed: the login page threw the stored tokens away when its token refresh failed because another tab had renewed them in the meantime, which logged out every tab
- (@GermanBluefox) Added the setting "Stay logged in for" (days). Until now the login without a password was renewed for one week at most
- (@GermanBluefox) Fixed: `/session` always reported an expired session, as it looked up the second character of the access token instead of the token
- (@GermanBluefox) The help text of "Login timeout" explains that the value is the lifetime of the access token, which is renewed automatically while the admin is open
- (@GermanBluefox) Fixed with the new `@iobroker/gui-components`: the object browser lost the column widths as soon as the objects page was left and opened again, the checkboxes of the states view columns had no effect while "Auto" was off, the buttons column could not be resized, and switching "Auto" off left the table with nothing but the ID column after a reload: https://github.com/ioBroker/ioBroker.admin/issues/3616
- (@GermanBluefox) Fixed: an adapter could be updated although a dependency was not fulfilled. The update dialog showed the dependency in red, but the check behind the button did not know `globalDependencies`, where an adapter declares which admin version it needs. Both now come from the same place, which also covers the other hosts of a multihost setup: https://github.com/ioBroker/ioBroker.admin/issues/3614

### 8.0.11 (2026-09-01)
- (@GermanBluefox) CI: requests to a host that is not running (e.g. in adapter tests without js-controller) are answered immediately with a timeout error, so the GUI does not wait for its read timeout
- (@GermanBluefox) Fixed: clearing the adapter name filter showed an empty adapter list instead of all adapters

### 8.0.9 (2026-08-31)
- (@GermanBluefox) The discovery dialog opens on the result page when the last scan left proposals that are not ignored
- (@GermanBluefox) The discovery button carries a badge with the number of proposals that are neither created nor ignored
- (@GermanBluefox) Added the option to create the first instance directly after the installation from npm/GitHub/URL/file, if the adapter has no instance yet
- (@GermanBluefox) Updated web socket server
- (@GermanBluefox) Improvements of the device manager

### 8.0.8 (2026-08-27)
- (@GermanBluefox) Added the option to answer ACME HTTP-01 challenges of the acme adapter
- (@GermanBluefox) Fixed the CORS headers missing on the OAuth2 endpoints. They answer without passing the request on, so retrieving a token from a browser on another origin failed with `No Access-Control-Allow-Origin header is present`. The CORS middleware is now registered in front of all routes
- (@GermanBluefox) `src-admin/src/version.json` is now generated from `package.json` at build time, so the version logged by the GUI is no longer stale

### 8.0.7 (2026-08-26)
- (@GermanBluefox) The JSON tabs (`common.adminTab.link`) are now validated against the JsonConfig schema too
- (SimonFischer04) Admin can now run behind a reverse-proxy sub-path (e.g. `/admin/`)
- (SimonFischer04) Prefix legacy jQuery adapter-icon URLs and inject `info.js` into `<HEAD>` as well
- (@GermanBluefox) Corrected layout of Config view

### 8.0.5 (2026-08-19)
- (@GermanBluefox) Corrected the doubled tiles in the quick access if more than one web instance is running
- (@GermanBluefox) Reworked the initial setup wizard: modern layout, navigation backwards and many corrections
- (@GermanBluefox) Rounded the options toolbar in the adapter update dialog
- (@GermanBluefox) Removed warning about not installed docker.

## License

The MIT License (MIT)

Copyright (c) 2014-2026 bluefox <dogafox@gmail.com>
