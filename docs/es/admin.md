# Admin

El adaptador de administración se utiliza para configurar toda la instalación de ioBroker y todos sus adaptadores.
Proporciona una interfaz web, que puede abrirse mediante "http://<Dirección IP del servidor>:8081"
en el navegador web. Este adaptador se instala automáticamente junto con ioBroker.

## Configuración:

El cuadro de diálogo de configuración del adaptador "admin" proporciona los siguientes ajustes:
![img_002](img/admin_img_002.png)

**IP:** la dirección IP del servidor web "admin" se puede elegir aquí.
Se pueden seleccionar diferentes direcciones IPv4 e IPv6. El valor predeterminado es 0.0.0.0\.
Si cree que la configuración 0.0.0.0 no es válida, deje que permanezca allí, porque
es absolutamente valido Si cambia la dirección, podrá acceder al servidor web
Sólo a través de esta dirección. **Puerto:** Puede especificar el puerto del servidor web "admin".
Si hay más servidores web en la PC o dispositivo, el puerto debe personalizarse para evitar problemas
de una doble asignación de puertos. **Codificación:** habilite esta opción si se debe usar un protocolo https seguro.

**Autenticación:** Si desea la autenticación con inicio de sesión / contraseña, debe habilitar esta casilla de verificación.
La contraseña predeterminada para el usuario "admin" es "iobroker" **Buffer:** para acelerar la carga de las páginas habilite esta opción.
Normalmente solo el desarrollador quiere tener esta opción desactivada.

## Manejo:

La página principal del administrador consta de varias pestañas. **Adaptador:** Aquí las instancias de
Un adaptador puede ser instalado o eliminado. Con el botón de actualización.
![img_005](img/admin_img_005.png)
en la parte superior izquierda podemos obtener si las nuevas versiones de adaptadores están disponibles.
![img_001](img/admin_img_001.jpg)

Se muestran las versiones disponibles e instaladas del adaptador. Para una visión general del estado de la
el adaptador es de color (rojo = en planificación; naranja = alfa; amarillo = beta). Las actualizaciones a una nueva versión de
El adaptador se hace aquí también. Si hay una versión más reciente, las letras de la pestaña serán de color verde.
Si el icono de signo de interrogación en la última columna está activo, puede ir desde allí al sitio web con información del adaptador.
Los adaptadores disponibles están ordenados alfabéticamente. Las instancias ya instaladas están en la parte superior de la lista.

**Instancia:** Las instancias ya instaladas se enumeran aquí y pueden configurarse en consecuencia. Si el título de la
Las instancias están subrayadas, puede hacer clic en él y se abrirá el sitio web correspondiente.

![img_003](img/admin_img_003.png)

**Objetos:** los objetos gestionados (por ejemplo, configuración / variables / programas del hardware conectado)

![img_004](img/admin_img_004.png)

**Estados:** los estados actuales (valores de los objetos)
Si el historial del adaptador está instalado, puede registrar los puntos de datos elegidos.
Los puntos de datos registrados se seleccionan a la derecha y aparecen con un logotipo verde.

**Scripts:** esta pestaña solo está activa si el adaptador "javascript" está instalado.

**Nodo rojo:** esta pestaña solo es visible si el adaptador "nodo rojo" está instalado y habilitado.

**Hosts:** la computadora en la que está instalado ioBroker. Aquí se puede instalar la última versión de js-controller.
Si hay una nueva versión, las letras de la pestaña son verdes. Para buscar una nueva versión tienes que hacer clic en la actualización
Icono en la esquina inferior izquierda.

**Enumeración:** aquí se enumeran los favoritos, intercambios y espacios de la CCU.

**Usuarios:** Aquí los usuarios pueden ser agregados. Para ello haz clic en el (+). Por defecto hay un administrador.

**Grupos:** si hace clic en (+) en la parte inferior izquierda, puede crear grupos de usuarios. Desde el menú desplegable, los usuarios se asignan a los grupos.

**Evento:** Una lista de las actualizaciones en ejecución de las condiciones. **Registro:** aquí se muestra el registro En la instancia de la pestaña, el nivel de registro registrado
De la única instancia se puede configurar. En el menú de selección se selecciona el nivel de registro mínimo mostrado. Si se produce un error el
Las letras del registro aparecen en rojo.