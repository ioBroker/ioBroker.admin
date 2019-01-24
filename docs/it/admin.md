# Admin

L'adattatore di amministrazione viene utilizzato per configurare l'intera ioBroker-Installazione e tutti i suoi adattatori.
Fornisce un'interfaccia web, che può essere aperta da "http://<indirizzo IP del server>:8081"
nel browser web. Questo adattatore viene installato automaticamente insieme a ioBroker.

## Configurazione:

La finestra di configurazione dell'adattatore "admin" fornisce le seguenti impostazioni:
![Img_002](img/admin_img_002.png)

**IP:** l'indirizzo IP del server web "admin" può essere scelto qui.
È possibile selezionare diversi indirizzi IPv4 e IPv6. Il valore predefinito è 0.0.0.0\.
Se si pensa che 0.0.0.0 non è impostato, si prega di lasciarlo lì, perché esso
è assolutamente valido Se cambi l'indirizzo, sarai in grado di raggiungere il web-server
solo attraverso questo indirizzo **Porta:** È possibile specificare la porta del server web "admin".
Se sul PC o sul dispositivo sono presenti più server Web, la porta deve essere personalizzata per evitare problemi
di un'allocazione a doppia porta. **Coding:** abilita questa opzione se deve essere usato il protocollo sicuro https.

**Autenticazione:** Se si desidera l'autenticazione con login / password, è necessario abilitare questa casella di controllo.
La password predefinita per l'utente "admin" è "iobroker" **Buffer:** per accelerare il caricamento delle pagine abilitare questa opzione.
Normalmente solo lo sviluppatore vuole avere questa opzione deselezionata.

## Gestione:

La pagina principale dell'amministratore è composta da diverse schede. **Adattatore:** Qui le istanze di
un adattatore può essere installato o cancellato. Con il pulsante di aggiornamento
![Img_005](img/admin_img_005.png)
in alto a sinistra possiamo ottenere se sono disponibili le nuove versioni di adattatori.
![Img_001](img/admin_img_001.jpg)

Viene mostrata la versione disponibile e installata dell'adattatore. Per la vista generale lo stato del
l'adattatore è colorato (rosso = in pianificazione; arancione = alfa; giallo = beta). Gli aggiornamenti di una versione più recente di
anche l'adattatore è fatto qui. Se c'è una versione più recente il lettering della scheda sarà verde.
Se l'icona del punto interrogativo nell'ultima colonna è attiva, puoi andare da lì al sito web con le informazioni dell'adattatore.
L'adattatore disponibile è ordinato in ordine alfabetico. L'istanza già installata si trova nella parte superiore dell'elenco.

**Istanza:** L'istanza già installata è elencata qui e può essere configurata di conseguenza. Se il titolo del
l'istanza è sottolineata è possibile fare clic su di esso e il sito web corrispondente verrà aperto.

![Img_003](img/admin_img_003.png)

**Oggetti:** gli oggetti gestiti (ad esempio setup / variabili / programmi dell'hardware connesso)

![Img_004](img/admin_img_004.png)

**Stati:** gli stati attuali (valori degli oggetti)
Se è installata la cronologia dell'adattatore, è possibile registrare i punti dati scelti.
I punti dati registrati sono selezionati sulla destra e appaiono con un logo verde.

**Script:** questa scheda è attiva solo se è installato l'adattatore "javascript".

**Node-red:** questa scheda è visibile solo se l'adattatore "node-red" è installato e abilitato.

**Host:** il computer su cui è installato ioBroker. Qui può essere installata l'ultima versione di js-controller.
Se c'è una nuova versione, le lettere della scheda sono verdi. Per cercare una nuova versione devi fare clic sull'aggiornamento
icona nell'angolo in basso a sinistra.

**Enumerazione:** qui sono elencati i preferiti, gli scambi e gli spazi della CCU.

**Utenti:** qui gli utenti possono essere aggiunti. Per fare ciò clicca sul (+). Di default c'è un amministratore.

**Gruppi:** se fai clic sul (+) in basso a sinistra puoi creare gruppi di utenti. Dal menu a discesa gli utenti vengono assegnati ai gruppi.

**Evento:** Un elenco degli aggiornamenti in esecuzione delle condizioni. **Registro:** qui viene visualizzato il registro Nell'istanza della scheda il livello di registrazione registrato
della singola istanza può essere impostato. Nel menu di selezione viene selezionato il livello di registro minimo visualizzato. Se si verifica un errore il
la scritta del registro appare in rosso.