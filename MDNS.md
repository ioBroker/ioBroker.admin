# mDNS / Bonjour — Geräte im Netz finden

Notizen zur Discovery per mDNS/DNS-SD. Verifiziert am 2026-07-27 auf Windows 11.

## Wichtigste Einschränkung zuerst

**„Alle Geräte, die auf mDNS antworten können" lässt sich nicht abfragen.** Das Protokoll kennt nur
zwei Zugriffe:

1. **Dienste durchsuchen** (DNS-SD) — findet ausschließlich Geräte, die aktiv einen Dienst
   *annoncieren*.
2. **Namen auflösen** — `geraet.local` → IP, setzt aber voraus, dass man den Namen bereits kennt.

Ein Gerät mit mDNS-Stack, das keinen Dienst anbietet, antwortet zwar auf seinen Namen, taucht aber
in **keiner** Browse-Liste auf. Wer wirklich alles sehen will, was auf Port 5353 spricht, muss
passiv mitschneiden (siehe unten).

---

## Windows

`dns-sd.exe` liegt in `C:\WINDOWS\system32` und kommt mit Bonjour (Apple). Prüfen:

```powershell
Get-Command dns-sd
Get-Service 'Bonjour Service'
```

Ist es nicht da: Bonjour Print Services oder iTunes installieren.

### Schritt 1 — welche Diensttypen gibt es im Netz?

Die Meta-Abfrage `_services._dns-sd._udp` zählt alle annoncierten Diensttypen auf:

```powershell
dns-sd -B _services._dns-sd._udp local.
```

Beispielausgabe:

```
Timestamp     A/R Flags if Domain   Service Type   Instance Name
23:12:02.770  Add     3 15 .        _tcp.local.    _http
23:12:02.770  Add     3 15 .        _tcp.local.    _esphomelib
23:12:02.770  Add     3 15 .        _tcp.local.    _airplay
23:12:02.770  Add     3 15 .        _tcp.local.    _raop
23:12:03.097  Add     3 15 .        _tcp.local.    _matter
23:12:03.097  Add     3 15 .        _udp.local.    _meshcop
23:12:03.097  Add     3 15 .        _tcp.local.    _spotify-connect
23:12:03.097  Add     2 15 .        _tcp.local.    _shelly
```

Die Spalte `Instance Name` enthält hier den *Diensttyp* (Eigenart dieser Meta-Abfrage).

### Schritt 2 — Instanzen eines Diensttyps

```powershell
dns-sd -B _shelly._tcp local.
```

```
Timestamp     A/R Flags if Domain   Service Type    Instance Name
23:12:31.106  Add     3 15 local.   _shelly._tcp.   Duschlicht
23:12:31.106  Add     3 15 local.   _shelly._tcp.   Toilette Backbord
23:12:31.106  Add     3 15 local.   _shelly._tcp.   shellyblugw-b0b21cfb85ec
```

### Schritt 3 — Details einer Instanz

```powershell
dns-sd -L "Duschlicht" _shelly._tcp local.   # Hostname, Port, TXT-Records
dns-sd -G v4 shellyplus-xxxx.local           # Name -> IPv4
dns-sd -G v4v6 shellyplus-xxxx.local         # Name -> IPv4 + IPv6
```

### Nützlich

```powershell
dns-sd -Z _shelly._tcp local.   # Ausgabe im Zonefile-Format (gut zum Wegschreiben)
dns-sd -q shellyplus-xxxx.local A   # gezielte Einzelabfrage
```

**`dns-sd` läuft dauerhaft** und beendet sich nicht von selbst — mDNS ist ereignisbasiert, neue
Geräte erscheinen live. Abbruch mit `Strg+C`. In Skripten braucht es deshalb ein Timeout:

```bash
timeout 10 dns-sd -B _services._dns-sd._udp local.
```

