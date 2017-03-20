# Der Reiter Objekte

Unter diesem Reiter befinden sich alle verwalteten Objekte. Zu jeder Instanz wird hier ein Ordner angelegt in dem sich die von ihr angelegten Datenpunkte in einer hierarchischen Struktur befinden. Hier können Objekte auch manuell angelegt und gelöscht werden. Es können ganze Objektstrukturen hoch- oder runtergeladen werden. Ein weiterer Knopf ermöglicht die Anzeige der Expertenansicht.

<span style="line-height: 1.5; text-align: justify;"></span>

![iobroker_admin_objekte_inhalt00](img/tab-objects_Inhalt00.jpg)

## Die Titelzeile

in der Titelzeile befinden sich Icons für die wichtigsten Vorgänge. Zu jedem Icon gibt es eine Kontexthilfe. Dazu einfach mit der Maus eine Weile auf dem Icon bleiben.

![iobroker_admin_objekte_headline_icons](img/tab-objects_Headline_Icons.jpg)

### **Die Icons im einzelnen:**

### **1.) Ansicht aktualisieren**

Sollten gerade erst angelegte Objekte nicht sichtbar sein, hilft ein Anklicken dieses Icons den Zustand der Seite auf den neuesten Stand zu bringen.

### **2.) Sortierung ändern**

Mit diesem Button wird die Sortierung der Objekte auf dieser Seite geändert.

Bei aktivem Button sind alle Objekte alphabetisch sortiert. Ist dieser Button nicht aktiv, werden die Ojekte hierarchisch nach Instanzen sortiert.

Dann sind auch die nächsten beiden Icons sichtbar.

### **3.) Alle Themengebiete zuklappen**

### **4.) Alle Themengebiete aufklappen**

### **5.)  Administratormodus**

Bei Anwahl dieses Icons werden weitere Objekte angezeigt (Toggle-Funktion). Dieses sind die Datenpunkte des Systems.

### **6.) hinzufügen**

Nach Anwählen dieses Icons können weitere Objekte hinzugefügt werden. 
Ist ein Ordner angewählt wird dieser als _Parent_ in der Objektstruktur übernommen. 
Ein Konfigurationsfenster öffnet sich:

![iobroker_admin_objekte_addobject](img/tab-objects_AddObject.jpg)

Hier muss jetzt der Name für das neue Objekt ausgewählt werden, wobei als Typ 
gemäß der hierarchischen Struktur ein Gerät, ein Kanal oder ein Datenpunkt zur Verfügung steht. 
Als Datenpunkttypen stehen Logikwert, Schalter, Zeichenkette, Zahl, Werteliste, Feld, Objekt und gemischt zur Verfügung.

Sobald man das Eingabefenster mit ok bestätigt öffnet sich ein weiteres Fenster:

![iobroker_admin_objekte_addobjec02t](img/tab-objects_AddObjec02t.jpg)

Hier können noch einige Daten eingegeben werden. So kann dem Objekt eine Rolle und ein icon hinzugefügt werden.

Unter den anderen Reitern befinden sich noch weitere Eigenschaften des Objekts. 
So eine Information gibt es zu jedem Objekt.

### **7.) Upload**

Mit diesem Button wird eine komplette Objektstruktur als json-Datei auf den ioBroker Server hochgeladen

### **8.) Download**

Mit diesem Button wird die ausgewählte Objektstruktur als json-Datei vom ioBroker 
Server heruntergeladen und kann gespeichert werden.

## Der Seiteninhalt

![iobroker_admin_objekte_headline_columns](img/tab-objects_Headline_Columns.jpg)

Auf der Seite werden die vorhandenen Objekte tabellarisch dargestellt.

Die Tabelle besteht aus folgenden Spalten (Die Felder unter den Spaltenköpfen 1 und 2 
sowie die Pulldownmenüs der weiteren Spalten dienen als Filterkriterien). 
Die Tabelle im Bild ist nach Hierarchie geordnet und alle Unterpunkte (nodes) wurden aufgeklappt:

### **1.) ID**

