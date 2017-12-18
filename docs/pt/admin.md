## Descrição detalhada

O adaptador de administração é usado para configurar todas os adaptadores no ioBroker. Ele fornece uma interface web, que pode ser chamado sob o '<endereço IP do servidor>:8081`. Este adaptador é criado diretamente durante a instalação do ioBroker.

Pelo GUI do adaptador pode ser usada as seguintes funções:

* Instalação de adaptadores adicionais
* Acesso à visão geral dos objetos
* Acesso à visão geral dos estados dos objetos
* Acesso à administração de usuários e grupos
* Acesso ao arquivo de log
* Administração dos hosts

## Instalação

Este adaptador é criado diretamente durante a instalação do ioBroker. Uma instalação manual não é necessária

## Configuração

![adapter_admin_konfiguration](img/admin_konfiguration.png)

#### IP

Aqui é deve ser inserido o endereço IP sob o qual o adaptador pode ser alcançado. Várias opções Ipv4 e Ipv6 estão disponíveis.
<span style="color: #ff0000;">**O default é 0.0.0.0\. Isso não pode ser alterado!**</span>

#### Porta

Aqui é definida a porta sob a qual o administrador pode ser chamado. Se vários servidores da Web estiverem sendo executados no servidor, esta porta deve ser adaptada para que não haja problemas com portas duplicadas.

#### Criptografia

Se você quiser usar o protocolo seguro https, você deve marcar esta caixa.

#### Autenticação

Se você quiser que use uma autenticação, você deve marcar esta caixa.

## Funcionamento

Usando o navegador da Web, vá para a página a seguir:

`<Endereço IP do servidor>:8081`

## Abas

Na página principal do administrador existem várias abas. Na instalação básica, as abas são vistas como mostrado. Usando o ícone de lápis na parte superior direita (1), outras abas podem ser adicionadas ou retiradas.

![iobroker_adapter_admin_001a](img/admin_ioBroker_Adapter_Admin_001a.jpg)

Informações detalhadas são fornecidas nos links dos títulos.

### [Adaptador](admin/tab-adapters.md)

Aqui os adaptadores disponíveis podem ser instalados e gerenciados.

### [Instâncias](admin/tab-instances.md)

Aqui as instâncias já instaladas podem ser configuradas.

### [Objetos](admin/tab-objects.md)



### [Estados](admin/tab-states.md)

Os estados atuais dos objetos.

### [Eventos](admin/tab-events.md)

Uma lista de atualizações dos estados.

### [Grupos](admin/tab-groups.md)

Aqui você pode criar os grupos de usuários e controlar os direitos desse.

### [Usuários](admin/tab-users.md)

Aqui você pode criar os usuários e adicionar eles aos grupos existentes.

### [Enumerações](admin/tab-enums.md)

Aqui estão listados os favoritos, as kategorias e os quartos.

### [Hosts](admin/tab-hosts.md)

Informações sobre o computador onde ioBroker está instalado. Você pode aqui atualizar a versão do js-controler. Se uma nova versão estiver disponível, a aba aparece em verde.

### [Log](admin/tab-log.md)


### [Configurações do sistema](admin/tab-system.md)

![Configurações do administrador do sistema](img/admin_Systemeinstellungen.jpg)