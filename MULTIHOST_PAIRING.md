# Konzept: neuen Host finden und im Admin anschließen

Szenario: Es läuft ein ioBroker. Der Anwender schreibt ein frisches Image auf eine SD-Karte und
startet damit einen Raspberry Pi. Der **bestehende** js-controller soll den neuen finden, und der
Admin soll anbieten, ihn als weiteren Host anzuschließen.

Stand der Recherche: js-controller 7.0.8-alpha, Admin 8.0.0.

---

## 1. Was heute schon da ist

Verifiziert im installierten js-controller (`build/esm/lib/multihostServer.js`,
`@iobroker/js-controller-cli/build/esm/lib/setup/setupMultihost.js`):

| Baustein | Fundort | Verhalten |
|---|---|---|
| Multihost-Server | `MHServer` | UDP **50005**, Multicast **239.255.255.250** |
| Aktivierung | `iobroker.json` → `multihostService.enabled` | Standard: `false` |
| Absicherung | `multihostService.secure` + `password` | Standard: `secure: true` |
| CLI | `iobroker multihost enable\|disable\|browse\|connect\|status` | vollständig vorhanden |
| Admin-UI | `BaseSettingsMultihost.tsx` | nur **Master-Seite**: an/aus, sicher, Passwort |

**Protokollablauf** (aus `multihostServer.js`): Der Client schickt `{cmd: 'browse'}`. Ist `secure`
gesetzt, antwortet der Server mit `result: 'not authenticated'` und einem `salt`. Der Client
wiederholt mit `password = sha(secret, salt)`. Erst dann liefert der Server die Verbindungsdaten.
Offene Auth-Einträge verfallen nach **31 Sekunden**.

**Was beim Anschließen technisch passiert:** Der neue Host trägt in seine `iobroker.json` die
Adresse des Masters als `objects.host` / `states.host` ein (Ports 9001 bzw. 9000) und startet neu.
Auf Master-Seite sorgt `iobroker multihost enable` dafür, dass die lokale Datenbank nicht mehr nur
auf `127.0.0.1`, sondern auf allen Adressen lauscht.

---

## 2. Die Lücke

**Die Richtung stimmt nicht.** Heute sucht der **neue** Host den Master (`multihost browse`), der
Master antwortet nur. Ein frisch geflashter Pi hat aber:

- `multihostService.enabled = false` → er betreibt keinen Server
- keinen Client, der von selbst suchen würde
- eine eigene, lokale Datenbank und weiß nichts von einem Master

Er **annonciert nichts und fragt nichts**. Der Master kann ihn folglich nicht finden. Ohne eine
Erweiterung auf dem neuen Image ist das gewünschte Szenario nicht umsetzbar — das ist die
Kernaussage dieses Konzepts.

---

## 3. Wie der neue Host auffindbar wird

### Variante A — mDNS-Annonce auf dem neuen Image *(Empfehlung)*

Der frische Host annonciert `_iobroker._tcp` mit TXT-Records:

```
uuid=<installations-uuid>      role=unclaimed
version=<js-controller>        objects=jsonl
host=<hostname>                pairing=open|closed
```

Der Master (bzw. der Admin) durchsucht per `bonjour-service` und zeigt alle mit `role=unclaimed`.

*Dafür:* Standardprotokoll, fertige Bibliothek, ohne neue Ports, auch von anderen Werkzeugen
sichtbar, und der Anwender kann mit `avahi-browse -rt _iobroker._tcp` selbst nachsehen.
*Dagegen:* Multicast überlebt weder Docker-Bridge noch VLAN-Grenzen — siehe [MDNS.md](MDNS.md).

### Variante B — den vorhandenen 50005-Kanal umdrehen

Der Master sendet periodisch ein `{cmd: 'discover'}` an `239.255.255.250:50005`; nicht
angeschlossene Hosts antworten mit ihrer Kennung.

*Dafür:* Port, Multicast-Adresse und Nachrichtenformat existieren bereits; keine neue Abhängigkeit.
*Dagegen:* Der `MHServer` läuft heute nur bei `enabled = true`. Ein frischer Host müsste ihn in einem
eingeschränkten „nur antworten, nichts preisgeben"-Modus starten — das ist eine Protokoll- und
Zustandsänderung im js-controller.

