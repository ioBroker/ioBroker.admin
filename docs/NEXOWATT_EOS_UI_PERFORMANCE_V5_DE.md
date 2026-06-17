# NexoWatt EOS UI v5

Diese Version bleibt auf der bestehenden Admin-Adapter-Struktur und verändert nur das Frontend-/Login-Branding über ein kleines Overlay.

## Schwerpunkte v5

- Login-Titel bereinigt: `NexoWatt EOS`, Unterzeile `Energy Operation System`.
- Doppelte/unsaubere Login-Pseudo-Texte entfernt.
- Linke Navigation als scrollbarer EOS-Bereich vorbereitet, damit zusätzliche Einträge später sauber per Slider/Scrollbar erreichbar bleiben.
- NexoWatt/EOS-Kopfbereich im Drawer zusammengeführt; die alte doppelte Logozeile wird ausgeblendet.
- Logout-Button wird fest sichtbar oben rechts platziert und liegt nicht mehr außerhalb des sichtbaren Bereichs.
- Topbar und Navigation wurden responsiver ausgelegt.
- Adapter-/Modul-Kacheln wurden weiter abgerundet und die alten blauen Kopfbereiche werden durch dunklere EOS-Flächen ersetzt.
- Performance-Härtung: kein permanenter 1,5-Sekunden-Full-Scan mehr, kein Beobachten der häufig wechselnden `class`-Attribute, weniger globale Blur-/Shadow-Effekte.

## Technischer Ansatz

Die React/Vite-Bundles bleiben unangetastet. Das Branding läuft über:

- `adminWww/css/eos-branding.css`
- `adminWww/js/eos-branding.js`
- `src-admin/public/css/eos-branding.css`
- `src-admin/public/js/eos-branding.js`

Damit bleibt der Adapter updatefreundlicher, weil Upstream-Dateien nicht unnötig hart gepatcht werden.
