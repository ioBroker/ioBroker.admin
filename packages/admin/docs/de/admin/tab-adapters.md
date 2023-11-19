# Der Reiter Adapter

Hier werden die verfügbaren und installierten Adapter angezeigt und verwaltet.

![iobroker_image_bpi_20160910](img/ioBroker_Image_BPi_20160910.jpg)

## Die Titelzeile

in der Titelzeile befinden sich Icons für die wichtigsten Vorgänge. 
Zu jedem Icon gibt es eine Kontexthilfe. Dazu einfach mit der Maus eine Weile auf dem Icon bleiben.

![iobroker_adapter_admin_002aa](img/tab-adapters_002aa.jpg)

### **Die Icons im einzelnen:**

![](img/tab-adapters_icons01_20170108-e1483882554815.jpg)

### **1.)  nur installierte Adapter anzeigen**

Bei Anwahl dieses Icons werden nur noch die bereits installierten Adapter angezeigt (Toggle-Funktion)

### **2.) Adapter mit Updates anzeigen**

Bei Anwahl dieses Icons werden nur noch Adapter angezeigt, zu denen ein Update vorliegt (Toggle-Funktion)

Hinter den updatefähigen Adaptern findet sich in der Spalte **_installiert_** ein Update-Icon. 
Durch Klick auf diesen Button wird der entsprechende Adapter auf die neueste Version gebracht.

Außerdem erscheint ein weiteres Icon in der Titelzeile:

![iobroker_adapter_admin_002b](img/tab-adapters_002b.jpg)

Durch Anklicken dieses Icons werden alle verfügbaren Adapter aktualisiert.

### **3.) Adapter aus eigener URL installieren**

Über das Octocat-Icon können Adapter aus eigenen Pfaden (URL oder Dateipfade) 
oder Vorabversionen von GitHub installiert werden.

Nach Anklicken dieses Icons öffnet sich ein entsprechendes Auswahlfenster:

![iobroker_adapter_admin_002c_github](img/tab-adapters_002c_GitHub.jpg)

Unter dem Reiter **_Von github_** wird einfach im Pulldownmenü der gewünschte 
Adapter ausgewählt und die neueste Vorabversion wird installiert.

Bei Anwahl des Reiters Beliebig kann ein bliebeiger Dateiupfad oder ein beliebiger 
URL (z.B. ein URL zu einem externen Adapterentwickler) in das Feld eingegeben werden und der entsprechende Adapter installiert werden.

![iobroker_adapter_admin_002c_ownfile](img/tab-adapters_002c_ownFile.jpg)

### **4.) Expertenmodus einschalten**

Der Expertenmodus ermöglicht es auch ältere Versionen eines Adapters zu installieren. 
Wenn dieser Button angewählt ist, erscheint ganz rechts zu jedem Adapter ein pulldownmenü (4) 
über das frühere Versionen installiert werden können. 

![](img/tab-adapters_icons02_20170108.jpg)

### **5.) Nach Updates suchen**

Bei jedem Neustart wird automatisch nach Updates gesucht. Über diesen Button kann man aber die Suche manuell anstoßen.