### Variante C — manuelle Eingabe *(als Rückfallebene immer nötig)*

Der Anwender tippt die IP im Admin ein. Muss es geben: Multicast ist genau in den Umgebungen nicht
verfügbar, in denen ioBroker häufig läuft (Docker-Bridge, getrennte VLANs, WLAN mit
Multicast-Filter).

**Empfehlung: A als Komfortweg, C als garantierter Weg.** B nur, falls man ohnehin am
Multihost-Protokoll arbeitet.

---

## 4. Vertrauensmodell — die tragende Entscheidung

**Festgelegt: Das Heimnetz gilt als vertrauenswürdig.** Wer dort einen ioBroker-Host sieht, dem
gehört er auch. Fremde Controller im selben Netz werden nicht als Fall betrachtet.

Das ist eine bewusste Entscheidung und sie bestimmt fast alles Weitere. Was sie kostet, damit es
später nachlesbar bleibt:

- Jedes Gerät im LAN, das die Annonce nachahmt, kann sich als frischer Host ausgeben oder eine
  Einladung vortäuschen.
- `multihost enable` bindet die Datenbank an alle Adressen, und der eingebaute jsonl-Server kennt
  **keine Authentifizierung** — `auth_pass` findet sich nur im Redis-Client
  (`objectsInRedisClient.js`), die jsonl- und file-Pakete enthalten nichts dergleichen. Wer
  9000/9001 öffnet, gibt sie im LAN frei. Insofern setzt Multihost ein vertrauenswürdiges Netz
  ohnehin schon voraus — die Entscheidung hier fügt dem nichts Neues hinzu.

Damit entfallen: Kopplungs-Token, Einmal-Codes, Vorbereitung der SD-Karte, Bestätigung auf dem
Gerät. Abschnitt 4a beschreibt sie weiterhin — als Rüstzeug für Umgebungen, in denen die Annahme
nicht gilt (Firmennetz, WG, gemeinsam genutztes WLAN).

**Was trotzdem bleibt**, weil es nichts mit Angreifern zu tun hat:

**1. Nur wirklich frische Hosts anbieten.** Beim Anschließen verwirft der neue Host seine eigene
Datenbank und benutzt die des Masters. Bei einem frischen Image ist das folgenlos — bei einem
konfigurierten Host wäre es Datenverlust. Der Admin darf deshalb nur Hosts mit `role=unclaimed`
anbieten, und der Zielhost muss seinen Zustand **selbst** prüfen, bevor er umschaltet.

**2. Eindeutige Adressierung.** Flasht jemand zwei Karten gleichzeitig, stehen zwei frische Pis im
Netz. Die Einladung muss den gemeinten Host benennen (UUID oder MAC), und der Admin muss Hostname,
MAC und Seriennummer anzeigen, damit der Anwender den richtigen wählt. Das ist keine Sicherheits-,
sondern eine Verwechslungsfrage.

**3. Rückweg.** Ist der Master nach dem Neustart nicht erreichbar, steht der Pi ohne Datenbank da —
und ohne Bildschirm und SSH kommt niemand mehr heran. Sicherung der alten `iobroker.json` und
Rückfall nach N Fehlversuchen sind deshalb Pflicht, nicht Kür.

---

## 4a. Wenn das Netz *nicht* vertrauenswürdig ist

Nicht Teil des geplanten Wegs — hier gesammelt für den Fall, dass die Annahme aus Abschnitt 4 später
fällt. Erschwerend kommt dann hinzu, dass der Pi kopflos ist:

| geht nicht | warum |
|---|---|
| Admin des neuen Pi öffnen | keine Oberfläche erreichbar |
| `iobroker multihost connect` auf dem Pi | kein SSH |
| Code von der Konsole ablesen | kein Bildschirm |
| irgendeine Bestätigung **auf** dem Gerät | keine Eingabemöglichkeit |

Übrig bleibt genau ein physischer Kanal: **die SD-Karte selbst.** Wer sie beschreibt, hat das Gerät
in der Hand — das ist derselbe Besitznachweis, den Raspberry Pi OS für `ssh`, `userconf.txt` und die
WLAN-Zugangsdaten verwendet.

