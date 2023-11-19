# Der Reiter Aufzählungen

Hier werden die Favoriten, Gewerke und Räume aus der Homematic-CCU aufgelistet. 
Es können auch eigene Aufzählungen angelegt werden, die dann z.B. in Scripts verwendet werden können.



![iobroker_adapter_admin_enums_01](img/tab-enums_Enums_01.jpg)

## Die Titelzeile

in der Titelzeile befinden sich Icons für die wichtigsten Vorgänge. 
Zu jedem Icon gibt es eine Kontexthilfe. Dazu einfach mit der Maus eine Weile auf dem Icon bleiben.

![iobroker_adapter_admin_enums_headers_01](img/ioBroker_Adapter_admin_Enums_Headers_01.jpg)

### **Die Icons im einzelnen:**

### **1.) Ansicht aktualisieren**

Sollten gerade erst angelegte Aufzählungen nicht sichtbar sein, 
hilft ein Anklicken dieses Icons den Zustand der Seite auf den neuesten Stand zu bringen.

### **2.) Sortierung ändern**

Mit diesem Button wird die Sortierung der Objekte auf dieser Seite geändert.

Bei aktivem Button sind alle Objekte alphabetisch sortiert. 
Ist dieser Button nicht aktiv, werden die Ojekte hierarchisch nach Aufzählungen in Baumstruktur angezeigt.

Dann sind auch die nächsten beiden Icons sichtbar.

### **3.) Alle Unterordner zuklappen**

### **4.) Alle Unterordner aufklappen**

### **5.) hinzufügen**

Nach Anwählen dieses Icons können weitere Aufzählungen in der Grundstruktur hinzugefügt werden. 
Elemente innerhalb der Ordnerstruktur werden über das (+) Icon rechts (#10) angelegt. 
Ein Konfigurationsfenster öffnet sich:

![iobroker_adapter_admin_enums_new](img/tab-enums_Enums_new.jpg)

Hier muss jetzt der Name für die neue Aufzählung ausgewählt werden, 
die erzeugte ID wird automatisch angepasst.

### Der Seiteninhalt

![iobroker_adapter_admin_enums_headers_03](img/tab-enums_Enums_Headers_03.jpg)

Auf der Seite werden die vorhandenen Aufzählungen sowie ihre Mitglieder tabellarisch dargestellt.

Die Tabelle besteht aus folgenden Spalten (Die Felder unter den Spaltenköpfen 6, 7 und 8 
dienen als Filterkriterien). Die Tabelle im Bild ist nach Hierarchie geordnet und alle Unterpunkte (nodes) wurden aufgeklappt:

### **6.) ID**

Hier werden alle Mitglieder der Aufzählungen mit ihren IDs gelistet.Diese Bezeichnung kann 
durch Doppelklick oder Anklicken des zugehörigen Bleistift-Icons (#9) geändert werden. 
Die vollständige ID von Untergeordneten Strukturen beinhaltet jeweils vorangestellt 
ebenfalls die übergeordneten Ebenen.

### **7.) Name**

In dieser Spalte wird die Bezeichnung des Mitglieds angegeben. Diese Bezeichnung kann 
durch Doppelklick oder Anklicken des zugehörigen Bleistift-Icons (#9) geändert werden.

### **8.) Mitglieder**

In dieser spalte werden die Mitglieder einer Aufzählung, bei zu vielen wird nur die Anzahl angezeigt. 
Fährt man mit der Maus über das Feld werden alle Mitglieder in einer Bubble Info angezeigt. 
Weitere Informationen erhält man über das Info Icon ganz rechts (#12)

### **9.) Bezeichnungen editieren**

Nach Anklicken dieses Icons kann man die Bezeichnungen in der Spalte ID und Name editieren. 
Dabei erscheinen an dieser Stelle ein ok-Button in Form eines Häkchens und ein Abbrechen-Icon in Form eines (x)

### **10.) Strukturelement hinzufügen**

Nach Anklicken dieses Icons öffnet sich ein Dialogfenster in dem ein neues Mitglied innerhalb 
der jeweiligen Struktur angelegt werden kann. 

![iobroker_adapter_admin_enums_new_member](img/tab-enums_Enums_new_Member.jpg) 

Auch hier kann der Name individuell gewählt werden. Die zugehörige ID wird entsprechend der Struktur und des gewählten Namens automatisch erzeugt.

### **11.) Element löschen**

Mit dem Mülleimer-Icon wird das Element in dieser Zeile gelöscht

### **12.) Information**

Nach Anklicken dieses Icons wird ein weiteres Fenster mit erweiterten Informationen zu dem angewählten Element angezeigt.

![iobroker_adapter_admin_enums_info](img/tab-enums_Enums_Info.jpg)