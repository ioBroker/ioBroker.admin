## Development
If you want to contribute to the Admin adapter, follow these steps:

Install all packages

```bash
npm i -f
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

## How to install from GitHub

```
npm install <GitHub URL>
cd node_modules/iobroker.admin
npm install
npm run build
iobroker upload admin
```

## How to Implement OAuth Authentication flow

Since Admin 6.2.14, there is a convenience support for OAuth authentication flows that send the user to the authorization server and then redirect the user back to complete the process.

### Sending user to the Authorization server
In JSON-Config you can use the sendTo component to send a message to your adapter which then as response return a URL. The component can then open this URL automatically in a new tab/window.

**This only works if the URL for redirecting back after the authentication do not need to be specified hardcoded in the configurationnof the client!** 

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

Important is that you also send "data._origin" to your adapter and use this to construct the "redirect back url". This URL will point to the current admin page to a magic URL (more infos below)

When providing "openUrl" property in the configuration Admin then expects a property "openUrl" in the response object from the message which is used as URL for the new window.
In your adapter code you so can build the redirect URL as required and return it as response like this:

```javascript
const redirect_uri = `${args.redirect_uri_base}oauth2_callbacks/${adapter.namespace}/`; // Add the magic route in Admin
const redirectUrl = `https://...?...&redirect_url=${encodeURIComponent(redirect_uri)}`// Now use this to construct the link to the partner
obj.callback && adapter.sendTo(obj.from, obj.command, {openUrl: redirectUrl}, obj.callback); // send response
```

Usually you also construct a state parameter as unique ID and so it is a good option to store the relevant data using the state string like cope configuration or such because it will normally not being returned.

As soon as the authentication is done the user is redirected to the given Redirect URL the magic admin route /oauth2_callbacks/<adapter namespace>/ is opened in the browser. This will send a message with the defined name "oauth2Callback" to the provided adapter instance.
The message contains the Query-parameters provided in the request as object.

Parameters like "?state=ABC&code=DEF" would be received in the message as

```json
{
    "state":"ABC",
    "code":"DEF"
}
```

With these information you can easily exchange the code for an access token and so on and complete the authentication process.

You need to return a response to the "oauth2Callback" message to allow Admin to show a proper page to the user.

```javascript
if (error) {
    obj.callback && adapter.sendTo(obj.from, obj.command, {error: `Authentiction error: ${error}. Please try again.`}, obj.callback);
} else {
    obj.callback && adapter.sendTo(obj.from, obj.command, {result: 'Tokens updated successfully. Please reload configuration.'}, obj.callback);
}
```

## How to show help information in configuration dialog (Material-UI)

Help can be a combination of tooltip, link and text.

```
<script>
systemDictionary = {
    "info_param1": {"en": "Info", "de": "Info", "ru": "Инфо"} // optional show text
    "tooltip_param1": {"en": "Info", "de": "Info", "ru": "Инфо"} // optional show tooltip
}
</script>
<table>
<tr><td><label class="translate" for="param1">Param1:</label></td><td><input class="value" id="param1" /></td><td class="admin-tooltip"></td></tr>
</table>
```

id will be found automatically in the previous td.

```
<table>
<tr><td><label class="translate" for="param1">Param1:</label></td><td><input class="value" id="param1" /></td><td></td><td class="admin-tooltip" data-id="param1"></td></tr>
</table>
```

id set with data-id.

```
<table>
<tr><td><label class="translate" for="param1">Param1:</label></td><td><input class="value" id="param1" /></td><td class="admin-tooltip" data-link="true"></td></tr>
</table>
```

Link will be generated automatically from common.readme and '#param1'.
e.g. if

```common.readme = https://github.com/ioBroker/ioBroker.admin/blob/master/README.md```

link will be ```https://github.com/ioBroker/ioBroker.admin/blob/master/README.md#param1```


```
<table>
<tr><td><label class="translate" for="param1">Param1:</label></td><td><input class="value" id="param1" /></td><td class="admin-tooltip" data-link="my-param-description"></td></tr>
</table>
```
link will be ```https://github.com/ioBroker/ioBroker.admin/blob/master/README.md#my-param-description```

```
<table>
<tr><td><label class="translate" for="param1">Param1:</label></td><td><input class="value" id="param1" /></td><td class="admin-tooltip" data-link="https://github.com/ioBroker/ioBroker.admin/blob/master/README.md#my-param-description"></td></tr>
</table>
```
link will taken from data-link.
