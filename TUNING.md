# Tuning the admin for a vendor

A vendor can hide parts of the admin and replace its branding without touching the code. Everything
is read from `system.config.native.vendor`, and the admin applies it right after the start.

The type behind it is `AdminGuiConfig` in `src-admin/src/types.d.ts`.

## Where the settings live

```json5
// system.config
{
    native: {
        vendor: {
            admin: {
                menu: {},
                appBar: {},
                settings: {},
                adapters: {},
                login: {},
            },
            ico: '',
            icon: '',
            uuidPrefix: '',
        },
    },
}
```

Only `false` hides something. A missing entry means "show it", and so does `true`.

### Per user

After the login the admin reads `system.user.<name>.native.vendor` and lays it over the system
configuration. A support account can therefore see more than the end customer without the system
configuration being changed.

It is a flat `Object.assign`, so an `admin` key in the user object replaces the **whole** `admin`
block of the system configuration instead of merging single entries into it. Repeat everything that
should stay in effect for that user.

## Left menu — `vendor.admin.menu`

Every entry of the navigation is addressed by the name of its tab. The check is generic, so a tab of
an adapter works the same way as a built-in one.

| Key                   | Hides                                             |
|-----------------------|---------------------------------------------------|
| `tab-intro`           | Quick access                                      |
| `tab-info`            | Overview                                          |
| `tab-adapters`        | Adapters                                          |
| `tab-instances`       | Instances                                         |
| `tab-objects`         | Objects                                           |
| `tab-enums`           | Categories                                        |
| `tab-devices`         | Devices                                           |
| `tab-logs`            | Logs                                              |
| `tab-scenes`          | Scenes                                            |
| `tab-events`          | Events                                            |
| `tab-users`           | Users                                             |
| `tab-hosts`           | Hosts                                             |
| `tab-files`           | Files                                             |
| `tab-javascript`      | Scripts                                           |
| `tab-echarts`         | Charts                                            |
| `tab-devicemanager`   | Device manager                                    |
| `tab-text2command-0`  | the tab of an adapter, here `text2command.0`      |
| `editable`            | the pencil that lets the user rearrange the menu  |

```json5
"menu": {
    "tab-hosts": false,
    "tab-files": false,
    "editable": false
}
```

## App bar — `vendor.admin.appBar`

| Key               | Hides                       |
|-------------------|-----------------------------|
| `discovery`       | the discovery button        |
| `systemSettings`  | the system settings button  |
| `toggleTheme`     | the theme switch            |
| `expertMode`      | the expert mode switch      |
| `hostSelector`    | the host selector           |

## System settings — `vendor.admin.settings`

Whole tabs of the dialog:

| Key                | Hides          |
|--------------------|----------------|
| `tabConfig`        | Main settings  |
| `tabRepositories`  | Repositories   |
| `tabCertificates`  | Certificates   |
| `tabCredentials`   | Credentials    |
| `tabLetsEncrypt`   | Let's Encrypt  |
| `tabDefaultACL`    | Default ACL    |
| `tabStatistics`    | Statistics     |
| `tabLicenses`      | Licenses       |

Single fields of the main settings tab, addressed by their id:

`language`, `tempUnit`, `currency`, `dateFormat`, `isFloatComma`, `defaultHistory`, `activeRepo`,
`expertMode`, `defaultLogLevel`, `firstDayOfWeek`, `tipsDisabled`

```json5
"settings": {
    "tabRepositories": false,
    "tabStatistics": false,
    "activeRepo": false,
    "defaultLogLevel": false
}
```

## Adapters page — `vendor.admin.adapters`

| Key                   | Hides                                                                            |
|-----------------------|----------------------------------------------------------------------------------|
| `gitHubInstall`       | the button that opens the installation from npm, GitHub, a custom URL or a file  |
| `statistics`          | the numbers in the upper right corner                                            |
| `filterUpdates`       | the filter for adapters with an update                                           |
| `allowAdapterRating`  | the ratings: they are neither shown nor loaded                                   |

`gitHubInstall` covers all four ways of installing at once, because they live behind one button.
The button is shown in expert mode only anyway.

## Login page — `vendor.admin.login`

| Key      | Replaces                                                          |
|----------|-------------------------------------------------------------------|
| `title`  | the title above the login form                                    |
| `motto`  | the motto below it (the instance setting `loginMotto` otherwise)  |
| `link`   | the target the logo links to                                      |

## Branding — top level of `vendor`

| Key           | Effect                                                                                  |
|---------------|-----------------------------------------------------------------------------------------|
| `ico`         | favicon as a data URL; the admin serves it instead of its own                           |
| `icon`        | the logo in the upper left corner and on the login screen                               |
| `uuidPrefix`  | fills `window.vendorPrefix`; without it, the first two characters of the UUID are used  |

`vendorPrefix` also selects the vendor-specific loader. Note the side effect: if it is set, the theme switch is disabled regardless of `appBar.toggleTheme`.

## Complete example

```json5
// system.config -> native.vendor
{
    admin: {
        menu: {
            'tab-hosts': false,
            'tab-files': false,
            'tab-javascript': false,
            editable: false,
        },
        appBar: {
            discovery: false,
            expertMode: false,
        },
        settings: {
            tabRepositories: false,
            tabLetsEncrypt: false,
            tabStatistics: false,
            activeRepo: false,
        },
        adapters: {
            gitHubInstall: false,
            statistics: false,
            allowAdapterRating: false,
        },
        login: {
            title: 'My Smart Home',
            motto: '',
            link: 'https://example.com',
        },
    },
    ico: 'data:image/x-icon;base64,…',
    icon: 'data:image/svg+xml;base64,…',
    uuidPrefix: 'MV',
}
```

## Two keys without an effect

`logo` and `javascriptPassword` are part of `AdminGuiConfig` but nothing reads them. The logo in the
upper left corner comes from `icon`. They are kept for compatibility; do not expect them to do
anything.
