# Administrator

Adapter administratora służy do konfigurowania całej instalacji ioBroker i wszystkich jej adapterów.
Udostępnia interfejs WWW, który można otworzyć za pomocą "http://<adres IP serwera>:8081"
w przeglądarce internetowej. Ten adapter jest automatycznie instalowany razem z programem ioBroker.

## Konfiguracja:

Okno konfiguracji adaptera "admin" zawiera następujące ustawienia:
![img_002](img/admin_img_002.png)

**IP:** tutaj można wybrać adres IP serwera "admin".
Można wybrać różne adresy IPv4 i IPv6. Domyślna wartość to 0.0.0.0\.
Jeśli uważasz, że 0.0.0.0 jest nieprawidłowym ustawieniem, niech pozostanie tam, ponieważ
jest absolutnie ważny. Jeśli zmienisz adres, będziesz mógł połączyć się z serwerem WWW
tylko przez ten adres. **Port:** Możesz określić port serwera "admin".
Jeśli na komputerze lub urządzeniu jest więcej serwerów internetowych, port musi być dostosowany, aby uniknąć problemów
podwójnego przydziału portów. **Kodowanie:** włącz tę opcję, jeśli ma być używany bezpieczny protokół https.

**Uwierzytelnienie:** Jeśli chcesz uwierzytelnianie za pomocą loginu / hasła, powinieneś włączyć to pole wyboru.
Domyślne hasło dla użytkownika "admin" to "iobroker" **Bufor:** aby przyspieszyć ładowanie stron włącz tę opcję.
Zwykle tylko programista chce, aby ta opcja była niezaznaczona.

## Obsługa:

Strona główna administratora składa się z kilku zakładek. **Adapter:** Tutaj występują instancje
Adaptery można instalować lub usuwać. Za pomocą przycisku aktualizacji
![img_005](img/admin_img_005.png)
w lewym górnym rogu możemy uzyskać dostęp do nowych wersji kart.
![img_001](img/admin_img_001.jpg)

Wyświetlane są dostępne i zainstalowane wersje adaptera. Ogólny widok stanu
adapter jest kolorowy (czerwony = w planowaniu, pomarańczowy = alfa, żółty = beta). Aktualizacje nowszej wersji
adapter jest tutaj również wykonany. Jeśli istnieje nowsza wersja, napis na karcie będzie zielony.
Jeśli ikona znaku zapytania w ostatniej kolumnie jest aktywna, możesz przejść stamtąd do strony internetowej z informacjami o adapterze.
Dostępny adapter sortuje się w kolejności alfabetycznej. Już zainstalowana instancja znajduje się w górnej części listy.

**Instancja:** Zainstalowana już instancja jest tutaj wymieniona i może być odpowiednio skonfigurowana. Jeśli tytuł
instancja jest podkreślona, ​​możesz ją kliknąć, a odpowiednia strona internetowa zostanie otwarta.

![img_003](img/admin_img_003.png)

**Obiekty:** zarządzane obiekty (na przykład ustawienia / zmienne / programy podłączonego sprzętu)

![img_004](img/admin_img_004.png)

**Stany:** bieżące stany (wartości obiektów)
Jeśli historia adaptera jest zainstalowana, możesz rejestrować wybrane punkty danych.
Zarejestrowane punkty danych wybierane są po prawej stronie i pojawiają się z zielonym logo. 

**Skrypty:** ta karta jest aktywna tylko wtedy, gdy zainstalowany jest adapter "javascript".

**Node-red:** ta karta jest widoczna tylko wtedy, gdy zainstalowano i włączono adapter "węzeł-czerwony".

**Hosty:** komputer, na którym jest zainstalowany ioBroker. Tutaj można zainstalować najnowszą wersję js-kontrolera.
Jeśli jest nowa wersja, litery na karcie są zielone. Aby wyszukać nową wersję, musisz kliknąć aktualizację
ikona w lewym dolnym rogu.

**Wyliczenie:** tutaj wymienione są ulubione, transakcje i spacje z CCU.

**Użytkownicy:** tutaj użytkownicy mogą zostać dodani. Aby to zrobić, kliknij przycisk (+). Domyślnie jest to administrator.

**Grupy:** jeśli klikniesz na (+) w lewym dolnym rogu możesz tworzyć grupy użytkowników. Z rozwijanego menu użytkownicy zostają przypisani do grup.

**Zdarzenie:** Lista bieżących aktualizacji warunków. **Log:** tutaj log jest wyświetlany W instancji tab logowany poziom logowania
pojedynczej instancji można ustawić. W menu wyboru jest wybrany wyświetlany minimalny poziom rejestrowania. Jeśli wystąpi błąd
litera logu pojawia się na czerwono.