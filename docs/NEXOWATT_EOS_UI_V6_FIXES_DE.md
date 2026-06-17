# NexoWatt EOS UI v6 Fixes

Diese Version korrigiert die gemeldeten Punkte aus dem Testlauf:

- Die Login-Seite zeigt keinen Abmelden-Button mehr.
- Login, Drawer, Topbar, Manifest, Favicon und Adapter-Icon verwenden wieder das originale NexoWatt/EOS Logo.
- Das Login-Branding lautet sichtbar `NexoWatt EOS` und `Energy Operation System`.
- Der zusätzliche Logout-Button wird nur im angemeldeten Admin-Shell angezeigt.
- Der Logout-Fallback nutzt die Backend-Route `/logout` ohne kodierten Hash-/Origin-Parameter, damit nach erneutem Login keine 404-Weiterleitung entsteht.
- Login-Weiterleitungen auf `/logout` oder `/login` werden zur Laufzeit bereinigt, um 404-/Redirect-Loops nach der Anmeldung zu vermeiden.
- Die Asset-Prüfung für `adminWww/index.html`, `manifest.json`, Branding-CSS/JS und dynamische Assets wurde durchgeführt.

Die technische Admin-Basis bleibt upstream-nah. Das Branding liegt weiterhin überwiegend in `adminWww/css/eos-branding.css` und `adminWww/js/eos-branding.js`.
