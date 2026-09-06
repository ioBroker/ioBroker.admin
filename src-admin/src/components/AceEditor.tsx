/**
 * The one place where `react-ace` is imported and the modes and themes are registered.
 *
 * `@iobroker/json-config` does not bring the editor any more: it would carry the whole `ace-builds`
 * into every bundle that uses the library, the custom components of all adapters included. The admin
 * has ace anyway, so it hands the component in with the property `AceEditor` of `JsonConfig` and
 * `JsonConfigComponent`. Everything the library asks for has to be registered here: the modes
 * `json`, `json5` and `yaml`, and the themes `clouds_midnight` and `chrome`.
 */
import AceEditor from 'react-ace';

import 'ace-builds/src-min-noconflict/mode-json';
import 'ace-builds/src-min-noconflict/mode-json5';
import 'ace-builds/src-min-noconflict/mode-yaml';
import 'ace-builds/src-min-noconflict/mode-xml';
import 'ace-builds/src-min-noconflict/mode-html';
// The `worker-*` files are web worker scripts: they bail out immediately when loaded in a window
// (`if (typeof e.window != 'undefined' && e.document) return;`), so importing them here never did
// anything. As ES modules `this` is `undefined` instead of the global, which made them throw
// "Cannot read properties of undefined (reading 'window')" and blocked the whole app from starting.
// Ace loads its workers over `ace.config.setModuleUrl()` when they are actually wanted.
import 'ace-builds/src-min-noconflict/theme-clouds_midnight';
import 'ace-builds/src-min-noconflict/theme-chrome';
import 'ace-builds/src-min-noconflict/ext-language_tools';

export default AceEditor;
