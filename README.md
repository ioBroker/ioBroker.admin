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

## Changelog
<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->
### **WORK IN PROGRESS**
- (@krobipd) Fixed: on a slow or busy host, the admin start ended with "Cannot get hosts: Error: timeout" and an empty menu column until the page was reloaded. The menu and the host selector now try again (after 2 s, 5 s, then every 10 s) and after a reconnect, without an alert for each failed attempt; a missing permission is still reported once
- (@krobipd) Fixed: when the instance objects could not be read, the pinned config manager entries were deleted from the menu
- (@krobipd) Changed: several instance changes in a row rebuild the menu only once, and an older rebuild can no longer overwrite a newer one
- (@GermanBluefox) Changed: in the categories, an object dragged from one room or function onto another one is moved there; it is copied only if Shift, Ctrl or Alt is held while dropping (formerly only Alt, and the object often appeared to be copied anyway). The preview at the pointer shows whether it will be moved or copied, and a hint below the members explains the keys
- (@GermanBluefox) Fixed: after an object was moved to another room or function, it was still shown in the old one until the page was reloaded
- (@GermanBluefox) Added: the "Default History" selection in the base settings shows the icons of the history adapters, in the list and in the field
- (@GermanBluefox) Added: the base settings open with the tab that was used last, unless the link names a tab

### 8.0.17 (2026-09-20)
- (@BenAhrdt) Added: a config manager instance can be pinned to the menu. The pin sits in the toolbar of the device list and creates an entry that opens exactly this instance, so an adapter no longer needs an `adminTab` of its own just to lead there. The pinned instances are stored per browser (or in the GUI settings, if they are switched on), and an instance that is deleted or no longer offers a device manager loses its entry
- (@GermanBluefox) Added: a quick filter in the menu. From 11 entries on, a magnifier appears next to the logo; it turns the header into a text field and hides the menu entries that do not match. Both the translated and the English name are searched, so the English name of a tab finds it in every language; Enter opens the first hit, Escape closes the filter
- (@GermanBluefox) Added: the "Used by" column of the credentials now lists the scripts, too. Admin searches the sources of all scripts for `SECRETS.<ID>` (also `SECRETS['<ID>']`) and shows the scripts that read the credential; hovering an entry shows the full script ID. The engine of the script provides the icon, so `script.js.*` and `script.py.*` are treated alike

### 8.0.16 (2026-09-18)
- (@GermanBluefox) Fixed: once the order of the menu was saved, the tab of a newly installed adapter always came last and its `common.adminTab.order` had no effect. The tab is now placed after the tab that precedes it by order; the tabs the user has arranged keep their position
- (@GermanBluefox) Fixed: admin wrote the system config each time the menu was loaded or an instance changed, even though nothing had changed
- (@GermanBluefox) Added: with HTTPS enabled, admin speaks HTTP/2 - the browser loads the page and all its files over a single connection. Clients without HTTP/2 fall back to HTTP/1.1 automatically; the new option "Use HTTP/2" in the instance settings turns it off
- (@GermanBluefox) Fixed: the MCP endpoint built into admin (`/mcp`) always answered with the 404 page, so MCP clients could not connect to it
- (@GermanBluefox) Changed: the "page not found" page has the look of admin 8, follows its light or dark theme and is shown in the language of admin