### Weg 1 — Einladung beim Flashen mitgeben *(Empfehlung für bewusste Einrichtung)*

Der Anwender legt vor dem ersten Start eine Datei auf die Boot-Partition (FAT32, an jedem PC
beschreibbar):

```json5
// iobroker-join.json
{
  "master": "192.168.1.10",
  "token": "…"
}
```

Der Controller liest sie beim ersten Start, verbindet sich und **löscht sie danach**. Kein Netzdialog
nötig, keine Zustimmung im Nachhinein, kein offenes Fenster. Den Token erzeugt der Admin des Masters
und zeigt ihn zum Abschreiben an.

Ohne `master`-Eintrag geht es auch: dann genügt der Token, und der Pi nimmt die per mDNS gefundene
Einladung an, die zu diesem Token passt. Das ist robuster, weil die IP des Masters beim Flashen oft
noch nicht feststeht.

*Dafür:* stärkster Nachweis, funktioniert ohne jede Interaktion nach dem Boot, auch ohne Netzwerkdialog.
*Dagegen:* der Anwender muss vor dem Flashen wissen, dass es das gibt.

### Weg 2 — Kopplungsfenster nach dem ersten Start *(Komfortweg)*

Der frische Pi annonciert `pairing=open` und nimmt für ein begrenztes Fenster — etwa 30 Minuten nach
dem ersten Boot — eine Einladung an. Der Anwender bestätigt im **Admin des Masters**, nicht auf dem
Pi.

Das ist Trust-on-first-use. Wer in diesem Fenster im selben Netz ist, kann den Pi übernehmen. Für ein
Heimnetz ist das dieselbe Annahme, unter der die meisten Smart-Home-Geräte koppeln — für ein Netz mit
fremden Teilnehmern ist es nicht tragbar.

Damit die Bestätigung im Admin überhaupt etwas wert ist, muss dort etwas Nachprüfbares stehen:
**Hostname, MAC-Adresse und Seriennummer** des Pi. Zwei frische Pis gleichzeitig im Netz sind sonst
nicht unterscheidbar.

### Weg 3 — Code nach dem Boot von der Karte lesen

Der Pi schreibt einen Einmal-Code auf die Boot-Partition. Technisch sauber, praktisch unbrauchbar:
dafür müsste man den Pi herunterfahren und die Karte wieder an den PC stecken.

### Empfehlung

**Weg 1 als der vorgesehene Weg**, Weg 2 als Bequemlichkeit mit deutlicher Warnung im Dialog und
konfigurierbarer Fensterdauer (auch abschaltbar für Umgebungen, in denen das nicht in Frage kommt).

Gemeinsam ist beiden: mDNS macht nur das Finden. Das Geheimnis geht nie im Klartext über das Netz —
für den Datenbank-Handshake gilt weiterhin die vorhandene Salt/SHA-Prüfung des Multihost-Protokolls.

---

## 4b. Schreibkanal auf 50005 — Anschließen und Ablehnen

Bisher ist 50005 rein lesend: der Client fragt `browse`, der Server antwortet. Es fehlt der Weg vom
Master **zum** neuen Host. Der wird für zwei Dinge gebraucht:

**Anschließen.** Die Controller-Nachricht `multihostConnect` (im `mdns`-Zweig vorhanden) läuft über
die States-Datenbank — an die der neue Host noch gar nicht angeschlossen ist. Der Admin des Masters
kann sie ihm also nicht zustellen. Ohne einen zweiten Kanal bleibt nur, den Admin **auf dem neuen
Pi** zu bedienen, und genau das geht kopflos nicht.

**Ablehnen.** Lehnt der Anwender einen gefundenen Host ab, soll dieser nicht bei jedem Durchlauf
wieder auftauchen. Die Entscheidung muss irgendwo hin.

Beides ist derselbe Bedarf: eine gerichtete Nachricht an einen Host, der noch nicht Teil des Systems
ist. Ein Schreibkanal auf 50005 löst beides auf einmal — Port, Multicast-Adresse und JSON-Format
sind schon da, nur die Richtung ist neu.