`A/R` in der Ausgabe heißt **Add** bzw. **Remove** — verschwindet ein Gerät, kommt eine
`Rmv`-Zeile.

---

## Linux / WSL

```bash
sudo apt install avahi-utils

avahi-browse -art      # alles: -a alle Typen, -r auflösen, -t nach einem Durchlauf beenden
avahi-browse -a        # dauerhaft lauschen
avahi-resolve -n geraet.local
```

`avahi-browse -art` erledigt Schritt 1–3 in einem Rutsch und ist damit deutlich bequemer als
`dns-sd`.

> **WSL2-Falle:** mDNS ist link-local. Im Standard-NAT-Modus sieht WSL2 das LAN nicht. Es braucht
> den gespiegelten Netzwerkmodus (`.wslconfig` → `networkingMode=mirrored`) oder man führt es direkt
> auf dem Host aus.

---

## macOS

Identisch zu Windows, `dns-sd` ist Teil des Systems:

```bash
dns-sd -B _services._dns-sd._udp local.
```

---

## Wirklich alles sehen: passiv mitschneiden

Nur so erwischt man auch Geräte, die lediglich *antworten* statt zu annoncieren, sowie die Anfragen
anderer Hosts.

**Wireshark-Filter:**

```
udp.port == 5353
```

**tcpdump:**

```bash
sudo tcpdump -i any -n port 5353
```

Sinnvolle Ergänzung, weil mDNS eben nicht vollständig ist:

```powershell
arp -a                    # alle Nachbarn, die IP-Verkehr hatten
```

---

## Weitere Werkzeuge

| Werkzeug          | Plattform | Kommando                                         |
|-------------------|-----------|--------------------------------------------------|
| `nmap`            | alle      | `nmap --script=broadcast-dns-service-discovery`  |
| `mdns-scan`       | Linux     | `mdns-scan`                                      |
| Discovery-Adapter | ioBroker  | findet Geräte und legt sie direkt als Objekte an |

---

## Programmatisch (Node.js)

Für eigene Discovery im Adapter-Kontext. Versionen geprüft am 2026-07-27:

| Paket              | Version | Zweck                                                                      |
|--------------------|---------|----------------------------------------------------------------------------|
| `bonjour-service`  | 1.4.3   | High-Level Browse/Publish, TypeScript, gepflegter Nachfolger von `bonjour` |
| `multicast-dns`    | 7.2.5   | Low-Level: rohe mDNS-Pakete senden/empfangen, volle Kontrolle              |
| `@homebridge/ciao` | 1.3.10  | Responder-Seite (Dienste selbst annoncieren)                               |
| `mdns-js`          | 1.0.3   | älter, weniger gepflegt                                                    |

Faustregel: **`bonjour-service`** zum Suchen, **`multicast-dns`** wenn man eigene Query-Typen
braucht (z. B. die Meta-Abfrage `_services._dns-sd._udp.local` selbst absetzen).

> Die konkreten APIs sind hier nicht verifiziert — vor Verwendung in die jeweilige README schauen.

---

## Häufige Diensttypen

| Typ                              | Geräte                                     |
|----------------------------------|--------------------------------------------|
| `_http._tcp`                     | Webinterfaces aller Art                    |
| `_shelly._tcp`                   | Shelly                                     |
| `_esphomelib._tcp`               | ESPHome                                    |
| `_matter._tcp` / `_matterc._udp` | Matter (kommissioniert / kommissionierbar) |
| `_meshcop._udp`                  | Thread Border Router                       |
| `_hap._tcp`                      | HomeKit                                    |
| `_airplay._tcp`, `_raop._tcp`    | AirPlay / AirPlay-Audio                    |
| `_spotify-connect._tcp`          | Spotify Connect                            |
| `_googlecast._tcp`               | Chromecast                                 |
| `_printer._tcp`, `_ipp._tcp`     | Drucker                                    |
| `_workstation._tcp`              | Rechner mit Avahi                          |
