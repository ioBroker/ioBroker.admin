



## ausführliche Beschreibung

Der Adapter admin dient der Bedienung der gesamten ioBroker-Installation. Er stellt ein Webinterface zur Verfügung. Dieses wird unter der `<IP-Adresse des Servers>:8081` aufgerufen.Dieser Adapter wird direkt bei der Installation von ioBroker angelegt. Über das vom Adapter zur Verfügung gestellte GUI können folgenden Funktionen abgerufen werden:

*   Installation weiterer Adapter
*   Zugriff auf Objektübersicht
*   Zugriff auf die Zustandsübersicht der Objekte
*   Zugriff auf Benutzer und Gruppen Administration
*   Zugriff auf das Logfile
*   Verwaltung der Hosts

* * *

## Installation

Dieser Adapter wird direkt bei der Installation von ioBroker angelegt eine manuelle Installation ist nicht notwendig

* * *

## Konfiguration

### Instanz Konfigurationsmöglichkeiten

[caption id="attachment_2879" align="alignnone" width="600"]![adapter_admin_konfiguration](http://www.iobroker.net/wp-content/uploads/adapter_admin_konfiguration.png) Admin Adapter Einstellungen[/caption]

#### IP

Hier wird die IP-Adresse unter der der Adapter erreichbar ist eingegeben. Verschiedene Ipv4 und Ipv6 Möglichkeiten stehen zur Auswahl. <span style="color: #ff0000;">**Default ist 0.0.0.0\. Dies darf nicht verändert werden!**</span>

#### Port

Hier wird der Port, unter der der Administrator aufgerufen werden kann eingestellt. Falls auf dem Server mehrere Webserver laufen muss dieser Port angepasst werden, damit es nicht zu Problemen wegen doppelter Portvergabe kommt.

#### Verschlüsselung

Soll das sichere Protokoll https verwendet werden ist hier ein Haken zu setzen.

#### Authentifikation

Soll eine Authentifizierung erfolgen ist hier ein Haken zu setzen.

* * *

## Bedienung

Über den Webbrowser die folgende Seite aufrufen: `<IP-Adresse des Servers>:8081`

### Reiter

Die Hauptseite des Administrators besteht aus mehreren Reitern. [caption id="attachment_3231" align="alignnone" width="750"]![ioBroker.admin](http://www.iobroker.net/wp-content/uploads/Admin-Übersicht-1024x467.jpg) ioBroker.admin[/caption]

#### Adapter

Hier können die Instanzen eines Adapters installiert und gelöscht werden. Außerdem kann mit dem Update Icon links unten auf neue Versionen abgefragt werden. Die verfügbare und die installierte Version des Adapters wird angezeigt. Zur Übersicht wird der Entwicklungsstand eines Adapters farblich hinterlegt. (rot = in Planung; gelb = Beta; orange = Alpha; grün = Final). Ebenso können hier Updates auf eine neuere Version des Adapters durchgeführt werden. Liegt eine neue Version vor, erscheint die Beschriftung des Reiters in grüner Farbe. Ist das Fragezeichen-Icon in der letzten Spalte aktiv, gelangt man von dort aus mit einem Klick auf eine weiterführende _Github_-Seite mit Informationen zu dem Adapter.

#### Instanzen

Hier werden die bereits installierten Instanzen aufgelistet und können entsprechend konfiguriert werden. Wenn die Bezeichnung der Instanzen unterstrichen sind, kommt man direkt beim Anklicken der Bezeichnung auf die entsprechende Seite. Oben links kann man per Knopf die Experteneinstellungen sichtbar machen.

#### Objekte

Die verwalteten Objekte (z.B. die Geräte/Variablen/Programme der CCU). Hier können Objekte angelegt und gelöscht werden. Über die _Pfeil hoch_ und _Pfeil runter_ Knöpfe können ganze Objektstrukturen hoch- oder runtergeladen werden. Ein weiterer Knopf ermöglicht die Anzeige der Expertenansicht. Werden Werte in roter Schrift angezeigt, sind sie noch nicht bestätigt (`ack = false`).

#### Zustände

Die aktuellen Zustände der Objekte.

#### Ereignisse

Eine Liste der laufenden Aktualisierung der Zustände.

#### Gruppen

Hier können durch den Klick auf das (+) am unteren linken Bildrand Usergruppen angelegt werden.

#### Benutzer

Hier können Benutzer angelegt werden. Dazu links unten auf das (+) klicken. Standardmäßig ist der Administrator angelegt.

#### Aufzählungen

Hier werden die Favoriten, Gewerke und Räume aus der Homematic-CCU aufgelistet.

#### hosts

Der Rechner, auf dem ioBroker installiert ist. Hier kann die aktuelle Version des js-Controllers upgedated werden. Liegt eine neue Version vor, erscheint die Beschriftung des Reiters in grüner Farbe.

#### log

Hier wird das log angezeigt Im Reiter Instanzen kann bei den einzelnen Instanzen der zu loggende Loglevel eingestellt werden. In dem Auswahlmenü wird der anzuzeigende Mindest-Loglevel ausgewählt. Sollte ein Error auftreten, erscheint die Beschriftung des Reiters in roter Farbe. Nur nach Installation zusätzlicher Adapter:

#### Skripte

Dieser Reiter ist nur aktiv, wenn auch der javascript-Adapter installiert ist.

#### Node-red oder Webseiten anderer Adapter

Dieser Reiter ist nur sichtbar, wenn auch der entsprechende Adapter installiert ist (siehe nächster Punkt).

#### Reiter-Einstellungen

Hier können einzelne Reiter ein- und ausgeblendet werden, wenn die entsprechenden [Adapter](http://www.iobroker.net/?page_id=2236&lang=de) diese Funktion anbieten.

#### Systemeinstellungen

Systemweite Einstellungen, wie Sprache und Einheiten werden festgelegt. [caption id="attachment_3212" align="alignnone" width="600"]![Admin Systemeinstellungen](http://www.iobroker.net/wp-content/uploads/Systemeinstellungen.jpg) ioBroker.admin Systemeinstellungen[/caption]