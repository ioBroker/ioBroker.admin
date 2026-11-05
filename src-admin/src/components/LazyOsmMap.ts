/**
 * The map for `@iobroker/json-config`, loaded only when a `coordinates` item really shows one.
 *
 * Hand this one to `JsonConfig` / `JsonConfigComponent` as `OsmMap`, never `./OsmMap` directly: the library
 * renders it inside `Suspense`, and only a lazy component keeps the map out of the bundle of the dialogs.
 */
import { lazy } from 'react';

export default lazy(() => import('./OsmMap'));