### 8.0.15 (2026-09-16)
- (@GermanBluefox) Added: the Log tab searches the log files of the selected host - also the rotated and gzipped ones, based on [ioBroker.logsearch](https://github.com/disaster123/ioBroker.logsearch) by @disaster123. Typing in the message field still filters the shown entries; Enter searches the files with all filters of the table. The time column chooses the range - from the latest entries up to 30 days - and new entries keep arriving live. Entries that span several lines, like stack traces, stay together. The files of the own host are read from the disk; another host searches its files itself if its js-controller supports `CONTROLLER_SEARCH_LOGS`, otherwise it sends them with `getLogFile`. A new button exports the shown entries as a text file
- (@GermanBluefox) Fixed: the choice "Tips at start" in the system settings showed its two options in English in every language, as the entry was missing the flag that translates the values
- (@GermanBluefox) Fixed: the first "Did you know?" tip showed the raw `<img src='...' />` tag as text instead of the expert-mode icon. A tip may contain images now: the `src` is a file or a data URI, `width`, `height` and `alt` are optional, and `class='icon'` draws a monochrome icon in the color of the text, so that it stays visible in the dark themes as well
- (@GermanBluefox) Fixed: the system settings closed by themselves right after opening them on the "Objects" or "Files" tab while an object or file was selected. The browser wrote its selection back into the URL and so replaced the dialog there
- (@GermanBluefox) Changed: the country lists in the system settings and in the wizard start with Germany, Austria and Switzerland. A separator follows, and then all other countries, sorted by their name in the current language instead of the English one. Both lists are the same now, and the 29 countries without translation got one

### 8.0.14 (2026-09-15)
- (@GermanBluefox) Fixed: the old, non-React adapter configuration pages stayed bright in the `modernDark` theme. Their stylesheet only knows the theme names that existed when it was written, so `adapter-settings.js` maps every newer name - `modernDark`, `modernLight` and the vendor themes - down onto the plain `dark`/`light` it descends from. React-based configurations are untouched: they take the theme from the local storage and keep the new designs
- (@GermanBluefox) Fixed: after saving an enum (e.g., a new icon) or dragging an object into it, the "Enums" tab showed only this one enum until the page was reloaded. The collected changes did not start from a copy of all enums any more, so the list was rebuilt from the changed enum alone; deleted enums did not disappear either
- (@GermanBluefox) Added: the object list on the right side of the "Enums" tab can be hidden with a new toolbar button, and the choice is remembered. While it is hidden, a hint explains that states, channels and devices are added by dragging them from this list
- (@GermanBluefox) Added: every enum in the "Enums" tab has an "Add objects" button, which opens the object selection with multi-select - adding members no longer requires drag and drop
- (@GermanBluefox) Fixed: dropping a folder that is not an object itself (e.g. `0_userdata.0.lights`) onto an enum showed only a "TODO" alert. Now it asks whether to add the states, channels and devices found below it
- (@GermanBluefox) Fixed: enum members whose object was deleted were hidden silently but stayed in the enum. They are shown now with a warning and can be removed
- (@GermanBluefox) The "Enums" tab reads the members of all enums with a few bulk requests instead of one request per member
- (@GermanBluefox) The icon selection of enums, users and groups offers the new icon library of `@iobroker/gui-components`: 448 icons in 15 categories with names in all languages and a search, next to the classic room and device icons
- (@GermanBluefox) Fixed: rooms created by the setup wizard got the file name of their icon (e.g. "Living Room") instead of the icon itself, so they were shown without an icon
- (@GermanBluefox) The room and function templates are taken from `@iobroker/gui-components` now, the admin's own copy of the template icons was removed
- (@GermanBluefox) New layout of the "Enums" tab: a compact list of the entries of a category on the left (nested entries like floors can be opened and closed), the details of the selected entry in the middle and the object list on the right, which collapses into a narrow bar. The details group the members by device or channel and show their role, their current value and the rooms or functions they belong to - a click on one of them opens it. Objects, members and entries can be dragged onto the list and onto the details. On narrow screens the list and the details are shown one after another

### 8.0.12 (2026-09-09)
- (@GermanBluefox) Updated `@iobroker/json-config` to 10.x, which does not bring `react-ace` any more: the admin hands its own editor in with the new property `AceEditor`. Until now every custom component of every adapter carried the whole `ace-builds` in its bundle, although only three of the sixty controls ever show an editor
- (@GermanBluefox) Added the "Did you know ...?" dialog. It shows one tip about the admin when it is opened, and one can leaf through the tips. The checkbox in the dialog switches it off for the whole installation, and the system settings switch it on again ("Tips at start")
- (@GermanBluefox) Fixed: the assistant switched the reasoning of an OpenAI-compatible endpoint off as soon as a base URL was configured. That is right for a small local model and wrong for everything else - in front of a proxy that serves a hosted model it turns off the reasoning one is paying for. The chat settings have a "Reasoning effort" selector now, and its default leaves the parameter out and lets the endpoint decide. A model that refuses function tools while reasoning still gets `none` automatically, as before, because it says so itself
- (@GermanBluefox) Fixed: the admin sent the user to the login page and sometimes logged them out for good, when the access token expired while the browser tab was in the background. The refresh timer of a hidden tab fires late, and the server cut the connection the very second the token expired. Together with the new `@iobroker/socket-classes` and `@iobroker/socket-client` the connection now refreshes the token when the server asks for it, and a refresh that was already done by another tab is no longer mistaken for an invalid login
- (@GermanBluefox) Fixed: the login page threw the stored tokens away when its token refresh failed because another tab had renewed them in the meantime, which logged out every tab
- (@GermanBluefox) Added the setting "Stay logged in for" (days). Until now the login without a password was renewed for one week at most
- (@GermanBluefox) Fixed: `/session` always reported an expired session, as it looked up the second character of the access token instead of the token
- (@GermanBluefox) The help text of "Login timeout" explains that the value is the lifetime of the access token, which is renewed automatically while the admin is open
- (@GermanBluefox) Fixed with the new `@iobroker/gui-components`: the object browser lost the column widths as soon as the objects page was left and opened again, the checkboxes of the states view columns had no effect while "Auto" was off, the buttons column could not be resized, and switching "Auto" off left the table with nothing but the ID column after a reload: https://github.com/ioBroker/ioBroker.admin/issues/3616
- (@GermanBluefox) Fixed: an adapter could be updated, although a dependency was not fulfilled. The update dialog showed the dependency in red, but the check behind the button did not know `globalDependencies`, where an adapter declares which admin version it needs. Both now come from the same place, which also covers the other hosts of a multihost setup: https://github.com/ioBroker/ioBroker.admin/issues/3614
- (@GermanBluefox) Intro was redesigned

## License

The MIT License (MIT)

Copyright (c) 2014-2026 bluefox <dogafox@gmail.com>
