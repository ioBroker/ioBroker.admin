# NexoWatt EOS UI v7 – Restore v5 Design, Logo Scope Fix

Diese Version basiert bewusst wieder auf dem v5-Designstand. Die v6-Änderungen an Drawer/AdapterTile wurden nicht übernommen, damit das vorherige Kachel-/Cockpit-Design erhalten bleibt.

## Korrekturen

- Das markierte EOS-Symbol wurde durch das alte NexoWatt-Logo ersetzt.
- `admin.svg`-Kopien wurden ebenfalls auf das alte NexoWatt-Logo gesetzt.
- Das NexoWatt-Logo wird nur in echten Branding-Bereichen gesetzt: Login, Drawer/Header, EOS-Branding.
- Adapter-/Dienst-/Instanzzeilen werden nicht mehr mit dem NexoWatt-Logo überschrieben.
- `no-image.svg` ist wieder ein neutrales Modul-Platzhalter-Icon, damit fehlende Adapterbilder nicht als NexoWatt-Branding erscheinen.
- Der Abmelden-Button wird auf der Anmeldemaske entfernt und zusätzlich per CSS ausgeblendet.
- Login-Redirects auf `login` oder `logout` werden bereinigt, um 404-Schleifen nach der Anmeldung zu vermeiden.
- Die technische OAuth-Client-ID im Source-Code ist wieder upstream-nah gesetzt.

## Wichtig

Die React/Vite-Runtime-Bundles bleiben unverändert. Das Branding wird über `adminWww/css/eos-branding.css` und `adminWww/js/eos-branding.js` aufgesetzt.
