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
- (@GermanBluefox) Fixed: iobroker.pro cloud can open the instance settings now

### 8.1.2 (2026-10-11)
- (@GermanBluefox) Changed: the AI assistant uses the shared libraries `@iobroker/ai-core` and `@iobroker/ai-gui`
- (@GermanBluefox) Fixed: loading the AI models and MCP info
- (@GermanBluefox) Added: used host resources (ports, serial, USB...) on the hosts and instances tabs
- (@GermanBluefox) Fixed: "Add instance" is hidden for single-instance adapters (#3677)
- (@GermanBluefox) Fixed: "Error in GUI" after an admin update (#3678)
- (@GermanBluefox) Fixed: unclear "Cannot compare" warnings and a request of `/.undefined` (#3679)

### 8.1.1 (2026-10-08)
- (@krobipd) Fixed: with the GUI settings stored on the server, a window of the admin threw away what others had saved in the meantime
- (@GermanBluefox) Fixed: compressed log files (`.gz`) are shown unpacked again
- (@GermanBluefox) Fixed: the link of a web extension to its own service (e.g. `http://%native_friurl%` of frigate) was sent to the web instance

### 8.1.0 (2026-10-07)
- (@GermanBluefox) Fixed: "Save & Close" of the base settings was active while the settings were still loading
- (@GermanBluefox) Changed: the news in the update dialogs are rendered as Markdown
- (@GermanBluefox) Fixed: links with `localhost`, `127.0.0.1` or `0.0.0.0` (e.g. `http://%native_friurl%`) now use the address of the instance's host
- (@GermanBluefox) Fixed: the log search and the MCP info dialog require the `execute` right
- (@GermanBluefox) Fixed: the AI assistant no longer trusts endpoint, permissions and confirmations from the request; tools run with the rights of the user who asked. Reported by two external security researchers
- (@GermanBluefox) Fixed: AI assistant answers and log searches longer than 30 seconds ended in an empty answer or "timeout"; the result is pushed to the browser now
- (@GermanBluefox) Added: "Maximum answer length" in the settings of the AI assistant (Anthropic)
- (@GermanBluefox) Fixed: the news of the notification dialog were always shown in English (#3534)
- (@GermanBluefox) Fixed: the notification dialog showed "undefined" when a translation was missing
- (@GermanBluefox) Fixed: Chrome offered to generate and store a password in the API key fields of the credentials

### 8.0.23 (2026-10-03)
- (@GermanBluefox) Changed: the info dialog of a host on the quick access page shows what it knows instead of what the host sends. Every line has an icon in front of it - the penguin, the window, the apple or the daemon for the platform, a chip for the CPU, a clock for the time - the names start with a capital letter, and a `true` is now a "Yes". The disk is no longer two lines with two numbers but one bar that fills with the free space, `11.8 GB / 26.2 GB`, red as soon as less than a tenth is left. The time of the host was a bare timestamp like `1790980340380` because the entry was looked up under `Time` while the host calls it `time`; it is now the wall clock of the host, shifted by the time zone the host reports, so neither UTC nor the time zone of the browser is shown
- (@GermanBluefox) Changed: "adapters count" is called "Adapters in repository" now. It counts the adapters that the active repository offers - 812 of them - and was read as the number of the installed ones
- (@GermanBluefox) Fixed: ENTER in the "Write value" dialog reloaded the whole GUI now and then. Its inputs sit in a `<form>` whose `onSubmit` returned `false` - which prevents nothing in react - so the browser submitted the form, and as it has no `action`, it requested the current address anew. Chrome submits on ENTER in a one line input and on CTRL+ENTER in a text area, which is exactly when it happened. The same form is used by the value editor of the history table and by the multihost settings
- (@GermanBluefox) Added: CTRL+ENTER confirms the dialogs of the object browser, the expert mode included: "Write value" whatever the type of the state is, "Edit object", the role, the alias, the new object, the custom settings ("Save & close"), rename/copy and the import of objects. Only a few text fields reacted to the combination, the JSON editors and all other inputs did not, and nothing told about the shortcut - the confirming button of every one of these dialogs carries the hint as a tooltip now
- (@GermanBluefox) Changed: a global dependency has to be fulfilled on every host of a multihost system, but the update dialog showed a single version and crossed it out - `admin (>=8.0.0): 8.0.14` with a red cross in front of it, which reads as if 8.0.14 were older than 8.0.0. The hosts that still run a version that is too old are listed under the line now, each with the version it has, and the tooltip of the adapter row says the same instead of "Invalid version of admin. Required >=8.0.0. Current 8.0.14" (#3666)
- (@GermanBluefox) Added: an instance whose adapter is not installed on its host is marked as such. It can never start, and nothing said why - it stayed red among the ones that are merely stopped. A restored backup leaves such instances behind: the objects of the adapter come back with the backup, while the code of an adapter that has left the repository, `flot` for example, cannot be installed any more. The status indicator of the row carries an error sign now, the tile one next to the name, and both say "The adapter is not installed on host ..." on hover. Only the host itself knows what it really has, so every host that runs is asked - without the list of the instances waiting for the answer (#3626)
- (@GermanBluefox) Added: the context menu of the object browser has an entry "Edit name" (Alt+9), without the expert mode and next to "Edit function" and "Edit room". Changing the name of an object is an everyday operation, but it was only reachable through "Edit object" - which the expert mode hides. A name that is translated keeps its other languages, only the language of the GUI is written (#3640). Lives in `@iobroker/gui-components` and needs its next version
- (@GermanBluefox) Fixed: the settings page of admin showed the whole "Single sign-on" tab in English, whatever the language: none of its labels and hints had ever reached `admin/i18n`, so every one of them fell back to its English key. The five texts of the AI assistant about leaving a tab were missing in nine languages, and the hint about the filtered adapters was left in English in Chinese

## License

The MIT License (MIT)

Copyright (c) 2014-2026 bluefox <dogafox@gmail.com>

[Full license text](LICENSE)
