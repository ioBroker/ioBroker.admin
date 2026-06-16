# NexoWatt EOS Admin UI v5

EOS steht für **Energy Operation System**.

## Fokus dieser Version

- Login-Maske: sichtbarer Titel **NexoWatt EOS**, Untertitel **Energy Operation System**.
- Obere Leiste: responsive, kompakter und mit sichtbarem Abmelden-Button rechts oben.
- Linke Navigation: nutzt die originale Header-Zone für NexoWatt EOS und kann vertikal scrollen, wenn später mehr Module dazukommen.
- Modul-/Adapterseite: abgerundete Kacheln und neutraler EOS-Header statt blauer Balken.
- Performance: Das Branding läuft nicht mehr als permanenter Voll-DOM-Scan. Der Observer reagiert nur auf neue Nodes/Textänderungen und patcht gezielt.

## Technische Leitlinie

Die React/Vite-Bundles bleiben bewusst unangetastet. Dadurch bleibt der Adapter updatefreundlicher. Das EOS-Design liegt in:

- `adminWww/css/eos-branding.css`
- `adminWww/js/eos-branding.js`
- `src-admin/public/css/eos-branding.css`
- `src-admin/public/js/eos-branding.js`

## Nach Updates

Wenn ein upstream Admin-Update die gebauten Dateien überschreibt, muss das EOS-Overlay erneut eingebunden bzw. neu gebaut werden.
