# NexoWatt EOS UI v17

Basis: v16 Layoutstand.

## Änderungen

- Header-Logo links optisch neu abgestimmt:
  - eigenes optimiertes Header-Logo `nexowatt-header-192.png`
  - Logo sitzt mittig im ovalen Header-Badge
  - dunkler Logo-Hintergrund bleibt als Schein erhalten
  - kein Mehrfach-/Geisterschein mehr
- Horizontaler Navigationsbereich:
  - der Einklapp-Pfeil hat einen festen eigenen Slot
  - alte Drawer-Header-Inhalte werden dort ausgeblendet
  - native `Abmelden`-Navigationseinträge werden aus der EOS-Navigation entfernt, damit keine Überlappung mehr entsteht
- Benutzername im Header bleibt hell lesbar.
- Authentifizierung / automatische Abmeldung:
  - keine eigene Token-Löschung mehr im EOS-Overlay
  - kein eigener Logout-Button mehr
  - Session-Ablauf und automatische Abmeldung laufen über die originale Admin-Logik.

## Technischer Hinweis

Das EOS-Overlay greift nur in Branding/Layout ein. Die native Session-Überwachung bleibt in `src-admin/src/App.tsx` und die Token-Erneuerung bleibt in `src-admin/src/login/Login.tsx`.
