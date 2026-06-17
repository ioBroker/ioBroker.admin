# NexoWatt EOS UI v12 – Header-Logo und Navigationsleiste

Diese Version basiert auf dem guten v11 Layout mit vollem Header, waagerechter Navigation und großem Inhaltsbereich.

## Änderungen

- Der doppelte NexoWatt/EOS Bereich in der unteren Navigationsleiste wurde entfernt.
- In der unteren Navigationsleiste bleibt links nur noch der Einklapp-Pfeil erhalten.
- Das echte NexoWatt Logo im oberen Header ist größer, kontrastreicher und besser sichtbar.
- Die Login-Zentrierung, die EOS Modul-Kacheln, das lesbare Drei-Punkte-Info-Overlay und die 404-sichere Asset-Struktur aus v11 bleiben erhalten.

## Technischer Ansatz

Die upstream React/Vite Bundles bleiben weiterhin unverändert. Das Design wird über `adminWww/css/eos-branding.css` und `adminWww/js/eos-branding.js` angewendet.

Cache-Busting: `v=12`.
