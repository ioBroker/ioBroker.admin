## How to install from Github

```
npm install <GitHub URL>
cd node_modules/iobroker.admin
npm install
gulp
iobroker upload admin
```

## How to show help information in configuration dialog

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
