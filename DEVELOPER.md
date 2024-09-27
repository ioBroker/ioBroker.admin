# Development

## Getting started

If you want to contribute to the Admin adapter, follow these steps:

Install all packages all in one via

```bash
npm run install-monorepo
```

or step-by-step

```bash
npm i -f
npm i -w packages/dm-gui-components -f
npm i -f -w packages/jsonConfig
npm i -w packages/admin -f
```

Build the project

```bash
npm run build
```

Ensure you have a running admin instance on your host on port `8081`, then run

```bash
npm run start
```

You now have the admin UI running on port `3000` with hot code reload from your local project.

### Guidelines

The packages in the workspace folder (`packages`) should not contain any `devDependencies`, all `devDependencies` should be added to the root `package.json`.
There is one exception to this rule: defining dependencies between workspace packages should be done via defining them as development dependency to ensure `lerna` is respecting the build order.

## How to install from GitHub

```bash
npm install <GitHub URL>
cd node_modules/iobroker.admin
npm install
npm run build
iobroker upload admin
```

## How to Implement OAuth Authentication flow

Since Admin 6.2.14, there is a convenience support for OAuth authentication flows that send the user to the authorization server and then redirect the user back to complete the process.

### Short explanation: OAuth2.0 Authentication flow

There is a possibility to use OAuth2.0 authentication for other services. Admin has an endpoint `oauth2_callbacks`.

The calls like `http(s)://ip:port/oauth2_callbacks/adapterName.X/?state=ABC&code=123&param=true&param2` will be processed and the special message `oauth2Callback` will be sent to `adapterName.X` instance with query parameters `{"state": "ABC", "code": 123, "param": true, "param2": true}`.

As mandatory response the admin expects the object like: `{"result": "Show this text to user by success", "error": "ERROR: Result will be ignored"}`. The result or error will be shown to the user. Please send already translated messages.

### Long explanation: Sending user to the Authorization server

In JSON-Config, you can use the sendTo component to send a message to your adapter which then as response return a URL. The component can then open this URL automatically in a new tab/window.

**This only works if the URL for redirecting back after the authentication does not need to be specified hardcoded in the configuration of the client!**

```json
"_authenticate": {
    "newLine": true,
    "variant": "contained",
    "color": "primary",
    "disabled": "!_alive",
    "type": "sendTo",
    "error": {
        "connect timeout": "Connection timeout"
    },
    "icon": "auth",
    "command": "getOAuthStartLink",
    "jsonData": "{\"redirect_uri_base\": \"${data._origin}\", ...}",
    "label": "Authenticate with XXX",
    "openUrl": true,
    "window": "Login with XXX"
}
```

Important is that you also send `data.\_origin` to your adapter and use this to construct the "redirect back url". This URL will point to the current admin page to a magic URL (the more info below)

When providing "openUrl" property in the configuration Admin then expects a property "openUrl" in the response object from the message which is used as URL for the new window.
In your adapter code, you can build the redirect URL as required and return it as a response like this:

