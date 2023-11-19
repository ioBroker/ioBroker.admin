# Die Systemeinstellungen

Hier werden grundlegende Parameter für ioBroker eingestellt.

![Admin Systemeinstellungen](img/tab-system_Systemeinstellungen.jpg)

## Haupteinstellungen

### Systemsprache

damit kann man zwischen Systemsprachen wählen: Deutsch, Englisch, Russisch

### Einheit Temperatur

dieses Wert wird von manchen Adaptern verwendet. Möglich ist °C oder °F.

### Währung

Momentan benutzt das noch kein Adapter

### Datumsformat

wählen Sie wie das Datum im admin und vis angezeigt sein sollte.

### Trennzeichen

Komma oder Punkt für Float-Werte

### Default Historyinstanz

Diese SQL/History/InfluxDB Adapter Instanz wird benutzt defaultmäßig für flot und rickshaw (Charts).

## Verwahrungsorte oder Repositories

![](img/tab-system_Verwahrungsorte2.jpg)

ioBroker kann die Adapterliste von unterschiedlichen Quellen beziehen. Bei der Installation sind folgende Quellen eingetragen:

*   **default** - http://download.iobroker.net/sources-dist.json - Wird täglich um 01:00 am Server generiert. 
	Der Zugriff ist sehr schnell, die Versionsinformationenkönnen jedoch bis zu 24 Stunden alt sein.
*   **online** - https://raw.githubusercontent.com/ioBroker/ioBroker.js-controller/master/conf/sources-dist.json - Repository 
	wird von einer online Quelle generiert.  Der Zugriff kann sehr lange dauern, dies ist die aktuellste Quelle
*   **sources - conf/sources-dist.json** - Wird auch automatisch generiert und dauert auch sehr lange aber die Links können veraltet sein (es können manche Adapter fehlen)

## Zertifikate

![](img/tab-system_2017-01-19-09_33_54-ioBroker.jpg)

Hier ist die zentrale Stelle für die Zertifikate, die für die SSL/HTTPS Kommunikation benutzt werden. Die Zertifikate werden von admin, web, simple-api, socketio benutzt. Defaultmäßig sind Standardzertifikate installiert. Damit kann man nichts verifizieren. Sie dienen nur der SSL-Kommunikation. Weil die Zertifikate offen liegen sollte man eigene (self-signed) Zertifikate benutzen, richtige Zertifikate kaufen oder auf Let's Encrypt umsteigen. Die Kommunikation mit default Zertifikaten ist nicht sicher und falls jemand das Ziel hat den Traffic mitzulesen, könnte dies gemacht werden. Unbedingt eigene Zertifikate installieren. Z.b. unter [linux](http://guides.intertech.de/ssl_certificate_self.html).

## Let's Encrypt

![](img/tab-system_2017-01-19-09_40_07-ioBroker.jpg)

Let’s Encrypt ist eine kostenlose, automatisierte und Open Source _certificate authority_ der unabhängigen Internet Security Research Group (ISRG).

