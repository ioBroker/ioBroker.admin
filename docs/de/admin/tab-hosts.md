# Der Reiter Hosts

Hier werden die verfügbaren Hosts angezeigt.

Bei einem Standardsystem gibt es nur einen Host. Bei einem [Multihostsystem](http://www.iobroker.net/?page_id=3068&lang=de) entsprechend mehrere.

## Die Titelzeile

in der Titelzeile befinden sich Icons für die wichtigsten Vorgänge. Zu jedem Icon gibt es eine Kontexthilfe. Dazu einfach mit der Maus eine Weile auf dem Icon bleiben.

![](img/tab-hosts_Hosts_icons.jpg)

### **Die Icons im einzelnen:**

### **1.) Updates abrufen**

Um zu überprüfen, ob ein Update für den js-controller vorliegt kann man auf diesen Button klicken. Wenn ein Update vorliegt erscheint die Beschriftung des Reiters in grüner Schrift und in der Spalte _**verfügbar**_ wird die neue Version angezeigt.

### **2.) Filter**

Mit diesem Fled kann man die Liste der Hosts nach eigenen Wünschen filtern

## Der Seiteninhalt

Auf der Seite werden die vorhandenen Hosts tabellarisch dargestellt. 

![](img/tab-hosts_Hosts_01.jpg)

Die Tabelle besteht aus folgenden Spalten:

### **3.) Name**

Dies ist der eindeutige Name des jeweiligenHosts, der im Betriebssystem des Hosts festgelegt wurde. Dieser Name muss eindeutig sein.

### **4.) Restart Host**

Mit diesem Button kann der entsprechende Host neu gestartet werden. Der Klick darauf entspricht dem Befehl **_reboot_**.

### **5.) Typ**

Angabe auf welcher Engine der Host läuft.

### **6.) Titel**

vollständiger Name der Engine, üblicherweise ioBroker.js-controller

### **7.) Plattform**

Angabe der Softwarebasis auf der die Engine basiert.

### **8.) Betriebssystem**

Angabe des Betriebssystem das auf dem Host läuft.

### **9.) Verfügbar**

Angabe der neuesten verfügbaren Version der Engine

Sollte eine neuere Version der Engine vorliegen kann diese über die Konsole upgedated werden. 
Dieses sollte bei Verfügbarkeit immer als erstes durchgeführt werden, bevor mit dem Update der Adapter begonnen wird.

### **9.) Installiert**

Angabe der installierten Version der Engine