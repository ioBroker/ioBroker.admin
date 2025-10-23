# Der Reiter Zustände

In diesem Reiter werden die aktuellen Zustände von allen Datenpunkten angezeigt. 
Die Werte können auch geändert werden.

![iobroker_admin_states_columns](img/tab-states_columns.jpg)

## Der Seiteninhalt

Auf der Seite werden die vorhandenen Objekte tabellarisch dargestellt. 
Die Spalten können durch Anklicken der Spaltenköpfe nach den Inhalten der entsprechenden 
Spalten alphabetisch auf- oder absteigend sortiert werden (Toggle-Funktion). 
Die Felder darunter dienen der Filterung der Datenpunkte nach eigenen Kriterien.

Die Tabelle besteht aus folgenden Spalten:

### **1.) ID**

Dies ist der eindeutige Name des entsprechenden Datenpunktes, gemäß der Struktur 
bestehend aus z.B. Name des Adapters.Nummer der Instanz.Gerätename.Kanalname.Datenpunktname.

### **2.) Eltern Name**

Der selbe Inhalt wie in Spalte 3 Name.

### **3.) Name**

Der Name des Datenpunktes. Dies kann ein automatisch generierter oder ein manuell 
vergebener Name sein, der verständlicher ist. Dieser Name muss nicht eindeutig sein.

### **4.) Wert**

Hier wird der aktuelle Wert des Datenpunktes angegeben.

Dieser Wert ist editierbar

### **5.) Bestätigt**

Wurde dieser Wert geändert und dieses vom System übernommen ist der Wert _true_, ansonsten _false._

### **6.) Quelle**

Hier wird angegeben, welche Instanz die letzte Änderung des Datenpunktes durchgeführt hat.

### **7.) Zeit**

Dies ist der Zeitstempel zu dem der Datenpunkt zuletzt aktualisiert wurde.

### **8.) geändert**

Dies ist der Zeitstempel zu dem sich der Wert des Datenpunktes zuletzt geändert hat.

## Der Seitenfuß

Im Seitenfuß gibt es noch ein paar Informationen 

![iobroker_admin_states_footer](img/tab-states_footer.jpg)

### **1.) neu laden**

Dieses Icon kann angeklickt werden um die Tabelle auf den neuesten Stand zu bringen.

### **2.) Seiteninformationen**

Der Info-Block in der Mitte des Seitenfußes gibt zum einen mit dem Pulldownmenü die Möglichkeit die 
Zeilen pro Seite einzustellen. Zur Verfügung stehen 20, 100, 200, 500 und 1000 Zeilen pro Seite. 
Weiterhin gibt es hier die Information wieviele Seiten es insgesamt gibt, sowie die Möglichkeit 
mit den Pfeil-Icons die Seiten vor oder zurück zu blättern.

### **3.) Datenpunktinformation**

Diese Information gibt die Gesamtanzahl der existierenden Datenpunkte an sowie den davon auf der aktuellen Seite angezeigten Bereich.