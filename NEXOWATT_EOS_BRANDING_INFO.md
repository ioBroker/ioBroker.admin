# NexoWatt EOS Branding Build

Diese Repo-ZIP basiert auf der alten `ioBroker.eos.admin-master.zip` und enthält alle ursprünglichen Quelldateien plus die für eine direkte GitHub-/URL-Installation notwendigen Build-Ordner `build/` und `adminWww/`.

Geändert wurde nur das sichtbare Frontend-/Login-Branding über EOS Overlay-Dateien:

- `adminWww/css/eos-branding.css`
- `adminWww/js/eos-branding.js`
- `src-admin/public/css/eos-branding.css`
- `src-admin/public/js/eos-branding.js`
- EOS Icons unter `admin/img/eos/`, `adminWww/img/eos/` und `src-admin/public/img/eos/`

Wichtig für Git: Die Ordner `build/`, `adminWww/` und `admin/custom/` müssen mit ins Repository, sonst entsteht wieder ein schwarzes Bild durch fehlende Assets.


## v5 UI/performance refined

Siehe `docs/NEXOWATT_EOS_UI_REFINED_V5_DE.md`.
