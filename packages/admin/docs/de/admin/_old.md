



## ausführliche Beschreibung

Der Adapter admin dient der Bedienung der gesamten ioBroker-Installation. Er stellt ein Webinterface zur Verfügung. Dieses wird unter der `<IP-Adresse des Servers>:8081` aufgerufen. Dieser Adapter wird direkt bei der Installation von ioBroker angelegt. Über das vom Adapter zur Verfügung gestellte GUI können u.a. folgenden Funktionen abgerufen werden:

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

[![adapter_admin_konfiguration](http://www.iobroker.net/wp-content/uploads/adapter_admin_konfiguration.png)](http://www.iobroker.net/wp-content/uploads//adapter_admin_konfiguration.png)

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

* * *

## Reiter

Die Hauptseite des Administrators besteht aus mehreren Reitern. In der Grundinstallation werden die Reiter wie in der Abbildung angezeigt. Über das Bleistift-Icon rechts oben (1) können nach der Installation zusätzlicher Adapter weitere Reiter hinzugefügt werden. Dort können auch Reiter deaktiviert werden um eine besser Übersicht zu erhalten. [![iobroker_adapter_admin_001a](img/ioBroker_Adapter_Admin_001a.jpg)](img/ioBroker_Adapter_Admin_001a.jpg)

### Adapter

Hier werden die verfügbaren und installierten Adapter angezeigt und verwaltet.  

#### Die Titelzeile

in der Titelzeile befinden sich Icons für die wichtigsten Vorgänge. Zu jedem Icon gibt es eine Kontexthilfe. Dazu einfach mit der Maus eine Weile auf dem Icon bleiben. ![iobroker_adapter_admin_002aa](http://www.iobroker.net/wp-content/uploads//ioBroker_Adapter_Admin_002aa.jpg)  

##### **Die Icons im einzelnen:**

![iobroker_adapter_admin_002a](http://www.iobroker.net/wp-content/uploads//ioBroker_Adapter_Admin_002a.jpg)   **1.)  nur installierte Adapter anzeigen** Bei Anwahl dieses Icons werden nur noch die bereits installierten Adapter angezeigt (Toggle-Funktion)   **2.) Adapter mit Updates anzeigen** Bei Anwahl dieses Icons werden nur noch Adapter angezeigt, zu denen ein Update vorliegt (Toggle-Funktion) Hinter den updatefähigen Adaptern findet sich in der Spalte **_installiert_** ein Update-Icon. Durch Klick auf diesen Button wird der entsprechende Adapter auf die neueste Version gebracht. Außerdem erscheint ein weiteres Icon in der Titelzeile: ![iobroker_adapter_admin_002b](http://www.iobroker.net/wp-content/uploads//ioBroker_Adapter_Admin_002b.jpg) Durch Anklicken dieses Icons werden alle verfügbaren Adapter aktualisiert.   **3.) Adapter aus eigener URL installieren** Über das Octocat-Icon können Adapter aus eigenen Pfaden (URL oder Dateipfade) oder Vorabversionen von GitHub installiert werden. Nach Anklicken dieses Icons öffnet sich ein entsprechendes Auswahlfenster: ![iobroker_adapter_admin_002c_github](http://www.iobroker.net/wp-content/uploads//ioBroker_Adapter_Admin_002c_GitHub.jpg) Unter dem Reiter **_Von github_** wird einfach im Pulldownmenü der gewünschte Adapter ausgewählt und die neueste Vorabversion wird installiert. Bei Anwahl des Reiters Beliebig kann ein bliebeiger Dateiupfad oder ein beliebiger URL (z.B. ein URL zu einem externen Adapterentwickler) in das Feld eingegeben werden und der entsprechende Adapter installiert werden. ![iobroker_adapter_admin_002c_ownfile](http://www.iobroker.net/wp-content/uploads//ioBroker_Adapter_Admin_002c_ownFile.jpg)   **4.) Nach Updates suchen** Bei jedem Neustart wird automatisch nach Updates gesucht. Über diesen Button kann man aber die Suche manuell anstoßen. Wenn Updates in dem unter [Systemeinstellungen](#Systemeinstellungen) eingestellten Repository zur Verfügung stehen, wird die Schrift des Reiters **_Adapter_** in grüner Farbe dargestellt.   **5.) Sortierung ändern** Mit diesem Button wird die Sortierung der Adapter auf dieser Seite geändert. Bei aktivem Button sind alle Adapter alphabetisch sortiert, wobei zuerst ein Block mit den installierten Adaptern, danach einer mit noch nicht installierten Adaptern angezeigt wird. Jeder dieser beiden Blöcke ist in sich alphabetisch sortiert. Ist dieser Button nicht aktiv, werden die Adapter nach Themen sortiert. Dann sind auch die nächsten beiden Icons sichtbar.   **6.) Alle Themengebiete zuklappen**   **7.) Alle Themengebiete aufklappen** Auf der rechten Seite befinden sich auch noch zwei Buttons ![iobroker_adapter_admin_003a](http://www.iobroker.net/wp-content/uploads//ioBroker_Adapter_Admin_003a.jpg)   **8.) Reiter editieren** Mit diesem Button kann man nicht benötigte Reiter ausblenden und nicht sichtbare einblenden.   **<a id="Systemeinstellungen"></a>9.) Systemeinstellungen** Hier werden grundlegende Parameter für ioBroker eingestellt. ![Admin Systemeinstellungen](http://www.iobroker.net/wp-content/uploads/Systemeinstellungen.jpg) **Systemsprache** - damit kann man zwischen Systemsprachen wählen: Deutsch, Englisch, Russisch **Einheit Temperatur** - dieses Wert wird von manchen Adaptern verwendet. Möglich ist °C oder °F. **Währung** - Momentan benutzt das noch kein Adapter **Datumsformat** - wählen Sie wie das Datum im admin und vis angezeigt sein sollte. **Trennzeichen** - Komma oder Punkt für Float-Werte **Default Historyinstanz** - Diese SQL/History/InfluxDB Adapter Instanz wird benutzt defaultmäßig für flot und rickshaw (Charts).

##### Verwahrungsorte oder Repositories

![](http://www.iobroker.net/wp-content/uploads//2017-01-19-09_16_49-ioBroker.admin_.png) ioBroker kann die Adaptersliste von unterschiedlichen Quellen beziehen. Bei der Installation sind folgende Quellen eingetragen:

*   default - http://download.iobroker.net/sources-dist.json - Wird täglich um 01:00 am Server zusammen gebaut. Sehr schnell aber konnte bis 24 Stunden ältere Info haben.
*   online - https://raw.githubusercontent.com/ioBroker/ioBroker.js-controller/master/conf/sources-dist.json - Repository wird von online Quelle zusammengebaut. Kann sehr lange dauern, aber ist aktuellste Quelle
*   sources - conf/sources-dist.json - Wird auch zusammengebaut und dauert auch sehr lange aber die Links können veraltet sein (es können manche Adapter fehlen)

##### Zertifikate

![](http://www.iobroker.net/wp-content/uploads//2017-01-19-09_33_54-ioBroker.admin_.png) Hier ist die zentrale Stelle für die Zertifikate, die für die SSL/HTTPS Kommunikation benutzt werden. Die Zertifikate werden von admin, web, simple-api, socketio benutzt. Defaultmäßig sind Standardzertifikate installiert. Damit kann man nichts verifizieren. Nur SSL Kommunikation laufen lassen. Weil die Zertifikate offen liegen sollte man eigene (self-signed) Zertifikate benutzen, die richtige Zertifikate kaufen oder auf Let's Encrypt umsteigen. Die Kommunikation mit default Zertifikaten ist nicht sicher und falls jemand das Ziel hat den Trafik mitzulesen, dass konnte gemacht werden. Unbedingt eigene Zertifikate installieren. Z.b. unter [linux](http://guides.intertech.de/ssl_certificate_self.html).

##### Let's Encrypt

![](http://www.iobroker.net/wp-content/uploads//2017-01-19-09_40_07-ioBroker.admin_.png) Let’s Encrypt is a free, automated, and open certificate authority brought to you by the non-profit Internet Security Research Group (ISRG). You can read about Let’s Encrypt [here](https://letsencrypt.org/). Some installations use Dynamic DNS and Co to get the domain name and to reach under this domain name own web sites. ioBroker supports automatic request and renew of certificates from Let’s Encrypt Organisation. There is an option to activate free certificates from Let’s Encrypt almost in every adapter, that can start some web server and supports HTTPS. If you just enable the using of certificates and will not activate an automatic update the instance will try to use stored certificates. If the automatic update is activated the instance will try to request certificates from Let’s Encrypt and will automatically update it. The certificates will be first requested when the given domain address will be accessed. E.g you have "sub.domain.com" as address, when you try to access [https://sub.domain.com](https://sub.domain.com/) the certificates will be first requested and it can last a little before first answer will come. The issuing of certificates is rather complex procedure, but if you will follow the explanation you will easy get free certificates. Description:

1.  The new account will be created with given email address (you must set it up in system settings)
2.  Some random key will be created as password for the account.
3.  After the account is created the system starts on port 80 the small web site to confirm the domain.
4.  Let's encrypt use **always** port **80** to check the domain.
5.  If port 80 is occupied by other service see point 4.
6.  After the small web server is up the request to get certificates for given domains (system settings) will be sent to the Let's encrypt server.
7.  Let's encrypt server sends back some challenge phrase as answer on the request and after a while tries to read this challenge phrase on "http://yourdomain:80/.well-known/acme-challenge/"
8.  If challenge phrase from our side comes back the Let's encrypt server send us the certificates. They will be stored in the given directory (system settings).

Sounds complex, but everything what you must do is to activate checkboxes and specify your email and domain in system settings. The received certificates are valid ca. 90 days. After the certificates are received the special task will be started to automatically renew the certificates. The topic is rather complex and 1000 things can go wrong. If you cannot get certificates please use cloud service to reach your installation from internet. **Let's encrypt works only from node.js version>=4.5**  

##### Statistics

![](http://www.iobroker.net/wp-content/uploads//2017-01-19-09_48_46-ioBroker.admin_.png) ioBroker admin sendet an download.iobroker.net folgende Information:

<pre id="diagSample" class="">{
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
}</pre>

Das konnte unterstellt werden in dem man Statistics auf "**nichts**"  einstellt. Trotzdem die Entwickler bitten um Nachgeben:

> _Wir haben hart gearbeitet um dieses Projekt auf die Beine zu stellen. Als Gegenleistung bitten wir Sie uns die Statistik über die Benutzung an uns zu schicken._ _Keine private Information wird zu ioBroker.org gesendet. Jedes Mal wenn Adapterliste upgedated wird, wird die anonymisierte Statistik gesendet._

#### Der Seiteninhalt

  [![iobroker_admin_adapter_inhalt01](img/ioBroker_Admin_Adapter_Inhalt01.jpg)](img/ioBroker_Admin_Adapter_Inhalt01.jpg) Auf der Seite werden die Adapter tabellarisch dargestellt. Die Tabelle besteht aus folgenden Spalten:  

##### **1.) Name**

In dieser Spalte werden die Namen der Adapter mit den dazugehörigen Icons aufgeführt. Ist über das Icon (5) in der Titelzeile das Gruppieren von Adaptern angewählt erscheinen hier auch die Gruppennamen.  

##### **2.) Beschreibung**

Hier befindet sich eine kurze Beschreibung der Funktion des Adapters  

##### **3.) Schlüsselworte**

Hier sind einige Suchbegriffe aufgeführt, die mit dem Adapter assoziiert werden.  

##### **4.) Version**

Die verfügbare Version wird hier angezeigt. Zur Übersicht wird der Entwicklungsstand eines Adapters farblich hinterlegt. (rot = in Planung; gelb = Beta; orange = Alpha; grün = Final).  

##### **5.) installiert**

Diese Spalte gibt verschiedene Informationen über den Installationsstatus dieses Adapters. Zum einen steht dort die Versionsnummer des installierten Adapters. Ist diese fettgedruckt liegt ein Update vor. Dahinter steht in eckigen Klammern die Anzahl der von diesem Adapter installierten Instanzen, wie viele davon aktiviert sind und wie deren Status ist. So bedeutet [2/<span style="color: #339966;">1</span>], dass von diesem Adapter zwei Instanzen existieren, wovon eine aktiviert ist und ohne Probleme läuft (letzteres ist an der grünen Farbe der zweiten Zahl zu erkennen). Weiter rechts befindet sich ein Update-Icon wenn zu diesem Adapter ein Update vorliegt Adapter. Durch Anklicken dieses Icons wird der Updatevorgang gestartet.  

##### **6.) Plattform**

Hier wird angegeben auf welcher Softwareplattform dieser Adapter beruht. Üblicherweise ist dies javascript unter nodejs.  

##### **7.) Lizenz**

Dies ist die Lizenz unter der der Adapter zur Verfügung gestellt wird. Die Lizenzbedingungen finden sich üblicherweise im readme. Verlangt die Lizenz, dass sie vom Enduser akzepiert werden muss, wird ein entsprechendes Fenster mit den Lizenzbedingungen beim Erstellen einer Instanz angezeigt.  

##### **8.) Installieren**

In dieser Spalte befinden sich verschiedene Buttons für die Installation und für Hilfe.

*   (+) Hiermit wird eine Instanz des Adapters hinzugefügt. Diese muss im Reiter Instanzen noch konfiguriert und aktiviert werden. **Nur wenn von einem Adapter mindestens eine Instanz angelegt wurde, kann der Adapter auch bei ioBroker verwendet werden.** Bei den meisten Adaptern können beliebig viele Instanzen installiert werden, z.B. um unterschiedliche Hardware anzusprechen. Sollte dies nicht möglich sein, öffnet sich ein Fenster mit einer entsprechenden Fehlermeldung.
*   (?) Wenn dieser Button aktiv ist, verlinkt er zu der Hilfeseite zu dem Adapter. Diese befindet sich üblicherweise auf GitHub, wo auch der Adapter gepflegt wird.
*   (Mülleimer) Dieser Button löscht den Adapter und alle bereits installierten Instanzen

Ist das Fragezeichen-Icon in der letzten Spalte aktiv, gelangt man von dort aus mit einem Klick auf eine weiterführende _Github_-Seite mit Informationen zu dem Adapter.    

### Instanzen

Hier werden die bereits über den Reiter Adapter installierten Instanzen aufgelistet und können entsprechend konfiguriert werden.  

#### Die Titelzeile

in der Titelzeile befinden sich Icons für die wichtigsten Vorgänge. Zu jedem Icon gibt es eine Kontexthilfe. Dazu einfach mit der Maus eine Weile auf dem Icon bleiben. Außerdem gibt es noch Informationen zu der Auslastung des Servers [![iobroker_admin_instanzen_headline_icons](img/ioBroker_Admin_Instanzen_Headline_Icons-e1476803621402.jpg)](img/ioBroker_Admin_Instanzen_Headline_Icons-e1476803621402.jpg)  

#### **Die Icons im einzelnen:**

##### **1.)  Administratormodus**

Bei Anwahl dieses Icons werden weitere Spalten zur Konfiguration der Instanzen angezeigt (Toggle-Funktion). Informationen dazu im Abschnitt Seiteninhalt.  

##### **2.) Ansicht aktualisieren**

Sollten gerade erst angelegte Instanzen nicht sichtbar sein, hilft ein Anklicken dieses Icons den Zustand der Seite auf den neuesten Stand zu bringen.  

##### **3.) Statusinformationen zum Server**

im rechten Teil der Titelzeile befinden sich Informationen über die Aktivitäten der Instanzen sowie der Auslastung des ioBroker Servers. Die ersten Zahlen geben den bisher von den Instanzen verbrauchten Arbeitsspeicher und den restlichen freien Speicher in MB an. Dahinter den freien Speicher in %. In den eckigen Klammern steht der Name des ioBroker-Servers und die Anzahl der laufenden Prozesse. Sollte der freie Arbeitsspeicher unter 10% fallen wird die Prozentzahl rot dargestellt.    

#### Der Seiteninhalt

[![iobroker_admin_instanzen_headline_columns](img/ioBroker_Admin_Instanzen_Headline_Columns.jpg)](img/ioBroker_Admin_Instanzen_Headline_Columns.jpg) Auf der Seite werden die installierten Instanzen der Adapter tabellarisch dargestellt. Die Tabelle besteht aus folgenden Spalten (Die hier beschriebenen Spalten sind zum Teil nur im Administratormodus sichtbar):  

##### **1.) Zustand**

Hier wird durch eine Ampel der Zustand der Instanz dargestellt. Weitere Informationen erhält man indem man mit der Maus auf dem Signal stehen bleibt. ![iobroker_admin_instanzen_status](http://www.iobroker.net/wp-content/uploads//ioBroker_Admin_Instanzen_Status.jpg) Nicht alle Instanzen besitzen diese Ampel. Dies ist aber kein Grund zur Panik. Dies sind entweder zeitgesteuerte Instanzen, die sich nur kurz mit dem Controller verbinden und sich dann sofort wieder abschalten oder wie z.B. vis im Hintergrund weiterlaufen.  

##### **2.) Icon**

Hier wird das Icon angezeigt, das ioBroker-weit für diesen Adapter verwendet wird  

##### **3.) Instanz**

In dieser Spalte steht der Name der Instanz. er setzt sich zusammen aus dem Namen des Adapters sowie einer Zahl, die in der Reihenfolge der Installation der Instanzen fortlaufend durchnummeriert wird. Die erste Instanz erhält die 0\. Diese Bezeichnung ist die Grundlage für die Bezeichnung der Datenpunkte in ioBroker.  

##### **4.) aktiviert**

Hier wird die Instanz gestartet oder angehalten. Das grüne Pause-Zeichen zeigt an, dass der Adapter läuft und durch den Klick darauf pausiert werden kann, das rote Play-Zeichen zeigt eine gestoppte Instanz, die mit einem Klick gestartet werden kann.  

##### **5.) Konfiguration**

Bei Anklicken dieses Icons wird ein adapterspezifisches Konfigurationsmenü geöffnet. Die entsprechenden Menüs sind bei den dazugehörigen [Adaptern](http://www.iobroker.net/?page_id=2236&lang=de) beschrieben.  

##### **6.) restart**

Beim Klick auf dieses Icon wird die entsprechende Instanz neu gestartet  

##### **7.) Mülleimer**

Mit diesem Icon wird die entsprechende Instanz gelöscht. Andere Instanzen des selben Adapters bleiben erhalten. Auch der Adapter selbst bleibt bestehen.  

##### **8.) Weblink**

Hinter diesem Icon verbirgt sich ein Link auf die Website dieser Instanz. Entweder weil dieser Adapter ein eigenes Webinterface (mit anderem Port) mitbringt, oder nur einen anderen Pfad. Teilweise führt dieser Link auch auf Hilfeseiten.  

##### **9.) Titel**

Hier wird der Name der Instanz angegeben. Diesen Namen kann man nach den eigenene Wünschen oder Bedürfnissen änder. Dies ist insbesondere dann sinnvoll, wenn es von einem Adapter mehrere Instanzen (mit sonst gleicher Bezeischnung) gibt. Dies wäre z.B. bei hm-rpc der Fall, wenn es für RF, Wired und CuxD je eine Instanz gibt.  

##### **10.) Zeitplanung**

Bei Adaptern, die zeitgesteuert gestartet werden, wird hier eingetragen wann dieser Adapter starten soll. Diese Zeitplanung ist im Format eines [cronjobs](https://de.wikipedia.org/wiki/Cron#Beispiele). Zur Änderung klickt man auf den Button mit den drei Punkten. Es öffnet sich ein Eingabefenster mit sehr viel Zusatzinformationen und Hilfe. [![iobroker_admin_instanzen_cronjob](img/ioBroker_Admin_Instanzen_Cronjob.jpg)](img/ioBroker_Admin_Instanzen_Cronjob.jpg)  

##### **11.) Neu starten**

Wenn diese Checkbox angehakt wird kann hier ebenfalls ein Zeitplan erstellt werden wann diese Instanz neu gestartet werden soll.  

##### **12.) Log Stufe**

In dieser Spalte kann der jeweilige Loglevel für die Instanz angepasst werden. Zur Verfügung stehen debug, info, warn und error. Standardmäßig steht dieser Wert auf info. Hat man den Eindruck, dass etwas nicht ganz rund läuft kann man ihn auf debug stellen. dann werden im Reiter log zu dieser Instanz auch debug Informationen ausgegeben, die helfen können einen Fehler zu finden. Umgekehrt kann man diesen Wert auch höher stellen, damit das log nicht so umfangreich wird.  

##### **13.) RAM Limit**

Hier kann man vorgeben wieviel Arbeitsspeicher der Instanz vorsorglich bereitgestellt werden soll. Diese Menge Speicher steht dann anderen Aufgaben nicht mehr zur Verfügung und sollte gerade bei Systemen mit wenig Arbeitsspeicher nicht zu hoch gewählt werden. Sollte die Instanz vorübergehend mehr Speicher benötigen, wird ihr dieser vom System selbstverständlich zugeteilt werden aber anschließend sofort wieder für das System freigegeben. In der Zeit, in dere eine Instanz mehr Speicher benötigt, als ihr reserviert wurde wird der benötigte Speicher rot dargestellt.  

##### **14.) RAM Benutzung**

Hier wird der tatsächlich von der Instanz verwendete Arbeitsspeicher angezeigt. Diese Werte werden regelmäßig aktualisiert. Nach der Aktualisierung erscheinen diese Werte kurz in grüner Schrift.    

### Objekte

Unter diesem Reiter befinden sich alle verwalteten Objekte. Zu jeder Instanz wird hier ein Ordner angelegt in dem sich die von ihr angelegten Datenpunkte in einer hierarchischen Struktur befinden. Hier können Objekte auch manuell angelegt und gelöscht werden. Es können ganze Objektstrukturen hoch- oder runtergeladen werden. Ein weiterer Knopf ermöglicht die Anzeige der Expertenansicht.  

#### Die Titelzeile

in der Titelzeile befinden sich Icons für die wichtigsten Vorgänge. Zu jedem Icon gibt es eine Kontexthilfe. Dazu einfach mit der Maus eine Weile auf dem Icon bleiben. ![iobroker_admin_objekte_headline_icons](http://www.iobroker.net/wp-content/uploads//ioBroker_Admin_Objekte_Headline_Icons.jpg)  

#### **Die Icons im einzelnen:**

##### **1.) Ansicht aktualisieren**

Sollten gerade erst angelegte Objekte nicht sichtbar sein, hilft ein Anklicken dieses Icons den Zustand der Seite auf den neuesten Stand zu bringen.  

##### **2.) Sortierung ändern**

Mit diesem Button wird die Sortierung der Objekte auf dieser Seite geändert. Bei aktivem Button sind alle Objekte alphabetisch sortiert. Ist dieser Button nicht aktiv, werden die Ojekte hierarchisch nach Instanzen sortiert. Dann sind auch die nächsten beiden Icons sichtbar.  

##### **3.) Alle Themengebiete zuklappen**

##### **4.) Alle Themengebiete aufklappen**

##### **5.)  Administratormodus**

Bei Anwahl dieses Icons werden weitere Objekte angezeigt (Toggle-Funktion). Dieses sind die Datenpunkte des Systems.  

##### **6.) hinzufügen**

Nach Anwählen dieses Icons können weitere Objekte hinzugefügt werden. Ist ein Ordner angewählt wird dieser als _Parent_ in der Objektstruktur übernommen. Ein Konfigurationsfenster öffnet sich: ![iobroker_admin_objekte_addobject](http://www.iobroker.net/wp-content/uploads//ioBroker_Admin_Objekte_AddObject.jpg) Hier muss jetzt der Name für das neue Objekt ausgewählt werden, wobei als Typ gemäß der hierarchischen Struktur ein Gerät, ein Kanal oder ein Datenpunkt zur Verfügung steht. Als Datenpunkttypen stehen Logikwert, Schalter, Zeichenkette, Zahl, Werteliste, Feld, Objekt und gemischt zur Verfügung. Sobald man das Eingabefenster mit ok bestätigt öffnet sich ein weiteres Fenster: [![iobroker_admin_objekte_addobjec02t](img/ioBroker_Admin_Objekte_AddObjec02t.jpg)](img/ioBroker_Admin_Objekte_AddObjec02t.jpg) Hier können noch einige Daten eingegeben werden. So kann dem Objekt eine Rolle und ein icon hinzugefügt werden. Unter den anderen Reitern befinden sich noch weitere Eigenschaften des Objekts. So eine Information gibt es zu jedem Objekt.  

##### **7.) Upload**

Mit diesem Button wird eine komplette Objektstruktur als json-Datei auf den ioBroker Server hochgeladen  

##### **8.) Download**

Mit diesem Button wird die ausgewählte Objektstruktur als json-Datei vom ioBroker Server heruntergeladen und kann gespeichert werden.    

#### Der Seiteninhalt

[![iobroker_admin_objekte_headline_columns](img/ioBroker_Admin_Objekte_Headline_Columns.jpg)](img/ioBroker_Admin_Objekte_Headline_Columns.jpg) Auf der Seite werden die vorhandenen Objekte tabellarisch dargestellt. Die Tabelle besteht aus folgenden Spalten (Die Felder unter den Spaltenköpfen 1 und 2 sowie die Pulldownmenüs der weiteren Spalten dienen als Filterkriterien). Die Tabelle im Bild ist nach Hierarchie geordnet und alle Unterpunkte (nodes) wurden aufgeklappt:  

##### **1.) ID**

Dieses sind die obersten Ebenen der Objekthierarchie. Hier werden als oberste Ebene z.B. der Name der Instanz, darunter die jeweilige Struktur der Daten angelegt.  

##### **2.) Name**

In dieser Spalte wird die Bezeichnung des Objekts angegeben. Zusätzlich wird durch ein vorangestelltes Icon gezeigt um welche Hierarchieebene es sich hier handelt (Gerät, Kanal oder Datenpunkt) Die Werte dieser Spalte sind editierbar. [![iobroker_admin_objekte_structure01](img/ioBroker_Admin_Objekte_Structure01.jpg)](img/ioBroker_Admin_Objekte_Structure01.jpg)  

##### **3.) Typ**

Der Typ in der Hierarchieebene, der in der Spalte _Name_ bereits durch das vorangestellte Icon ersichtlich war, wird hier noch einmal explizit genannt. Über das Pulldownmenü im Spaltenkopf kann man Nach diesen Typen filtern und sich so z.B. nur alle Datenpunkte anzeigen lassen.  

##### 4.) Rolle

Hier wird die Funktion dieses Objekts kurz über einen Begriff beschrieben, nach dem man wiederum filtern kann. Die Werte dieser Spalte sind editierbar.  

##### **5.) Raum**

Wurde dieses Objekt bereits einem Raum zugeordnet, wird dies hier angezeigt. Auch dies dient u.a. der Filterung bei der Suche nach Objekten. Die Werte dieser Spalte sind editierbar. So können die Objekte noch nachträglich Räumen zugeordnet werden. Klickt man das Feld an, öffnet sich ein Popup mit den bisher angelegten Räumen. [![iobroker_admin_objekte_rooms](img/ioBroker_Admin_Objekte_Rooms.jpg)](img/ioBroker_Admin_Objekte_Rooms.jpg)

##### **6.) Funktion**

Diese Spalte enthält das Gewerk, dem das entsprechende Objekt zugeordnet ist. Die Werte dieser Spalte sind editierbar. So können die Objekte noch nachträglich Gewerken zugeordnet werden. Klickt man das Feld an, öffnet sich ein Popup mit den bisher angelegten Gewerken.  

##### **7.) Wert**

Handelt es sich bei dem Objekt um einen Datenpunkt, wird hier der aktuelle Wert dieses Datenpunktes angezeigt.  

##### **8.) sonstiges**

Klickt man das Bleistift-Icon an öffnet sich ein Fenster mit den Eigenschaften dieses Objekts. Es ist das gleiche Fenster das oben bereits beim Anlegen eines neuen Objekts erschienen ist. Hier können Eigenschaften des Objekts geändert werden. Diese Funktion ist mit äusserster Vorsicht zu benutzen und nur, wenn man genau weiß was man damit bewirkt. Der Klick auf das Mülleimer-Icon löscht dieses Objekt und **alle** in der Hierarchie darunterliegenden Objekte auch. Zur Sicherheit erscheint ein Fenster, in dem die Löschung noch einmal bestätigt werden muss. ![iobroker_admin_objekte_delete](http://www.iobroker.net/wp-content/uploads//ioBroker_Admin_Objekte_delete.jpg) Das Zahnrad-Icon erscheint nur, wenn mindestens eine History-Instanz installiert ist (History, InfluxDB oder SQL). Hier kann der Datenpunkt für das Loggen der historischen Daten konfiguriert werden. Nähere Informationen dazu finden sich in der Beschreibung des [History-Adapters](http://www.iobroker.net/?page_id=144&lang=de). Über das Zahnrad in der Titelzeile kann diese Aktion zeitgleich für alle Datenpunkte durchgeführt werden, die den aktuellen Filterkriterien entsprechen. Es ist daher sorgsam zu prüfen, ob die Filterkriterien dieser Seite so ausgewählt sind, dass auch nur die gewünschten Datenpunkte dabei sind. Das Pulldownmenü zum Filtern dieser Spalte bezieht sich auf Datenpunkte mit geloggten Daten. Hier stehen _mit_, _ohne_ und _alle_ zur Verfügung.    

### Zustände

In diesem Reiter werden die aktuellen Zustände von allen Datenpunkten angezeigt. Die Werte können auch geändert werden. [![iobroker_admin_states_columns](img/ioBroker_Admin_States_columns.jpg)](img/ioBroker_Admin_States_columns.jpg)

#### Der Seiteninhalt

Auf der Seite werden die vorhandenen Objekte tabellarisch dargestellt. Die Spalten können durch Anklicken der Spaltenköpfe nach den Inhalten der entsprechenden Spalten alphabetisch auf- oder absteigend sortiert werden (Toggle-Funktion). Die Felder darunter dienen der Filterung der Datenpunkte nach eigenen Kriterien. Die Tabelle besteht aus folgenden Spalten:  

##### **1.) ID**

Dies ist der eindeutige Name des entsprechenden Datenpunktes, gemäß der Struktur bestehend aus z.B. Name des Adapters.Nummer der Instanz.Gerätename.Kanalname.Datenpunktname.  

##### **2.) Eltern Name**

Der selbe Inhalt wie in Spalte 3 Name.  

##### **3.) Name**

Der Name des Datenpunktes. Dies kann ein automatisch generierter oder ein manuell vergebener Name sein, der verständlicher ist. Dieser Name muss nicht eindeutig sein.  

##### **4.) Wert**

Hier wird der aktuelle Wert des Datenpunktes angegeben. Dieser Wert ist editierbar  

##### **5.) Bestätigt**

Wurde dieser Wert geändert und dieses vom System übernommen ist der Wert _true_, ansonsten _false._  

##### **6.) Quelle**

Hier wird angegeben, welche Instanz die letzte Änderung des Datenpunktes durchgeführt hat.  

##### **7.) Zeit**

Dies ist der Zeitstempel zu dem der Datenpunkt zuletzt aktualisiert wurde.  

##### **8.) geändert**

Dies ist der Zeitstempel zu dem sich der Wert des Datenpunktes zuletzt geändert hat.    

#### Der Seitenfuß

Im Seitenfuß gibt es noch ein paar Informationen [![iobroker_admin_states_footer](img/ioBroker_Admin_States_footer.jpg)](img/ioBroker_Admin_States_footer.jpg)  

##### **1.) neu laden**

Dieses Icon kann angeklickt werden um die Tabelle auf den neuesten Stand zu bringen.  

##### **2.) Seiteninformationen**

Der Info-Block in der Mitte des Seitenfußes gibt zum einen mit dem Pulldownmenü die Möglichkeit die Zeilen pro Seite einzustellen. Zur Verfügung stehen 20, 100, 200, 500 und 1000 Zeilen pro Seite. Weiterhin gibt es hier die Information wieviele Seiten es insgesamt gibt, sowie die Möglichkeit mit den Pfeil-Icons die Seiten vor oder zurück zu blättern.  

##### **3.) Datenpunktinformation**

Diese Information gibt die Gesamtanzahl der existierenden Datenpunkte an sowie den davon auf der aktuellen Seite angezeigten Bereich.      

### Ereignisse

In diesem Reiter werden die aktuellen Ereignisse von allen Datenpunkten angezeigt. Die Erneuerung der Anzeige kann angehalten werden. [![iobroker_adapter_admin_ereignisse_spalten](img/ioBroker_Adapter_admin_Ereignisse_Spalten.jpg)](img/ioBroker_Adapter_admin_Ereignisse_Spalten.jpg)

#### Der Seiteninhalt

Auf der Seite werden die aktuellen Änderungen der Datenpunkte tabellarisch dargestellt. die neuesten Änderungen befinden sich am oberen Tabellenende. Mithilfe des Pause Buttons (8) kann die Aktualisierung der Seite angehalten werden.     Die Tabelle besteht aus folgenden Spalten:

##### **1.) Typ (Filterfeld)**

Dies ist der die Angabe über den Typ der Änderung. Dies kann entweder eine Änderung des Wertes sein (StateChange) oder eine Information (message)  

##### **2.) id (Filterfeld)**

Dies ist der eindeutige Name des entsprechenden Datenpunktes, gemäß der Struktur bestehend aus z.B. Name des Adapters.Nummer der Instanz.Gerätename.Kanalname.Datenpunktname. 

##### **3.) Wert (Filterfeld)**

Hier wird der aktuelle Wert des Datenpunktes angegeben.  

##### **4.) Bestätigt ****(Filterfeld)**

Wurde dieser Wert geändert und dieses vom System übernommen ist der Wert _true_, ansonsten _false._  

##### **5.) Quelle ****(Filterfeld)**

Hier wird angegeben, welche Instanz die letzte Änderung des Datenpunktes durchgeführt hat.  

##### **6.) Zeit** **(Filterfeld)**

Dies ist der Zeitstempel zu dem der Datenpunkt zuletzt aktualisiert wurde.  

##### **7.) geändert ****(Filterfeld)**

Dies ist der Zeitstempel zu dem sich der Wert des Datenpunktes zuletzt geändert hat.  

##### **8.) Pause**

Hält die Aktualisierung der Seite an.  Anstelle des Pausebuttons werden dann die nicht angezeigten Aktualisierungen hochgezählt.  

##### **9.) Löschen**

Mit dem Button wird die aktuelle Seite geleert.    

### Gruppen

Hier können durch den Klick auf das (+) am unteren linken Bildrand Usergruppen mit unterschiedlichen Rechten angelegt werden. [![iobroker_adapter_admin_user_02](img/ioBroker_Adapter_admin_User_02.jpg)](img/ioBroker_Adapter_admin_User_02.jpg)  

#### Der Seiteninhalt

Auf der Seite werden die vorhandenen Gruppen tabellarisch dargestellt. Die Felder in den Spaltenköpfen dienen der Filterung der Tabelle nach eigenen Kriterien.   Die Tabelle besteht aus folgenden Spalten:

##### **1.) ID**

Dies ist der eindeutige Name der jeweiligen Gruppe, gemäß der Struktur bestehend aus sytem.group.Gruppenname.  

##### **2.) Name**

Der Name der Gruppe. Dieser Name ist frei wählbar. Dieser Name muss eindeutig sein.  

##### **3.) Beschreibung**

Hier kann eine Beschreibung hinzugefügt werden, die z.B. auf die Rechte in dieser Gruppe verweist.  

##### **4.) Benutzer**

Hier werden die in dem Reiter **_Benutzer_** angelegten Benutzer angezeigt und können über eine Checkbox der angewählten Gruppe zugeordnet werden.  

##### **5.) Rechte anpassen**

Beim Anklicken des Bleistiftsymbols öffnet sich ein weiteres Fenster, in dem die Rechte dieser Gruppe angepasst werden können. [![iobroker_adapter_admin_user_rechte_01](img/ioBroker_Adapter_admin_User_Rechte_01.jpg)](img/ioBroker_Adapter_admin_User_Rechte_01.jpg)  

##### **6.) Neue Gruppe erzeugen**

Mit diesem Icon kann eine neue Gruppe erzeugt werden, die über die bisherigen Punkte konfiguriert wird.      

### Benutzer

Hier können Benutzer angelegt werden. Dazu links unten auf das (+) klicken. Standardmäßig ist der Administrator angelegt. [![iobroker_adapter_admin_user_01](img/ioBroker_Adapter_admin_User_01-1.jpg)](img/ioBroker_Adapter_admin_User_01-1.jpg)  

#### Der Seiteninhalt

Auf der Seite werden die vorhandenen Benutzer tabellarisch dargestellt. Die Felder in den Spaltenköpfen dienen der Filterung der Tabelle nach eigenen Kriterien. Die Tabelle besteht aus folgenden Spalten:  

##### **1.) ID**

Dies ist der eindeutige Name des jeweiligen Benutzers, gemäß der Struktur bestehend aus sytem.user.Benutzername.  

##### **2.) Name**

Der Name des Benutzers. Dieser Name ist frei wählbar. Dieser Name muss eindeutig sein.  

##### **3.) Aktiviert**

mit dieser Checkbox kann die Vefügbarkeit eines Benutzers aktiviert oder deaktiviert werden.  

##### **4.) Gruppen**

Hier werden die in dem Reiter **_Gruppen_** angelegten Gruppen angezeigt. Hier können über eine Checkbox die User den entsprechenden Gruppen zugeordnet werden.   [![iobroker_adapter_admin_user_groups](img/ioBroker_Adapter_admin_User_Groups.jpg)](img/ioBroker_Adapter_admin_User_Groups.jpg)  

##### **5.) Neuen Benutzer erzeugen**

Mit diesem Icon kann ein neuer Benutzer erzeugt werden, der anschließend einer bestehenden Gruppe zugeordnet werden muss.  

##### **6.) Bestehenden Benutzer bearbeiten**

Nach Anwählen eines bestehenden Benutzers in der Liste können mit diesem Icon die Daten dieses Benutzers bearbeitet werden.  

##### **7.) Bestehenden Benutzer löschen**

Mit dem Papierkorb-Icon kann ein bestehender Benutzer gelöscht werden, die bestehenden Gruppen bleiben erhalten.    

### Aufzählungen

Hier werden die Favoriten, Gewerke und Räume aus der Homematic-CCU aufgelistet. Es können auch eigene Aufzählungen angelegt werden, die dann z.B. in Scripts verwendet werden können. [![iobroker_adapter_admin_enums_01](img/ioBroker_Adapter_admin_Enums_01.jpg)](img/ioBroker_Adapter_admin_Enums_01.jpg)

#### Die Titelzeile

in der Titelzeile befinden sich Icons für die wichtigsten Vorgänge. Zu jedem Icon gibt es eine Kontexthilfe. Dazu einfach mit der Maus eine Weile auf dem Icon bleiben. [![iobroker_adapter_admin_enums_headers_01](img/ioBroker_Adapter_admin_Enums_Headers_01.jpg)](img/ioBroker_Adapter_admin_Enums_Headers_01.jpg)

#### **Die Icons im einzelnen:**

##### **1.) Ansicht aktualisieren**

Sollten gerade erst angelegte Aufzählungen nicht sichtbar sein, hilft ein Anklicken dieses Icons den Zustand der Seite auf den neuesten Stand zu bringen.  

##### **2.) Sortierung ändern**

Mit diesem Button wird die Sortierung der Objekte auf dieser Seite geändert. Bei aktivem Button sind alle Objekte alphabetisch sortiert. Ist dieser Button nicht aktiv, werden die Ojekte hierarchisch nach Aufzählungen in Baumstruktur angezeigt. Dann sind auch die nächsten beiden Icons sichtbar.

##### **3.) Alle Unterordner zuklappen**

##### **4.) Alle Unterordner aufklappen**

##### **5.) hinzufügen**

Nach Anwählen dieses Icons können weitere Aufzählungen in der Grundstruktur hinzugefügt werden. Elemente innerhalb der Ordnerstruktur werden über das (+) Icon rechts (#10) angelegt. Ein Konfigurationsfenster öffnet sich: [![iobroker_adapter_admin_enums_new](img/ioBroker_Adapter_admin_Enums_new.jpg)](img/ioBroker_Adapter_admin_Enums_new.jpg) Hier muss jetzt der Name für die neue Aufzählung ausgewählt werden, die erzeugte ID wird automatisch angepasst.  

#### Der Seiteninhalt

[![iobroker_adapter_admin_enums_headers_03](img/ioBroker_Adapter_admin_Enums_Headers_03.jpg)](img/ioBroker_Adapter_admin_Enums_Headers_03.jpg) Auf der Seite werden die vorhandenen Aufzählungen sowie ihre Mitglieder tabellarisch dargestellt. Die Tabelle besteht aus folgenden Spalten (Die Felder unter den Spaltenköpfen 6, 7 und 8 dienen als Filterkriterien). Die Tabelle im Bild ist nach Hierarchie geordnet und alle Unterpunkte (nodes) wurden aufgeklappt:  

##### **6.) ID**

Hier werden alle Mitglieder der Aufzählungen mit ihren IDs gelistet.Diese Bezeichnung kann durch Doppelklick oder Anklicken des zugehörigen Bleistift-Icons (#9) geändert werden. Die vollständige ID von Untergeordneten Strukturen beinhaltet jeweils vorangestellt ebenfalls die übergeordneten Ebenen.  

##### **7.) Name**

In dieser Spalte wird die Bezeichnung des Mitglieds angegeben. Diese Bezeichnung kann durch Doppelklick oder Anklicken des zugehörigen Bleistift-Icons (#9) geändert werden  

##### **8.) Mitglieder**

In dieser spalte werden die Mitglieder einer Aufzählung, bei zu vielen wird nur die Anzahl angezeigt. Fährt man mit der Maus über das Feld werden alle Mitglieder in einer Bubble Info angezeigt. Weitere Informationen erhält man über das Info Icon ganz rechts (#12)  

##### **9.) Bezeichnungen editieren**

Nach Anklicken dieses Icons kann man die Bezeichnungen in der Spalte ID und Name editieren. Dabei erscheinen an dieser Stelle ein ok-Button in Form eines Häkchens und ein Abbrechen-Icon in Form eines (x) 

##### **10.) Strukturelement hinzufügen**

Nach Anklicken dieses Icons öffnet sich ein Dialogfenster in dem ein neues Mitglied innerhalb der jeweiligen Struktur angelegt werden kann. [![iobroker_adapter_admin_enums_new_member](img/ioBroker_Adapter_admin_Enums_new_Member.jpg)](img/ioBroker_Adapter_admin_Enums_new_Member.jpg) Auch hier kann der Name individuell gewählt werden. Die zugehörige ID wird entsprechend der Struktur und des gewählten Namens automatisch erzeugt.  

##### **11.) Element löschen**

Mit dem Mülleimer-Icon wird das Element in dieser Zeile gelöscht  

##### **12.) Information**

Nach Anklicken dieses Icons wird ein weiteres Fenster mit erweiterten Informationen zu dem angewählten Element angezeigt. [![iobroker_adapter_admin_enums_info](img/ioBroker_Adapter_admin_Enums_Info.jpg)](img/ioBroker_Adapter_admin_Enums_Info.jpg)      

### hosts

Der Rechner, auf dem ioBroker installiert ist. Hier kann die aktuelle Version des js-Controllers upgedated werden. Liegt eine neue Version vor, erscheint die Beschriftung des Reiters in grüner Farbe.    

### log

Hier wird das log angezeigt Im Reiter Instanzen kann bei den einzelnen Instanzen der zu loggende Loglevel eingestellt werden. In dem Auswahlmenü wird der anzuzeigende Mindest-Loglevel ausgewählt. Sollte ein Error auftreten, erscheint die Beschriftung des Reiters in roter Farbe.       Nur nach Installation zusätzlicher Adapter:  

### Skripte

Dieser Reiter ist nur aktiv, wenn auch der javascript-Adapter installiert ist.    

### Node-red oder Webseiten anderer Adapter

Dieser Reiter ist nur sichtbar, wenn auch der entsprechende Adapter installiert ist (siehe nächster Punkt).  Systemweite Einstellungen, wie Sprache und Einheiten werden festgelegt.