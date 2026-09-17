# Information for developers

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
