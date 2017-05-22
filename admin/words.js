systemDictionary = {
    "Admin adapter settings": {
        "en": "Admin adapter settings",
        "de": "Admin adapter Einstellungen",
        "ru": "Настройки драйвера Admin"
    },
    "Run as:":                {"en": "Run as:",                 "de": "Laufen als:",                    "ru": "Запустить от пользователя:"},
    "IP:":                    {"en": "IP:",                     "de": "IP:",                            "ru": "IP:"},
    "Port:":                  {"en": "Port:",                   "de": "Port:",                          "ru": "Порт:"},
    "Secure(HTTPS):":         {"en": "Secure(HTTPS):",          "de": "Verschlüsselung(HTTPS):",        "ru": "Шифрование(HTTPS):"},
    "Listen on all IPs":      {"en": "Listen on all IPs",       "de": "Auf allen IP Adressen hören",    "ru": "Слушать на всех адресах"},
    "Authentication:":        {"en": "Authentication:",         "de": "Authentifikation:",              "ru": "Аутентификация:"},
    "Cache:":                 {"en": "Cache:",                  "de": "Puffer:",                        "ru": "Кэш:"},
    "Public certificate:":    {"en": "Public certificate:",     "de": "Öffentliches Zertifikat:",       "ru": "'Public' сертификат:"},
    "Private certificate:":   {"en": "Private certificate:",    "de": "Privates Zertifikat:",           "ru": "'Private' сертификат:"},
    "Chained certificate:":   {"en": "Chained certificate:",    "de": "Kettenzertifikat:",              "ru": "'Chained' сертификат:"},
    "Set certificates or load it first in the system settings (right top).":    {
        "en": "Set certificates or load it first in the system settings (right top).",
        "de": "Setze Zertifikate oder installiere sie erst in den Systemeinstellungen (oben rechts).",
        "ru": "Нужно выбрать сертификаты или сначала загрузить их в системных настройках (вверху справа)."
    },
    "Auto update:":         {"en": "Updates check:",            "de": "Updates prüfen:",        "ru": "Проверка обновлений:"},
    "manually":             {"en": "manually",                  "de": "manuell",                "ru": "вручную"},
    "every 12 hours":       {"en": "every 12 hours",            "de": "alle 12 Stunden",        "ru": "каждые 12 часов"},
    "every day":            {"en": "every day",                 "de": "jeden Tag",              "ru": "каждый день"},
    "every 2 days":         {"en": "every 2 days",              "de": "alle 2 Tage",            "ru": "каждые 2 дня"},
    "every 3 days":         {"en": "every 3 days",              "de": "alle 3 Tage",            "ru": "каждые 3 дня"},
    "every week":           {"en": "every week",                "de": "jede Woche",             "ru": "каждую неделю"},
    "every 2 weeks":        {"en": "every 2 weeks",             "de": "alle 2 Wochen",          "ru": "каждые 2 недели"},
    "monthly":              {"en": "monthly",                   "de": "monatlich",              "ru": "раз в месяц"},
    "Login timeout(sec):":  {"en": "Login timeout(sec):",       "de": "Login Timeout(Sek):",    "ru": "Logout через(сек):"},
    "users permissions":    {"en": "users permissions",         "de": "Anwenderrechte",         "ru": "Права доступа"},
    "Let's Encrypt settings": {
        "en": "Let's Encrypt settings",
        "de": "Let's Encrypt Einstellungen",
        "ru": "Настройкт Let's Encrypt"
    },
    "Use Lets Encrypt certificates:": {
        "en": "Use Let's Encrypt certificates:",
        "de": "Let's Encrypt Zertifikate benutzen:",
        "ru": "Использовать сертификаты Let's Encrypt:"
    },
    "Use this instance for automatic update:": {
        "en": "Use this instance for automatic update:",
        "de": "Benutze diese Instanz für automatische Updates:",
        "ru": "Обновлять сертификаты в этом драйвере:"
    },
    "Port to check the domain:": {
        "en": "Port to check the domain:",
        "de": "Port um die Domain zu prüfen:",
        "ru": "Порт для проверки доменного имени:"
    },

    "tooltip_bind": {
        "en": "IP address, where the admin will run",
        "de": "IP Addresse, die vom Adminadapter benutzt wird",
        "ru": "IP Адрес интерфейса на котором будет запущен админ"
    },
    "tooltip_port": {
        "en": "Port for admin interface. It must be available. If running on linux with no root you cannot use ports below 1000.",
        "de": "Port für die Admin-Seite. Der Port muss frei sein. Unter Linux dürfen nicht root-Anwender nur die Ports über 1000 benutzen.",
        "ru": "Порт для интерфейса."
    },
    "tooltip_secure": {
        "en": "Enable SSL protocol. Admin will be available via https:// and not http://",
        "de": "SSL Verschlüsselung aktivieren. Admin-Oberfläche wird unter https:// und nicht mehr unter http:// erreichbar.",
        "ru": "Активировать протокол SSL. Сайт будет доступен по https:// , а не по http://"
    },
    "tooltip_certPublic": {
        "en": "Public certificate. Please manage it in the system configs.",
        "de": "Öffentliches Zertifikat. Bitte zuerst im Systemeinstellungs-Dialog konfigurieren.",
        "ru": "Публичный (public) сертификат. Настройте сначала сертификаты в системных настройках."
    },
    "tooltip_certPrivate": {
        "en": "Private certificate. Please manage it in the system configs.",
        "de": "Privates Zertifikat. Bitte zuerst im Systemeinstellungs-Dialog konfigurieren.",
        "ru": "Приватный (private) сертификат. Настройте сначала сертификаты в системных настройках."
    },
    "tooltip_certChained": {
        "en": "Chained certificate. Root certificate + Public certificate. Please manage it in the system configs.",
        "de": "Kettenzertifikat. Bitte zuerst im Systemeinstellungs-Dialog konfigurieren.",
        "ru": "Chained сертификат. Настройте сначала сертификаты в системных настройках."
    },
    "tooltip_auth": {
        "en": "Check login and password be access to the admin page. You can manage it on the users tab.",
        "de": "Prüfe Login und Kennwort beim öffnen. Man kann die Anwender im Benutzer-Reiter anlegen",
        "ru": "Активировать проверку имени и пароля."
    },
    "tooltip_ttl": {
        "en": "Login timeout. After this time the user will be automatically logger off.",
        "de": "Nach diese Zeit wird ein inaktiver Benutzer ausgeloggt.",
        "ru": "По прошествии этого времени при бездействии пользователь будет разлогинен."
    },
    "tooltip_cache": {
        "en": "Browser cache enabled.",
        "de": "Aktiviere den Browser-Cache.",
        "ru": "Активировать кеш браузера"
    },
    "tooltip_defaultUser": {
        "en": "Auto-login with this user",
        "de": "Auto-Login mit diesem Benutzer.",
        "ru": "Автоматический логин с этим пользователем."
    },
    "tooltip_autoUpdate": {
        "en": "Check adapter updates",
        "de": "Prüfe regelmässig auf Adapter-Updates",
        "ru": "Регулярно проверять на наличие обновлений драйверов"
    },
    "tooltip_leEnabled": {
        "en": "Use Let's Encrypt certificates",
        "de": "Benutze Let's Encrypt Zertifikate",
        "ru": "Использовать сертификаты Let's Encrypt"
    },
    "tooltip_leUpdate": {
        "en": "This instance will update Let's Encrypt certificates every 3 months",
        "de": "Benutze diese Instanz um die Let's Encrypt Zertifikate alle 3 Monate upzudaten.",
        "ru": "Обновлять в этой инстанции Let's Encrypt сертификаты раз в 3 месяца. Обновлять их может только одна инстанция"
    },
    "tooltip_lePort": {
        "en": "Port for challenge server. Let's Encrypt support only port 80, but with router you can use any port",
        "de": "Port für Challenge-Server. Let's Encrypt kann nur auf dem port 80 arbeiten. Bei bestimmten Einstellungen im Router, man kann den Server auf einem beliebigen Port betreiben.",
        "ru": "Порт для challenge сервера Let's Encrypt. Сервер должен быть доступен из интернета на порту 80"
    }
};