```javascript
const redirect_uri = `${args.redirect_uri_base}oauth2_callbacks/${adapter.namespace}/`; // Add the magic route in Admin
const redirectUrl = `https://...?...&redirect_url=${encodeURIComponent(redirect_uri)}`; // Now use this to construct the link to the partner
obj.callback && adapter.sendTo(obj.from, obj.command, { openUrl: redirectUrl }, obj.callback); // send response
```

Usually you also construct a state parameter as a unique ID, and so it is a good option to store the relevant data using the state string like cope configuration or such because it will normally not be returned.

As soon as the authentication is done, the user is redirected to the given Redirect URL the magic admin route `/oauth2_callbacks/<adapter namespace>/` is opened in the browser. This will send a message with the defined name `oauth2Callback` to the provided adapter instance.
The message contains the Query-parameters provided in the request as an object.

Parameters like `?state=ABC&code=DEF` would be received in the message as

```json
{
    "state": "ABC",
    "code": "DEF"
}
```

With this information, you can easily exchange the code for an access token and so on and complete the authentication process.

You need to return a response to the `oauth2Callback` message to allow Admin to show a proper page to the user.

```javascript
if (error) {
    obj.callback &&
        adapter.sendTo(
            obj.from,
            obj.command,
            { error: `Authentiction error: ${error}. Please try again.` },
            obj.callback,
        );
} else {
    obj.callback &&
        adapter.sendTo(
            obj.from,
            obj.command,
            { result: 'Tokens updated successfully. Please reload configuration.' },
            obj.callback,
        );
}
```

## Dynamic Interface in Notifications

Starting from [js-controller v5.x](https://github.com/ioBroker/ioBroker.js-controller/blob/master/README.md#notification-system), developers can send system notifications that are visible in the admin interface.

In js-controller v7.x, this feature has been extended to allow adapters to send not only static information but also dynamic GUIs using the [JSON-Config schema](packages/jsonConfig/SCHEMA.md).

### Generating Notifications

To display a dynamic GUI (with tables, buttons, colored texts, etc.), developers should generate notifications in the following form:

```js
await adapter.registerNotification(
    'adapterName',
    'notificationScope', // defined in io-package.json => notifications
    I18n.translate('New dynamic notification: %s', new Date().toLocaleString()),
    {
        // contextData indicates that your adapter supports dynamic GUI
        contextData: {
            offlineMessage: I18n.getTranslatedObject('Instance is offline'),
            specificUserData,
        },
    },
);
```

The structure of `contextData` is adapter-specific.
The only attribute that the admin can understand from the context data is `offlineMessage`. This message will be shown in the notification dialog if the instance is not alive.

Developers should store the information in the context required for generating the GUI.

**Do not store more than 1k of information in the context, as it will be stored in the state.**

If you need to store a large amount of data for a notification, please store it elsewhere else (RAM, Objects DB, File-system) under some ID and just send the ID in the context.

### Displaying the Dynamic GUI

When the user opens the notification in the admin interface, the admin sends a message `admin:getNotificationSchema` to the instance with the provided context in `obj.message` (excluding the `offlineMessage` attribute).

Depending on the notification context or other internal status in the instance, developers should provide the JSON-Config schema as a response:

```js
let acknowledged = '';
async function processMessage(obj) {
    if (obj.command === 'admin:getNotificationSchema') {
        const schema = {
            type: 'panel',
            items: {
                _info: {
                    type: 'header',
                    size: 5,
                    text: I18n.getTranslatedObject(
                        'Dynamic notification %s',
                        // generate some dynamic content
                        acknowledged ? new Date(acknoledged).toLocaleString() : Math.round(Math.random() * 100),
                    ),
                    style: { color: 'green' },
                    sm: 12,
                },
            },
        };
        // If notification is already acknowledged, do not show the button
        if (!acknowledged) {
            schema.items._answer = {
                type: 'text',
                label: I18n.getTranslatedObject('Answer'),
                sm: 4,
            };
            schema.items._btn_1 = {
                type: 'sendto',
                command: 'adapterName:ack',
                jsonData: '{ "answer": "${data._answer}" }',
                label: I18n.getTranslatedObject('Acknowledge'),
                sm: 4,
                variant: 'contained',
                controlStyle: {
                    width: 30,
                    minWidth: 30,
                },
            };
        }

        adapter.sendTo(obj.from, obj.command, { schema }, obj.callback);
    } else if (obj.command === 'adapterName:ack') {
        // this is adapter specific message from GUI
        acknoledged = new Date().toISOString();
        adapter.log.info(`User answered "${obj.message.answer}"`);
        adapter.sendTo(
            obj.from,
            obj.command,
            {
                command: {
                    command: 'message',
                    message: I18n.getTranslatedObject('Saved'),
                    refresh: true,
                },
            },
            obj.callback,
        );
    }
}
```

The number and content of the buttons (and whether they should be buttons) can be generated dynamically. See the `ioBroker.ping` adapter as an example.

The entire GUI can be generated using only two JSON-Config components:

-   `staticText` - to display information with the desired style. You can use multiple instances to show different parts of the text in different styles.
-   `sendto` - to interact with the backend.

Use the prefix `_` for attribute names of a component; otherwise, the admin will try to save the information (untested behavior).

For backend translations, use the new [adapter-core@3.2.0](https://github.com/ioBroker/adapter-core?tab=readme-ov-file#i18n) feature.

Import the `I18n` like this:

```js
import { I18n } from '@iobroker/adapter-core';
```

## How to show help information in configuration dialog (Material-UI)

**This information is deprecated: use [JSON-Config](packages/jsonConfig/SCHEMA.md) or full ReactJS to create a configuration panel for your adapter**

The help can be a combination of tooltip, link and text.

```html
<script>
    systemDictionary = {
        "info_param1": {"en": "Info", "de": "Info", "ru": "Инфо"} // optional show text
        "tooltip_param1": {"en": "Info", "de": "Info", "ru": "Инфо"} // optional show tooltip
    }
</script>
<table>
    <tr>
        <td>
            <label
                class="translate"
                for="param1"
                >Param1:</label
            >
        </td>
        <td>
            <input
                class="value"
                id="param1"
            />
        </td>
        <td class="admin-tooltip"></td>
    </tr>
</table>
```

ID will be found automatically in the previous td.

```html
<table>
    <tr>
        <td>
            <label
                class="translate"
                for="param1"
                >Param1:</label
            >
        </td>
        <td>
            <input
                class="value"
                id="param1"
            />
        </td>
        <td></td>
        <td
            class="admin-tooltip"
            data-id="param1"
        ></td>
    </tr>
</table>
```

id set with data-id.

```html
<table>
    <tr>
        <td>
            <label
                class="translate"
                for="param1"
                >Param1:</label
            >
        </td>
        <td>
            <input
                class="value"
                id="param1"
            />
        </td>
        <td
            class="admin-tooltip"
            data-link="true"
        ></td>
    </tr>
</table>
```

The link will be generated automatically from `common.readme` and `#param1`.
e.g., if

`common.readme = https://github.com/ioBroker/ioBroker.admin/blob/master/README.md`

link will be https://github.com/ioBroker/ioBroker.admin/blob/master/README.md#param1`

```html
<table>
    <tr>
        <td>
            <label
                class="translate"
                for="param1"
                >Param1:</label
            >
        </td>
        <td>
            <input
                class="value"
                id="param1"
            />
        </td>
        <td
            class="admin-tooltip"
            data-link="my-param-description"
        ></td>
    </tr>
</table>
```

link will be `https://github.com/ioBroker/ioBroker.admin/blob/master/README.md#my-param-description`

```html
<table>
    <tr>
        <td>
            <label
                class="translate"
                for="param1"
                >Param1:</label
            >
        </td>
        <td>
            <input
                class="value"
                id="param1"
            />
        </td>
        <td
            class="admin-tooltip"
            data-link="https://github.com/ioBroker/ioBroker.admin/blob/master/README.md#my-param-description"
        ></td>
    </tr>
</table>
```

link will taken from data-link.