### Kommandos

| Kommando | Richtung | Wirkung auf dem Zielhost |
|---|---|---|
| `join` | Master → Host | Adresse und Passwort des Masters übernehmen, umschalten, neu starten |
| `decline` | Master → Host | Diesen Master dauerhaft ignorieren, ihm nichts mehr annoncieren |
| `identify` | Master → Host | markiert sich kurz im Log — um zwei frische Pis auseinanderzuhalten |

Der Master sendet gerichtet per Unicast an `<host-ip>:50005`; der Multicast wird nur zum Finden
gebraucht. Auf dem neuen Host muss dafür ein Empfänger laufen — entweder der `MHServer` in einem
eingeschränkten Modus oder der mDNS-Plugin selbst.

### Wie die Ablehnung gespeichert wird

**Auf dem Host, nicht (nur) auf dem Master**, sonst kennt eine Neuinstallation des Masters die
Entscheidung nicht mehr. Persistent in `iobroker-data`, damit sie einen Neustart übersteht.

**Pro Master, nicht global.** Gespeichert wird die UUID des ablehnenden Masters. Ein abgelehnter Pi
verschwindet damit nur aus *diesem* Admin und bleibt für einen zweiten Master sichtbar. Global
gedacht wäre der Pi sonst unsichtbar, ohne dass irgendjemand das rückgängig machen könnte.

**Nicht nach IP schlüsseln.** Der Anwender lehnt zwar „die IP" ab, aber IP-Adressen wandern per
DHCP. Nach einem Adresswechsel käme die Einladung entweder zurück, oder — schlimmer — ein ganz
anderes Gerät erbt die Ablehnung. Schlüssel ist die **Installations-UUID** des Hosts, die IP steht
nur zur Anzeige daneben.

### Rückgängig machen ist Pflicht

Ein kopfloser Pi, der einmal abgelehnt wurde, ist über das Netz nicht mehr erreichbar — kein
Bildschirm, kein SSH. Ohne Rückweg hilft nur Neuflashen. Deshalb:

- Der Admin führt eine sichtbare Liste **„Ignorierte Hosts"** mit einem Knopf zum Wiederanzeigen.
- Beim Wiederanzeigen schickt der Master ein `decline`-Widerruf an den Host — solange der noch
  erreichbar ist. Ist er das nicht, genügt es, dass der Master ihn wieder in die Liste aufnimmt und
  seine Einladungen erneut sendet; der Host hört sie weiterhin.

Daraus folgt: die Ablehnung darf auf dem Host **nicht** das Annoncieren abschalten, sondern nur das
Beantworten von Einladungen dieses einen Masters. Ein stummer Pi wäre endgültig verloren.

> Im Vertrauensmodell aus Abschnitt 4 sind diese Kommandos nicht authentifiziert — jedes Gerät im
> LAN könnte einen frischen Pi ablehnen oder anschließen. Das ist die bewusst akzeptierte Annahme.

---

## 5. Ablauf

```
Neuer Pi                      Netz                    Master + Admin
────────────────────────────────────────────────────────────────────────
1. bootet, Zustand
   "unclaimed"
2. annonciert _iobroker._tcp ──────────────────────>  3. Admin listet
   (role=unclaimed, uuid, mac)                           "Neue Hosts"
                                                      4. Anwender wählt
                                                         "Anschließen"
                              <────────────────────── 5. join(masterIp,
                                    UDP 50005            mhPassword)
6. prüft eigenen Zustand
   (nur wenn unclaimed)
7. sichert iobroker.json,
   schreibt objects.host/
   states.host, startet neu
8. verbindet sich zur DB ─────────────────────────>   9. erscheint als
   des Masters                                          system.host.<name>
                                                     10. Admin zeigt ihn im
                                                         Hosts-Tab

   oder: Anwender lehnt ab
                              <────────────────────── 4'. decline(masterUuid)
6'. merkt sich die UUID
    dauerhaft, annonciert
    weiter, ignoriert aber
    Einladungen dieses Masters
```

