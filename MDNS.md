# mDNS / Bonjour — Geräte im Netz finden

Notizen zur Discovery per mDNS/DNS-SD. Zielumgebung ist **Linux und Docker** — dort läuft ioBroker.
Windows und macOS stehen nur als Randnotiz am Ende; wenn dort etwas nicht geht, ist das kein Grund
zur Sorge.

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

## Linux

```bash
sudo apt install avahi-utils

avahi-browse -art      # alles: -a alle Typen, -r auflösen, -t nach einem Durchlauf beenden
avahi-browse -a        # dauerhaft lauschen
avahi-resolve -n geraet.local
avahi-resolve -a 192.168.1.42        # Rückwärts: IP -> Name
```

`avahi-browse -art` ist das Arbeitspferd: Diensttypen suchen, Instanzen auflisten und Hostname,
Port sowie TXT-Records auflösen — alles in einem Durchlauf.

Gezielt nach einem Diensttyp:

```bash
avahi-browse -rt _shelly._tcp
avahi-browse -rt _esphomelib._tcp
```

Ohne `-t` läuft der Befehl dauerhaft und meldet neue Geräte live. mDNS ist ereignisbasiert; ein
einzelner Durchlauf kann Geräte übersehen, die gerade nicht antworten. Bei unvollständigen
Ergebnissen also länger lauschen lassen:

```bash
timeout 30 avahi-browse -ar
```

### Voraussetzungen

```bash
systemctl status avahi-daemon     # muss laufen
ss -lunp | grep 5353              # avahi-daemon muss auf 5353/udp hören
```

Ist `avahi-daemon` nicht aktiv, liefert `avahi-browse` nur einen Verbindungsfehler zum D-Bus —
nicht etwa eine leere Liste. Die beiden Fälle nicht verwechseln.

---

## Docker

Hier steckt der eigentliche Stolperstein: **mDNS ist link-local Multicast auf 224.0.0.251 mit
TTL 1.** Das überlebt die NAT-Bridge von Docker nicht. Ein Container im Standardnetz (`bridge`)
sieht vom mDNS des LAN **nichts** — auch nicht, wenn man Port 5353 veröffentlicht, denn `-p` macht
Unicast-Weiterleitung, kein Multicast.

### Der übliche Weg: Host-Netzwerk

```bash
docker run --network host ...
```

In `docker-compose.yml`:

```yaml
services:
  iobroker:
    image: buanet/iobroker:latest
    network_mode: host
```

Damit teilt der Container den Netzwerk-Stack des Hosts und sieht dasselbe wie dieser. Das ist der
Modus, den auch das ioBroker-Image für Discovery empfiehlt.

> **Nur unter Linux wirksam.** Bei Docker Desktop (Windows, macOS) läuft der Docker-Host in einer
> eigenen VM; `network_mode: host` bezieht sich auf diese VM, nicht auf dein LAN. mDNS-Discovery
> funktioniert dort in aller Regel nicht — siehe die Einordnung ganz unten.

### Alternative: macvlan

Wenn Host-Netz nicht in Frage kommt, gibt man dem Container über `macvlan` eine eigene Adresse
direkt im LAN:

```yaml
networks:
  lan:
    driver: macvlan
    driver_opts:
      parent: eth0
    ipam:
      config:
        - subnet: 192.168.1.0/24
          gateway: 192.168.1.1
```

Bekannte Eigenart: Host und macvlan-Container können einander standardmäßig **nicht** erreichen —
dafür braucht es zusätzlich ein macvlan-Interface auf dem Host.

### Konflikt um Port 5353

Läuft auf dem Host bereits ein `avahi-daemon` und der Container startet einen eigenen, streiten sich
beide um 5353/udp. Zwei saubere Auflösungen:

- **Kein zweiter Daemon im Container**, stattdessen den des Hosts mitbenutzen:

  ```yaml
  volumes:
    - /var/run/dbus:/var/run/dbus
    - /var/run/avahi-daemon/socket:/var/run/avahi-daemon/socket
  ```

  Dann funktionieren `avahi-browse` und Bibliotheken, die über D-Bus gehen, im Container.

- **Oder** auf dem Host `avahi-daemon` abschalten und ihn nur im Container betreiben.

Node-Bibliotheken wie `bonjour-service` sprechen **nicht** über D-Bus, sondern öffnen einen eigenen
Multicast-Socket. Die brauchen kein Avahi, aber sehr wohl ein Netz, in dem Multicast ankommt — also
Host-Netz oder macvlan.

### Schnelltest im Container

```bash
docker exec -it <container> sh -c "apk add --no-cache avahi-tools 2>/dev/null || apt-get update && apt-get install -y avahi-utils; avahi-browse -art"
```

Kommt nichts zurück, zuerst prüfen, ob überhaupt Multicast ankommt:

```bash
docker exec -it <container> tcpdump -i any -n port 5353
```

Bleibt das leer, während der Host Pakete sieht, ist es das Netzwerk-Setup — nicht die Anwendung.

---

## Wirklich alles sehen: passiv mitschneiden

Nur so erwischt man auch Geräte, die lediglich *antworten* statt zu annoncieren, sowie die Anfragen
anderer Hosts.

```bash
sudo tcpdump -i any -n port 5353
sudo tcpdump -i eth0 -n -A port 5353     # mit Paketinhalt
```

Wireshark-Filter: `udp.port == 5353`

Sinnvolle Ergänzung, weil mDNS eben nicht vollständig ist:

```bash
ip neigh          # alle Nachbarn, die IP-Verkehr hatten
arp -a
```

---

## Weitere Werkzeuge

| Werkzeug          | Plattform | Kommando                                         |
|-------------------|-----------|--------------------------------------------------|
| `mdns-scan`       | Linux     | `mdns-scan`                                      |
| `nmap`            | alle      | `nmap --script=broadcast-dns-service-discovery`  |
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

---

## Randnotiz: Windows und macOS

Beide sind für ioBroker nebensächlich. Wenn es dort klemmt, ist das kein Fehler, den man verfolgen
muss.

**macOS** bringt `dns-sd` mit, es funktioniert ohne weiteres Zutun:

```bash
dns-sd -B _services._dns-sd._udp local.   # alle Diensttypen
dns-sd -B _shelly._tcp local.             # Instanzen eines Typs
dns-sd -L "Duschlicht" _shelly._tcp local.
dns-sd -G v4 shellyplus-xxxx.local
```

**Windows** hat dasselbe `dns-sd.exe` in `C:\WINDOWS\system32`, allerdings nur, wenn Bonjour
installiert ist (kommt mit Bonjour Print Services oder iTunes):

```powershell
Get-Command dns-sd
Get-Service 'Bonjour Service'
```

Verifiziert am 2026-07-27 unter Windows 11: die Meta-Abfrage funktioniert und liefert die
Diensttypen, `Instance Name` enthält dort den *Diensttyp* statt eines Instanznamens — eine Eigenart
genau dieser Abfrage.

`dns-sd` beendet sich nie von selbst, in Skripten also `timeout` davorsetzen. `A/R` in der Ausgabe
heißt **Add** bzw. **Remove**.

**WSL2** sieht im Standard-NAT-Modus kein LAN-Multicast — dasselbe Problem wie Docker unter Windows.
Es bräuchte `networkingMode=mirrored` in der `.wslconfig`. Auch das würde ich nicht weiter verfolgen.
