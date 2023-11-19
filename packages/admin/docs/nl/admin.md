# Beheerder

De admin-adapter wordt gebruikt om de hele ioBroker-installatie en alle bijbehorende adapters te configureren.
Het biedt een webinterface die kan worden geopend met "http://<IP-adres van de server>:8081"
in de webbrowser. Deze adapter wordt automatisch geïnstalleerd samen met ioBroker.

## Configuratie:

Het configuratiedialoog van de adapter "admin" biedt de volgende instellingen:
![Img_002](img/admin_img_002.png)

**IP:** hier kan het IP-adres van de "admin" -webserver worden gekozen.
Verschillende IPv4- en IPv6-adressen kunnen worden geselecteerd. De standaardwaarde is 0.0.0.0\.
Als je denkt dat 0.0.0.0 een ongeldige instelling is, laat het dan alsjeblieft daar blijven, omdat het
is absoluut geldig. Als u het adres wijzigt, kunt u de webserver bereiken
alleen via dit adres. **Poort:** U kunt de poort van de "admin" -webserver opgeven.
Als er meer webservers op de pc of het apparaat staan, moet de poort worden aangepast om problemen te voorkomen
van een dubbele poorttoewijzing. **Codering:** schakel deze optie in als een beveiligd https-protocol moet worden gebruikt.

**Verificatie:** Als u de authenticatie met login / wachtwoord wilt, moet u dit selectievakje inschakelen.
Standaard wachtwoord voor gebruiker "admin" is "iobroker" **Buffer:** om het laden van de pagina's te versnellen, schakel deze optie in.
Normaal wil alleen de ontwikkelaar deze optie niet aangevinkt hebben.

## Afhandeling:

De hoofdpagina van de beheerder bestaat uit verschillende tabbladen. **Adapter:** Hier de instanties van
een adapter kan worden geïnstalleerd of verwijderd. Met de updateknop
![Img_005](img/admin_img_005.png)
in de linkerbovenhoek kunnen we krijgen als de nieuwe versies van adapters beschikbaar zijn.
![Img_001](img/admin_img_001.jpg)

De beschikbare en geïnstalleerde versies van de adapter worden getoond. Voor overzicht de staat van de
adapter is gekleurd (rood = in planning; oranje = alpha; geel = bèta). De updates voor een nieuwere versie van
de adapter is hier ook gemaakt. Als er een nieuwere versie is, zal het opschrift van het tabblad groen zijn.
Als het vraagtekenpictogram in de laatste kolom actief is, kunt u van daar naar de website gaan met informatie over de adapter.
De beschikbare adapter wordt in alfabetische volgorde gesorteerd. De reeds geïnstalleerde instantie staat in het bovenste gedeelte van de lijst.

**Exemplaar:** Het reeds geïnstalleerde exemplaar wordt hier weergegeven en kan dienovereenkomstig worden geconfigureerd. Als de titel van de
bijvoorbeeld zijn onderstreept, kunt u erop klikken en de bijbehorende website wordt geopend.

![Img_003](img/admin_img_003.png)

**Objecten:** de beheerde objecten (bijvoorbeeld setup / variabelen / programma's van de aangesloten hardware)

![Img_004](img/admin_img_004.png)

**Staten:** de huidige staten (waarden van de objecten)
Als de adaptergeschiedenis is geïnstalleerd, kunt u geselecteerde gegevenspunten registreren.
De geregistreerde gegevenspunten worden aan de rechterkant geselecteerd en verschijnen met een groen logo.

**Scripts:** dit tabblad is alleen actief als de "javascript" -adapter is geïnstalleerd.

**Node-rood:** dit tabblad is alleen zichtbaar als de "knoop-rode" adapter is geïnstalleerd en ingeschakeld.

**Hosts:** de computer waarop ioBroker is geïnstalleerd. Hier kan de nieuwste versie van js-controller worden geïnstalleerd.
Als er een nieuwe versie is, zijn de letters van het tabblad groen. Om naar een nieuwe versie te zoeken, moet u op de update klikken
pictogram in de linkerbenedenhoek.

**Opsomming:** hier worden de favorieten, transacties en spaties van de CCU weergegeven.

**Gebruikers:** hier kunnen de gebruikers worden toegevoegd. Klik hiervoor op de (+). Standaard is er een beheerder.

**Groepen:** als u op de (+) onderaan links klikt, kunt u gebruikersgroepen maken. In het vervolgkeuzemenu worden de gebruikers aan de groepen toegewezen.

**Event:** Een lijst met de lopende updates van de voorwaarden. **Logboek:** hier wordt het logboek weergegeven In het tabblad exemplaar het logboekniveau van het logboek
van het enkele exemplaar kan worden ingesteld. In het keuzemenu wordt het weergegeven minimale logniveau geselecteerd. Als er een fout optreedt, is de
letters van het log verschijnen in rood.