Nähere Informationen zu Let’s Encrypt gibt es [hier](https://letsencrypt.org/).

Einige Installationen benutzen Dynamic DNS o.ä. um über eine von dort vergebene Adresse, die eigene domain zu erreichen. IoBroker unterstützt die automatische Anforderung und Erneuerung von Zertifikaten bei der Let’s Encrypt Organisation.

Die Option die kostenlosen Zertifikate von Let’s Encrypt zu benutzen existiertin nahezu jedem Adapter, der einen Webserver starten kann und HTTPS unterstützt.

Wenn man die Option Zertifikate zu nutzen aktiviert, jedoch nicht das automatische Update, versucht die entsprechende Instanz mit gespeicherten Zertifikaten zu arbeiten.

Wenn die automatischen Updates aktiviert sind, versucht die Instanz Zertifikate bei Let’s Encrypt anzufordern und aktualisiert diese automatisch.

Die Zertifikate werden beim ersten Aufruf der entsprechenden Adresse zum ersten mal angefordert. D.h. wenn man z.B. "sub.domain.com" als Adresse konfiguriert und ruft anschließend [https://sub.domain.com](https://sub.domain.com/) auf werden die Zertifikate erstmalig angefordert was ein wenig dauern kann bevor die Antwort kommt.

Die Ausgabe der Zertifikate ist eine komplexe Prozedur, aber wenn man die folgende Erkklärung befolgt sollte es leicht sein, die kostenlosen Zertifikate zu erhalten.

**Vorgehensweise:**

1.  Ein neues Konto mit der eingegebenen eMail-Adresse muss erstellt werden (Setup dazu in den Systemeinstellungen)
2.  Ein zufälliger Schlüssel als Passwort für das Konto wird erzeugt.
3.  Wenn das Konto angelegt wurde öffnet das System eine kleine Website auf Port 80 um die Adresse zu bestätigen.
4.  Let's encrypt benutzt **immer** den Port **80** um die Adresse zu prüfen.
5.  Falls der Port 80 bereits von einem anderen Dienst benutzt wird, kommt Punkt 4 zum tragen - also dem anderen Dienst einen anderen Port zuweisen!
6.  Wenn der kleine Webserver gestartet ist wird die Anfrage nach den Zertifikaten für die angegebenen Adressen in den Systemeinstellungen an den Let's encrypt Server gesendet.
7.  Der Let's Encrypt Server sendet eine challenge phrase als Antwort auf die Anfrage zurück und versucht nach einer Weile diese challenge phrase unter der Adresse "http://yourdomain:80/.well-known/acme-challenge/" zu lesen.
8.  Wenn der Server diese challenge phrase von unsrere Seite zurückbekommt sendet der Let's Encrypt Server die Zertifikate. Diese werden in dem Verzeichnis, das in den Systemeinstellungen eingetragen ist gespeichert.

Dieses klingt komplex, aber alles was man machen muss ist ein paar Checkboxen zu aktivieren und die eMail-Adresse und die Web-Adresse in den Systemeinstellungen einzutragen.

Die erhaltenen Zertifikate sind für etwa 90 Tage gültig. Nachdem diese Zertifikate das erste mal ausgestellt wurden wird eine weiterer Task gestartet, der die Gültigkeit automatisch verlängert.

Dieses Thema ist ziemlich komplex und tausende Dinge können schiefgehen. Wenn es damit nicht klappen sollte wird empfohlen den Cloud-Adapter für den Zugang von unterwegs zu benutzen.

**Let's Encrypt funktioniert nur mit einer node.js version>=4.5**

## Statistik

![](img/tab-system_2017-01-19-09_48_46-ioBroker.jpg)

ioBroker admin sendet an download.iobroker.net folgende Information:

<pre>
{
	"uuid": "56cf0d20-XXXX-YYYY-BBBB-66eec47ZZZZZ",
	"language": "de",
	"hosts": [
		{
			"version": "0.15.1",
			"platform": "Javascript/Node.js",
			"type": "win32"
		}
	],
	"adapters": {
		"admin": {
			"version": "1.0.2",
			"platform": "Javascript/Node.js"
		},
		"hm-rpc": {
			"version": "1.1.2",
			"platform": "Javascript/Node.js"
		}
	}
}
</pre>

Das kann deaktiviert werden indem man Statistik auf "**nichts**"  einstellt.

Die Entwickler bitten jedoch um diese Informationen:

<pre>
Wir haben hart daran gearbeitet, dieses Projekt auf die Beine zu stellen.
Als Gegenleistung bitten wir Sie, uns die Nutzungs-Statistik zu senden.
Es werden keine privaten Informationen zu ioBroker.org gesendet. 
Jedes Mal wenn die Adapterliste aktualisiert wird, wird auch die anonymisierte Statistik verschickt.
Vielen Dank!
</pre>