Dieses sind die obersten Ebenen der Objekthierarchie. Hier werden als oberste Ebene z.B. 
der Name der Instanz, darunter die jeweilige Struktur der Daten angelegt.

### **2.) Name**

In dieser Spalte wird die Bezeichnung des Objekts angegeben. Zusätzlich wird durch ein 
vorangestelltes Icon gezeigt um welche Hierarchieebene es sich hier handelt (Gerät, Kanal oder Datenpunkt)

Die Werte dieser Spalte sind editierbar.

![iobroker_admin_objekte_structure01](img/tab-objects_Structure01.jpg)

### **3.) Typ**

Der Typ in der Hierarchieebene, der in der Spalte _Name_ bereits durch das vorangestellte Icon ersichtlich war, 
wird hier noch einmal explizit genannt. Über das Pulldownmenü im Spaltenkopf kann man Nach diesen 
Typen filtern und sich so z.B. nur alle Datenpunkte anzeigen lassen.

### 4.) Rolle

Die Rolle gibt an, wie User Interfaces wie .vis und mobile mit diesem Datenpunkt umgehen sollen. 
Dies ist im Prinzip die Funktion dieses Objekts kurz über einen Begriff beschrieben. 
Hiernach kann man wiederum filtern. Die Werte dieser Spalte sind editierbar.

### **5.) Raum**

Wurde dieses Objekt bereits einem Raum zugeordnet, wird dies hier angezeigt. 
Auch dies dient u.a. der Filterung bei der Suche nach Objekten. 
Die Werte dieser Spalte sind editierbar. So können die Objekte noch nachträglich Räumen zugeordnet werden. 
Klickt man das Feld an, öffnet sich ein Popup mit den bisher angelegten Räumen. 

![iobroker_admin_objekte_rooms](img/tab-objects_Rooms.jpg)

### **6.) Funktion**

Diese Spalte enthält das Gewerk, dem das entsprechende Objekt zugeordnet ist.

Die Werte dieser Spalte sind editierbar. So können die Objekte noch nachträglich 
Gewerken zugeordnet werden. Klickt man das Feld an, öffnet sich ein Popup mit den bisher angelegten Gewerken.

### **7.) Wert**

Handelt es sich bei dem Objekt um einen Datenpunkt, wird hier der aktuelle Wert dieses Datenpunktes angezeigt.

### **8.) sonstiges**

Klickt man das Bleistift-Icon an öffnet sich ein Fenster mit den Eigenschaften dieses Objekts. 
Es ist das gleiche Fenster das oben bereits beim Anlegen eines neuen Objekts erschienen ist.
Hier können Eigenschaften des Objekts geändert werden. Diese Funktion ist mit äusserster 
Vorsicht zu benutzen und nur, wenn man genau weiß was man damit bewirkt.

Der Klick auf das Mülleimer-Icon löscht dieses Objekt und **alle** in der 
Hierarchie darunterliegenden Objekte auch. Zur Sicherheit erscheint ein Fenster, 
in dem die Löschung noch einmal bestätigt werden muss.

![iobroker_admin_objekte_delete](img/tab-objects_delete.jpg)

Das Zahnrad-Icon erscheint nur, wenn mindestens eine History-Instanz installiert ist (History, InfluxDB oder SQL). 
Hier kann der Datenpunkt für das Loggen der historischen Daten konfiguriert werden. Nähere Informationen dazu 
finden sich in der Beschreibung des [History-Adapters](http://www.iobroker.net/?page_id=144&lang=de).

Über das Zahnrad in der Titelzeile kann diese Aktion zeitgleich für alle Datenpunkte durchgeführt werden, 
die den aktuellen Filterkriterien entsprechen. Es ist daher sorgsam zu prüfen, ob die Filterkriterien dieser 
Seite so ausgewählt sind, dass auch nur die gewünschten Datenpunkte dabei sind.

Das Pulldownmenü zum Filtern dieser Spalte bezieht sich auf Datenpunkte mit geloggten Daten. 
Hier stehen _mit_, _ohne_ und _alle_ sowie die installierten History-Instanzen zur Verfügung.