Wenn Updates in dem unter [Systemeinstellungen](#Systemeinstellungen) eingestellten 
Repository zur Verfügung stehen, wird die Schrift des Reiters **_Adapter_** in grüner Farbe dargestellt.

### **5.) Sortierung ändern**

Mit diesem Button wird die Sortierung der Adapter auf dieser Seite geändert.

Bei aktivem Button sind alle Adapter alphabetisch sortiert, wobei zuerst ein 
Block mit den installierten Adaptern, danach einer mit noch nicht installierten 
Adaptern angezeigt wird. Jeder dieser beiden Blöcke ist in sich alphabetisch sortiert.

Ist dieser Button nicht aktiv, werden die Adapter nach Themen sortiert.

Dann sind auch die nächsten beiden Icons sichtbar.

### **6.) Alle Themengebiete zuklappen**

### **7.) Alle Themengebiete aufklappen**

Auf der rechten Seite befinden sich auch noch zwei Buttons

![iobroker_adapter_admin_003a](img/tab-adapters_003a.jpg)

### **8.) Reiter editieren**

Mit diesem Button kann man nicht benötigte Reiter ausblenden und nicht sichtbare einblenden.

### **<a id="Systemeinstellungen"></a>9.) Systemeinstellungen**

Hier werden grundlegende Parameter für ioBroker eingestellt.

## Der Seiteninhalt

![iobroker_admin_adapter_inhalt01](img/tab-adapters_Inhalt01.jpg) Auf der Seite werden 
die Adapter tabellarisch dargestellt. Die Tabelle besteht aus folgenden Spalten:

### **1.) Name**

In dieser Spalte werden die Namen der Adapter mit den dazugehörigen Icons aufgeführt. 
Ist über das Icon (5) in der Titelzeile das Gruppieren von Adaptern angewählt erscheinen hier auch die Gruppennamen.

### **2.) Beschreibung**

Hier befindet sich eine kurze Beschreibung der Funktion des Adapters

### **3.) Schlüsselworte**

Hier sind einige Suchbegriffe aufgeführt, die mit dem Adapter assoziiert werden.

### **4.) Version**

Die verfügbare Version wird hier angezeigt. Zur Übersicht wird der Entwicklungsstand eines 
Adapters farblich hinterlegt. (rot = in Planung; gelb = Beta; orange = Alpha; grün = Final).

### **5.) installiert**

Diese Spalte gibt verschiedene Informationen über den Installationsstatus dieses Adapters. 
Zum einen steht dort die Versionsnummer des installierten Adapters. Ist diese fettgedruckt liegt ein 
Update vor. Dahinter steht in eckigen Klammern die Anzahl der von diesem Adapter installierten Instanzen, 
wie viele davon aktiviert sind und wie deren Status ist. So bedeutet [2/1], dass von diesem Adapter 
zwei Instanzen existieren, wovon eine aktiviert ist und ohne Probleme läuft (letzteres ist an der grünen 
Farbe der zweiten Zahl zu erkennen). Weiter rechts befindet sich ein Update-Icon wenn zu diesem Adapter 
ein Update vorliegt Adapter. Durch Anklicken dieses Icons wird der Updatevorgang gestartet.

### **6.) Plattform**

Hier wird angegeben auf welcher Softwareplattform dieser Adapter beruht. Üblicherweise ist dies 
javascript unter nodejs.

### **7.) Lizenz**

Dies ist die Lizenz unter der der Adapter zur Verfügung gestellt wird. Die Lizenzbedingungen 
finden sich üblicherweise im readme. Verlangt die Lizenz, dass sie vom Enduser akzepiert werden muss, 
wird ein entsprechendes Fenster mit den Lizenzbedingungen beim Erstellen einer Instanz angezeigt.

### **8.) Installieren**

In dieser Spalte befinden sich verschiedene Buttons für die Installation und für Hilfe. 

![](img/tab-adapters_icons02_20170108.jpg)

1.  (+) Hiermit wird eine Instanz des Adapters hinzugefügt. Diese muss im Reiter Instanzen noch konfiguriert und aktiviert werden. Bei den meisten Adaptern können beliebig viele Instanzen installiert werden, z.B. um unterschiedliche Hardware anzusprechen. Sollte dies nicht möglich sein, öffnrt sich ein Fenster mit einer entsprechenden Fehlermeldung.
2.  (?) Wenn dieser Button aktiv ist, verlinkt er zu der Hilfeseite zu dem Adapter. Diese befindet sich üblicherweise auf GitHub, wo auch der Adapter gepflegt wird.
3.  (Mülleimer) Dieser Button löscht den Adapter und alle bereits installierten Instanzen
4.  (Pulldownmenü) Über dieses Menü können frühere Versionen des jeweiligen Adapters installiert werden. Dieses Pulldownmenü ist nur im Expertenmodus sichtbar.