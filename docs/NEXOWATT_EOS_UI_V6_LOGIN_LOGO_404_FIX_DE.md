# NexoWatt EOS UI v6

Änderungen:

- Login-Maske zeigt keinen zusätzlichen Abmelden-Button mehr.
- Das alte grüne NexoWatt Logo wird überall verwendet: Login, Drawer, Topbar, Favicon-/Manifest-nahe Admin-Assets und Fallback-Icons.
- `Energy Management System` bleibt entfernt; Login nutzt `NexoWatt EOS` und `Energy Operation System`.
- Login-Weiterleitung wurde abgesichert, damit nach erfolgreicher Anmeldung nicht auf eine Route weitergeleitet wird, die einen 404 erzeugen kann.
- Das Branding bleibt weiterhin als Overlay umgesetzt, damit die Upstream-Admin-Struktur möglichst updatefähig bleibt.
