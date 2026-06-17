# NexoWatt EOS UI v8

Diese Version basiert wieder auf dem als gut bewerteten v5-Design.

Gezielte Änderungen gegenüber v5:

- altes NexoWatt-Logo für EOS/Login/Branding statt Kompass-/Sonnen-Icon
- kein Abmelden-Button auf der Anmeldeseite
- keine NexoWatt-Logos mehr als Platzhalter auf Instanz-/Modulzeilen
- neutraler Modul-Platzhalter für fehlende Icons
- Login-Redirect-Bereinigung gegen Logout/Login-404-Schleifen
- Cache-Busting für `eos-branding.css` und `eos-branding.js`

Bewusst nicht geändert:

- v5 App-Shell-/Sidebar-/Topbar-/Kachel-Design bleibt erhalten
- React/Vite-Bundles bleiben unverändert
- technische interne ioBroker-IDs bleiben für Kompatibilität erhalten