Schritt 5 setzt voraus, dass auf dem Master `multihostService.enabled` gesetzt ist. Ist es das
nicht, muss der Admin das im selben Dialog anbieten — inklusive des Hinweises aus Abschnitt 4, dass
damit die Datenbank im LAN geöffnet wird.

---

## 6. Was schiefgehen kann

| Fall | Folge | Vorkehrung |
|---|---|---|
| Master nicht erreichbar nach Neustart | Pi ist verwaist, ohne Datenbank | Vor dem Umschalten Erreichbarkeit von 9000/9001 prüfen; alte `iobroker.json` sichern und bei fehlgeschlagener Verbindung nach N Versuchen zurückrollen |
| Zwei Master im Netz | Pi könnte am falschen landen | Einmal-Code ist masterspezifisch; Anwender bestätigt Hostnamen |
| Uhrzeit auf dem Pi falsch | Auth-Fenster von 31 s greift nicht | Zeitstempel nicht als alleiniges Kriterium verwenden |
| Multicast blockiert | keine Anzeige | Rückfallebene C |
| Pi hängt in fremdem VLAN | keine Anzeige | Rückfallebene C |
| Anwender schließt konfigurierten Host an | Datenverlust auf diesem Host | nur `unclaimed` anbieten, serverseitig prüfen, Warnung im Dialog |

---

## 7. Was im Admin zu bauen wäre

- **Hosts-Tab:** Abschnitt „Neue Hosts gefunden" mit Hostname, IP, MAC, Version und den Knöpfen
  „Anschließen" und „Ignorieren".
- **Liste „Ignorierte Hosts"**, eingeklappt, mit „Wieder anzeigen". Ohne sie ist ein versehentlich
  abgelehnter kopfloser Pi nur durch Neuflashen zurückzuholen.
- **Kopplungsdialog:** Feld für den Einmal-Code, Anzeige der Master-Adresse, Warnung zum
  Datenbank-Zugriff, Hinweis auf die verworfene lokale Datenbank des neuen Hosts.
- **Vorbedingungen sichtbar machen:** Ist Multihost aus, direkt anbieten es einzuschalten
  (`BaseSettingsMultihost` existiert bereits, bisher nur in den Basis-Einstellungen erreichbar).
- **Fortschritt und Ergebnis:** Der Neustart des Pi dauert; der Dialog muss warten, bis
  `system.host.<name>` in der Datenbank auftaucht, und bei Zeitüberschreitung sagen, was zu tun ist.

Backend-seitig braucht der Admin einen Endpunkt, der die Suche anstößt und die Kopplung ausführt —
die eigentliche Arbeit gehört in den js-controller, nicht in die Oberfläche.

---

## 8. Offene Entscheidungen

1. **Wo lebt die Annonce?** Im js-controller (jede Installation kann es) oder nur im Image (nur
   offizielle Images)? Ersteres ist konsistenter, betrifft aber alle Installationen.
2. **Einladung beim Flashen: eigene Datei oder Erweiterung bestehender Mechanismen?** Der Raspberry
   Pi Imager kann Anpassungen mitgeben; eine Integration dort wäre bequemer als eine Datei, die der
   Anwender selbst anlegen muss.
3. **Kopplungsfenster:** dauerhaft offen bis zur ersten Kopplung, oder zeitlich begrenzt? Dauerhaft
   offen ist bequemer, aber ein im Schrank vergessener Pi bleibt dann dauerhaft übernehmbar.
4. **Datenbank absichern:** Solange 9000/9001 ohne Authentifizierung offenstehen, ist Multihost im
   Kern ein Vertrauensnetz. Ob das so bleiben soll, ist eine Entscheidung außerhalb dieses Konzepts —
   sie bestimmt aber, wie laut die Warnung im Dialog ausfallen muss.

---

## 9. Was ich nicht geprüft habe

- Verhalten mit Redis statt jsonl als Datenbank
- ob `MHServer` sich in einem eingeschränkten Modus starten lässt, ohne `enabled` zu setzen
  (Variante B)
- das Verhalten der offiziellen Images beim ersten Boot
- ob es im js-controller bereits einen unbenutzten Zustand „unclaimed" o. ä. gibt
