# NexoWatt EOS UI Refined v4

Diese Version verfeinert nur Frontend und Anmeldemaske im EOS Design. EOS bedeutet **Energy Operation System**.

## Änderungen

- Login-Titel: **NexoWatt EOS** mit Untertitel **Energy Operation System**.
- Entfernt sichtbares "Energy Management System" aus der Login-Oberfläche.
- Obere Leiste als schwebende EOS-Leiste mit direkter Abmeldung rechts.
- Linke Navigation optisch als EOS-Navigation mit stärkerem Branding.
- Adapter-/Modulseite mit abgerundeten Kacheln und weniger blauem Standard-Look.
- Benutzerbereich mit Hinweisleiste "Zugänge & Rechte".
- Rechtegruppen-Dialog mit visuellen Schnellprofilen: Nur lesen, Bedienung, Service, Vollzugriff.

## Technischer Hinweis

Die React/Vite-Bundles bleiben unverändert. Das Design läuft bewusst über `adminWww/css/eos-branding.css` und `adminWww/js/eos-branding.js`, damit die Admin-Funktionalität stabil bleibt und Updates leichter übernommen werden können.
