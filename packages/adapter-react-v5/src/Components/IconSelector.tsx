import React, { Component } from 'react';

import {
    Dialog,
    DialogTitle,
    DialogActions,
    DialogContent,
    Button,
    IconButton,
    TextField,
    Tooltip,
    CircularProgress,
} from '@mui/material';

import { Close as CloseIcon, Clear as ClearIcon } from '@mui/icons-material';

import { Icon } from './Icon';
import { Utils } from './Utils';
import devicesIcons from '../assets/devices.json';
import roomsIcons from '../assets/rooms.json';
import type { Translate } from '../types';

// import devices from '../assets/devices/list.json';
const devices: { _id: string; name: ioBroker.StringOrTranslated; icon: string }[] = [
    {
        _id: 'hood',
        name: {
            en: 'Hood',
            ru: 'Вытяжка',
            de: 'Abzugshaube',
            fr: 'Capot',
            it: 'Cappe',
            nl: 'Hood',
            pl: 'Okapy',
            pt: 'Hood',
            es: 'Campana',
            'zh-cn': '抽油烟机',
        },
        icon: 'Hoods.svg',
    },
    {
        _id: 'alarm_system',
        name: {
            en: 'Alarm System',
            ru: 'Сигнализация',
            de: 'Alarmanlage',
            fr: "Systèmes D'Alarme",
            it: 'Sistemi Di Allarme',
            nl: 'Alarm Systems',
            pl: 'Systemy Alarmowe',
            pt: 'Sistemas De Alarme',
            es: 'Sistemas De Alarma',
            'zh-cn': '报警系统',
        },
        icon: 'Alarm Systems.svg',
    },
    {
        _id: 'battery_status',
        name: {
            en: 'Battery Status',
            ru: 'Заряд батареи',
            de: 'Batteriestatus',
            fr: 'État De La Batterie',
            it: 'Stato Della Batteria',
            nl: 'Batterij Status',
            pl: 'Stan Baterii',
            pt: 'Estado Da Bateria',
            es: 'Estado De La Batería',
            'zh-cn': '电池状态',
        },
        icon: 'Battery Status.svg',
    },
    {
        _id: 'lighting',
        name: {
            en: 'Lighting',
            ru: 'Светильник',
            de: 'Beleuchtung',
            fr: 'Éclairages',
            it: 'Illuminazione',
            nl: 'Verlichting',
            pl: 'Oprawy Oświetleniowe',
            pt: 'Iluminações',
            es: 'Iluminaciones',
            'zh-cn': '照明',
        },
        icon: 'Lightings.svg',
    },
    {
        _id: 'shading',
        name: {
            en: 'Shading',
            ru: 'Затенение',
            de: 'Beschattungen',
            fr: 'Ombres',
            it: 'Ombreggiatura',
            nl: 'Shading',
            pl: 'Zacienienie',
            pt: 'Shading',
            es: 'Sombreado',
            'zh-cn': '底纹',
        },
        icon: 'Shading.svg',
    },
    {
        _id: 'irrigation',
        name: {
            en: 'Irrigation',
            ru: 'Орошение',
            de: 'Bewässerung',
            fr: 'Irrigation',
            it: 'Irrigazione',
            nl: 'Irrigatie',
            pl: 'Nawadnianie',
            pt: 'Irrigação',
            es: 'Irrigación',
            'zh-cn': '灌溉',
        },
        icon: 'Irrigation.svg',
    },
    {
        _id: 'iron',
        name: {
            en: 'Iron',
            ru: 'Утюг',
            de: 'Bügeleisen',
            fr: 'Le Fer',
            it: 'Ferro',
            nl: 'Ijzer',
            pl: 'Żelazo',
            pt: 'Ferro',
            es: 'Hierro',
            'zh-cn': '铁',
        },
        icon: 'Iron.svg',
    },
    {
        _id: 'computer',
        name: {
            en: 'Computer',
            ru: 'Компьютер',
            de: 'Rechner',
            fr: "L'Ordinateur",
            it: 'Computer',
            nl: 'Computer',
            pl: 'Komputer',
            pt: 'Computador',
            es: 'Ordenador',
            'zh-cn': '电脑',
        },
        icon: 'Computer.svg',
    },
    {
        _id: 'ceiling_spotlight',
        name: {
            en: 'Ceiling Spotlight',
            ru: 'Потолочный прожектор',
            de: 'Deckenspot',
            fr: 'Plafond Spotlight',
            it: 'Faretti A Soffitto',
            nl: 'Plafond Spotlight',
            pl: 'Reflektory Sufitowe',
            pt: 'Tecto Foco',
            es: 'Focos De Techo',
            'zh-cn': '天花射灯',
        },
        icon: 'Ceiling Spotlights.svg',
    },
    {
        _id: 'printer',
        name: {
            en: 'Printer',
            de: 'Drucker',
            ru: 'Принтер',
            pt: 'Impressora',
            nl: 'Printer',
            fr: 'Imprimante',
            it: 'Stampante',
            es: 'Impresora',
            pl: 'Drukarka',
            'zh-cn': '打印机',
        },
        icon: 'Printer.svg',
    },
    {
        _id: 'power_consumption',
        name: {
            en: 'Power Consumption',
            ru: 'Потребляемая мощность',
            de: 'Stromverbrauch',
            fr: "Consommation D'Énergie",
            it: 'Consumo Di Energia',
            nl: 'Energieverbruik',
            pl: 'Pobór Energii',
            pt: 'Consumo De Energia',
            es: 'El Consumo De Energía',
            'zh-cn': '能量消耗',
        },
        icon: 'Power Consumption.svg',
    },
    {
        _id: 'window',
        name: {
            en: 'Window',
            ru: 'Окно',
            de: 'Fenster',
            fr: 'La Fenêtre',
            it: 'Finestra',
            nl: 'Venster',
            pl: 'Okno',
            pt: 'Janela',
            es: 'Ventana',
            'zh-cn': '窗户',
        },
        icon: 'Window.svg',
    },
    {
        _id: 'garage_door',
        name: {
            en: 'Garage Door',
            ru: 'Гаражные Ворота',
            de: 'Garagentor',
            fr: 'Portes De Garage',
            it: 'Garage Door',
            nl: 'Garage Door',
            pl: 'Bramy Garażowe',
            pt: 'Portas De Garagem',
            es: 'Las Puertas De Garaje',
            'zh-cn': '车库门',
        },
        icon: 'Garage Doors.svg',
    },
    {
        _id: 'hairdryer',
        name: {
            en: 'Hairdryer',
            ru: 'Фен',
            de: 'Haartrockner',
            fr: 'Sèche-Cheveux',
            it: 'Asciugacapelli',
            nl: 'Haardroger',
            pl: 'Suszarka Do Włosów',
            pt: 'Secador De Cabelo',
            es: 'Secador De Pelo',
            'zh-cn': '电吹风',
        },
        icon: 'Hairdryer.svg',
    },
    {
        _id: 'hanging_lamp',
        name: {
            en: 'Hanging Lamp',
            ru: 'Подвесной светильник',
            de: 'Hängelampe',
            fr: 'Lampes Suspendues',
            it: 'Lampade A Sospensione',
            nl: 'Opknoping Lampen',
            pl: 'Lampy Wiszące',
            pt: 'Lâmpadas De Suspensão',
            es: 'Lámparas Colgantes',
            'zh-cn': '挂灯',
        },
        icon: 'Hanging Lamps.svg',
    },
    {
        _id: 'doorstep',
        name: {
            en: 'Enterance',
            ru: 'Входная дверь',
            de: 'Haustür',
            fr: 'Seuil De Porte',
            it: 'Gradino Della Porta',
            nl: 'Drempel',
            pl: 'Próg',
            pt: 'Porta',
            es: 'Peldaño',
            'zh-cn': '门阶',
        },
        icon: 'Doorstep.svg',
    },
    {
        _id: 'hot_water',
        name: {
            en: 'Hot Water',
            ru: 'Горячая вода',
            de: 'Heißwasser',
            fr: 'Eau Chaude',
            it: 'Acqua Calda',
            nl: 'Heet Water',
            pl: 'Gorąca Woda',
            pt: 'Água Quente',
            es: 'Agua Caliente',
            'zh-cn': '热水',
        },
        icon: 'Hot Water.svg',
    },
    {
        _id: 'heating',
        name: {
            en: 'Heating',
            ru: 'Отопление',
            de: 'Heizung',
            fr: 'Chauffe-Eau',
            it: 'Riscaldatore',
            nl: 'Verwarmer',
            pl: 'Podgrzewacz',
            pt: 'Aquecedor',
            es: 'Calentador',
            'zh-cn': '加热器',
        },
        icon: 'Heater.svg',
    },
    {
        _id: 'stove',
        name: {
            en: 'Stove',
            ru: 'Печь',
            de: 'Herd',
            fr: 'Le Fourneau',
            it: 'Stufa',
            nl: 'Fornuis',
            pl: 'Kuchenka',
            pt: 'Forno',
            es: 'Cocina',
            'zh-cn': '火炉',
        },
        icon: 'Stove.svg',
    },
    {
        _id: 'louvre',
        name: {
            en: 'Louvre',
            ru: 'Жалюзи',
            de: 'Jalousie',
            fr: 'Persienne',
            it: 'Persiana Di Ventilazione',
            nl: 'Louvre',
            pl: 'Żaluzja',
            pt: 'Trapeira',
            es: 'Lumbrera',
            'zh-cn': '卢浮宫',
        },
        icon: 'Louvre.svg',
    },
    {
        _id: 'coffee_maker',
        name: {
            en: 'Coffee Maker',
            ru: 'Кофеварка',
            de: 'Kaffemaschine',
            fr: 'Cafetière',
            it: 'Macchine Da Caffè',
            nl: 'Koffie Maker',
            pl: 'Ekspresy Do Kawy',
            pt: 'Cafeteira',
            es: 'Cafetera',
            'zh-cn': '咖啡壶',
        },
        icon: 'Coffee Makers.svg',
    },
    {
        _id: 'cold_water',
        name: {
            en: 'Cold Water',
            ru: 'Холодная вода',
            de: 'Kaltwasser',
            fr: 'Eau Froide',
            it: 'Acqua Fredda',
            nl: 'Koud Water',
            pl: 'Zimna Woda',
            pt: 'Água Fria',
            es: 'Agua Fría',
            'zh-cn': '冷水',
        },
        icon: 'Cold Water.svg',
    },
    {
        _id: 'climate',
        name: {
            en: 'Climate',
            ru: 'Климат',
            de: 'Klima',
            fr: 'Climat',
            it: 'Clima',
            nl: 'Klimaat',
            pl: 'Klimat',
            pt: 'Clima',
            es: 'Clima',
            'zh-cn': '气候',
        },
        icon: 'Climate.svg',
    },
    {
        _id: 'speaker',
        name: {
            en: 'Speaker',
            ru: 'Звуковая система',
            de: 'Lautsprecher',
            fr: 'Orateur',
            it: 'Altoparlante',
            nl: 'Spreker',
            pl: 'Głośnik',
            pt: 'Palestrante',
            es: 'Altavoz',
            'zh-cn': '扬声器',
        },
        icon: 'Speaker.svg',
    },
    {
        _id: 'led_strip',
        name: {
            en: 'Led Strip',
            ru: 'Светодиодная лента',
            de: 'LED Leiste',
            fr: 'Led Strip',
            it: 'Led Strip',
            nl: 'Loden Strip',
            pl: 'Pasek Ledowy',
            pt: 'Led Faixa',
            es: 'Tira Llevada',
            'zh-cn': '灯带',
        },
        icon: 'Led Strip.svg',
    },
    {
        _id: 'light',
        name: {
            en: 'Light',
            ru: 'Свет',
            de: 'Licht',
            fr: 'Lumière',
            it: 'Leggero',
            nl: 'Licht',
            pl: 'Lekki',
            pt: 'Luz',
            es: 'Luz',
            'zh-cn': '光',
        },
        icon: 'Light.svg',
    },
    {
        _id: 'fan',
        name: {
            en: 'Fan',
            ru: 'Вентилятор',
            de: 'Lüfter',
            fr: 'Ventilateur',
            it: 'Fan',
            nl: 'Ventilator',
            pl: 'Wentylator',
            pt: 'Ventilador',
            es: 'Ventilador',
            'zh-cn': '扇子',
        },
        icon: 'Fan.svg',
    },
    {
        _id: 'humidity',
        name: {
            en: 'Humidity',
            ru: 'Влажность',
            de: 'Luftfeuchtigkeit',
            fr: 'Humidité',
            it: 'Umidità',
            nl: 'Vochtigheid',
            pl: 'Wilgotność',
            pt: 'Umidade',
            es: 'Humedad',
            'zh-cn': '湿度',
        },
        icon: 'Humidity.svg',
    },
    {
        _id: 'ventilation',
        name: {
            en: 'Ventilation',
            ru: 'Вентиляция',
            de: 'Lüftung',
            fr: 'Ventilation',
            it: 'Ventilazione',
            nl: 'Ventilatie',
            pl: 'Wentylacja',
            pt: 'Ventilação',
            es: 'Ventilación',
            'zh-cn': '通风',
        },
        icon: 'Ventilation.svg',
    },
    {
        _id: 'chandelier',
        name: {
            en: 'Chandelier',
            ru: 'Люстра',
            de: 'Kronleuchter',
            fr: 'Lustre',
            it: 'Lampadario',
            nl: 'Kroonluchter',
            pl: 'Żyrandol',
            pt: 'Lustre',
            es: 'Candelabro',
            'zh-cn': '枝形吊灯',
        },
        icon: 'Chandelier.svg',
    },
    {
        _id: 'awning',
        name: {
            en: 'Awning',
            ru: 'Маркиза',
            de: 'Markise',
            fr: 'Auvents',
            it: 'Tende',
            nl: 'Luifels',
            pl: 'Okrycia',
            pt: 'Toldos',
            es: 'Toldos',
            'zh-cn': '遮阳篷',
        },
        icon: 'Awnings.svg',
    },
    {
        _id: 'music',
        name: {
            en: 'Music',
            ru: 'Музыка',
            de: 'Musik',
            fr: 'Musique',
            it: 'Musica',
            nl: 'Muziek',
            pl: 'Muzyka',
            pt: 'Música',
            es: 'Música',
            'zh-cn': '音乐',
        },
        icon: 'Music.svg',
    },
    {
        _id: 'people',
        name: {
            en: 'People',
            ru: 'Люди',
            de: 'Personen',
            fr: 'Gens',
            it: 'Persone',
            nl: 'Mensen',
            pl: 'Ludzie',
            pt: 'Pessoas',
            es: 'Personas',
            'zh-cn': '人们',
        },
        icon: 'People.svg',
    },
    {
        _id: 'pool',
        name: {
            en: 'Pool',
            ru: 'Бассейн',
            de: 'Pool',
            fr: 'Piscine',
            it: 'Piscina',
            nl: 'Zwembad',
            pl: 'Basen',
            pt: 'Piscina',
            es: 'Piscina',
            'zh-cn': '水池',
        },
        icon: 'Pool.svg',
    },
    {
        _id: 'pump',
        name: {
            en: 'Pump',
            ru: 'Насос',
            de: 'Pumpe',
            fr: 'Pompe',
            it: 'Pompa',
            nl: 'Pomp',
            pl: 'Pompa',
            pt: 'Bombear',
            es: 'Bomba',
            'zh-cn': '泵',
        },
        icon: 'Pump.svg',
    },
    {
        _id: 'outdoor_blinds',
        name: {
            en: 'Outdoor Blinds',
            ru: 'Внещгте жалюзи',
            de: 'Raffstore',
            fr: 'Volets',
            it: 'Tende Da Esterni',
            nl: 'Outdoor Blinds',
            pl: 'Rolety Zewnętrzne',
            pt: 'Estores Exteriores',
            es: 'Persianas Exteriores',
            'zh-cn': '室外百叶窗',
        },
        icon: 'Outdoor Blinds.svg',
    },
    {
        _id: 'mowing_machine',
        name: {
            en: 'Mowing Machine',
            ru: 'Газонокосилка',
            de: 'Rasenmäher',
            fr: 'Machine De Fauchage',
            it: 'Macchina Di Falciatura',
            nl: 'Maaimachine',
            pl: 'Kosiarka',
            pt: 'Roçada Máquina',
            es: 'Segadora',
            'zh-cn': '割草机',
        },
        icon: 'Mowing Machine.svg',
    },
    {
        _id: 'receiver',
        name: {
            en: 'Receiver',
            ru: 'Приставка',
            de: 'Receiver',
            fr: 'Destinataire',
            it: 'Ricevitore',
            nl: 'Ontvanger',
            pl: 'Odbiorca',
            pt: 'Recebedor',
            es: 'Receptor',
            'zh-cn': '接收者',
        },
        icon: 'Receiver.svg',
    },
    {
        _id: 'shutters',
        name: {
            en: 'Shutters',
            ru: 'Ставни',
            de: 'Rollladen',
            fr: 'Volets',
            it: 'Persiane',
            nl: 'Shutters',
            pl: 'Żaluzje',
            pt: 'Persianas',
            es: 'Persianas',
            'zh-cn': '百叶窗',
        },
        icon: 'Shutters.svg',
    },
    {
        _id: 'smoke_detector',
        name: {
            en: 'Smoke detector',
            de: 'Rauchmelder',
            ru: 'Детектор дыма',
            pt: 'Detector de fumaça',
            nl: 'Rookdetector',
            fr: 'Détecteur de fumée',
            it: 'Rilevatore di fumo',
            es: 'Detector de humo',
            pl: 'Wykrywacz dymu',
            'zh-cn': '烟雾探测器',
        },
        icon: 'SmokeDetector.svg',
    },
    {
        _id: 'lock',
        name: {
            en: 'Lock',
            ru: 'Замок',
            de: 'Schloß',
            fr: 'Fermer À Clé',
            it: 'Serratura',
            nl: 'Slot',
            pl: 'Zamek',
            pt: 'Trancar',
            es: 'Cerrar Con Llave',
            'zh-cn': '锁',
        },
        icon: 'Lock.svg',
    },
    {
        _id: 'security',
        name: {
            en: 'Security',
            ru: 'Безопасность',
            de: 'Sicherheit',
            fr: 'Sécurité',
            it: 'Sicurezza',
            nl: 'Veiligheid',
            pl: 'Bezpieczeństwo',
            pt: 'Segurança',
            es: 'Seguridad',
            'zh-cn': '安全',
        },
        icon: 'Security.svg',
    },
    {
        _id: 'dishwasher',
        name: {
            en: 'Dishwasher',
            ru: 'Посудомоечная машина',
            de: 'Spülmaschine',
            fr: 'Lave-Vaisselles',
            it: 'Lavastoviglie',
            nl: 'Vaatwassers',
            pl: 'Zmywarki',
            pt: 'Máquinas De Lavar Louça',
            es: 'Lavaplatos',
            'zh-cn': '洗碗机',
        },
        icon: 'Dishwashers.svg',
    },
    {
        _id: 'vacuum_cleaner',
        name: {
            en: 'Vacuum Cleaner',
            ru: 'Пылесос',
            de: 'Staubsauger',
            fr: 'Aspirateur',
            it: 'Aspirapolvere',
            nl: 'Stofzuiger',
            pl: 'Odkurzacz',
            pt: 'Aspirador De Pó',
            es: 'Aspiradora',
            'zh-cn': '吸尘器',
        },
        icon: 'Vacuum Cleaner.svg',
    },
    {
        _id: 'socket',
        name: {
            en: 'Socket',
            ru: 'Розетка',
            de: 'Steckdose',
            fr: 'Prise',
            it: 'Socket',
            nl: 'Socket',
            pl: 'Gniazdka',
            pt: 'Tomada',
            es: 'Zócalo',
            'zh-cn': '套接字',
        },
        icon: 'Sockets.svg',
    },
    {
        _id: 'floor_lamp',
        name: {
            en: 'Floor Lamp',
            ru: 'Торшер',
            de: 'Stehlampe',
            fr: 'Lampes Pour Plancher',
            it: 'Lampade A Stelo',
            nl: 'Vloerlampen',
            pl: 'Lampy Podłogowe',
            pt: 'Lâmpadas Chão',
            es: 'Lámparas De Pie',
            'zh-cn': '落地灯',
        },
        icon: 'Floor Lamps.svg',
    },
    {
        _id: 'power_consumption',
        name: {
            en: 'Power Consumption',
            ru: 'Потребляемая мощность',
            de: 'Stromverbrauch',
            fr: "Consommation D'Énergie",
            it: 'Consumo Di Energia',
            nl: 'Energieverbruik',
            pl: 'Pobór Energii',
            pt: 'Consumo De Energia',
            es: 'El Consumo De Energía',
            'zh-cn': '能量消耗',
        },
        icon: 'Power Consumption.svg',
    },
    {
        _id: 'temperature_sensor',
        name: {
            en: 'Temperature Sensor',
            ru: 'Температурный датчик',
            de: 'Temperatur-Sensor',
            fr: 'Capteur De Température',
            it: 'Sensori Di Temperatura',
            nl: 'Temperatuursensor',
            pl: 'Czujniki Temperatury',
            pt: 'Sensores De Temperatura',
            es: 'Sensores De Temperatura',
            'zh-cn': '温度传感器',
        },
        icon: 'Temperature Sensors.svg',
    },
    {
        _id: 'table_lamp',
        name: {
            en: 'Table Lamp',
            ru: 'Настольная лампа',
            de: 'Tischlampe',
            fr: 'Lampe De Chevet',
            it: 'Lampade Da Tavolo',
            nl: 'Tafellampen',
            pl: 'Lampy Stołowe',
            pt: 'Lâmpadas De Mesa',
            es: 'Lámparas De Mesa',
            'zh-cn': '台灯',
        },
        icon: 'Table Lamps.svg',
    },
    {
        _id: 'gate',
        name: {
            en: 'Gate',
            ru: 'Ворота',
            de: 'Tor',
            fr: 'Porte',
            it: 'Gate',
            nl: 'Gate',
            pl: 'Bramy',
            pt: 'Portões',
            es: 'Puertas',
            'zh-cn': '盖茨',
        },
        icon: 'Gates.svg',
    },
    {
        _id: 'dryer',
        name: {
            en: 'Dryer',
            ru: 'Сушилка',
            de: 'Trockner',
            fr: 'Séchoir',
            it: 'Asciugatrice',
            nl: 'Droger',
            pl: 'Suszarka',
            pt: 'Secador',
            es: 'Secadora',
            'zh-cn': '烘干机',
        },
        icon: 'Dryer.svg',
    },
    {
        _id: 'door',
        name: {
            en: 'Door',
            ru: 'Дверь',
            de: 'Tür',
            fr: 'Des Portes',
            it: 'Porte',
            nl: 'Deuren',
            pl: 'Drzwi',
            pt: 'Portas',
            es: 'Puertas',
            'zh-cn': '门',
        },
        icon: 'Doors.svg',
    },
    {
        _id: 'tv',
        name: {
            en: 'Tv',
            ru: 'Телевизор',
            de: 'TV',
            fr: 'La Télé',
            it: 'Tv',
            nl: 'Tv',
            pl: 'Telewizja',
            pt: 'Televisão',
            es: 'Televisor',
            'zh-cn': '电视',
        },
        icon: 'Tv.svg',
    },
    {
        _id: 'consumption',
        name: {
            en: 'Consumption',
            ru: 'Потребление',
            de: 'Verbrauch',
            fr: 'Consommation',
            it: 'Consumo',
            nl: 'Consumptie',
            pl: 'Konsumpcja',
            pt: 'Consumo',
            es: 'Consumo',
            'zh-cn': '消费',
        },
        icon: 'Consumption.svg',
    },
    {
        _id: 'amplifier',
        name: {
            en: 'Amplifier',
            ru: 'Усилитель звука',
            de: 'Verstärker',
            fr: 'Amplificateur',
            it: 'Amplificatore',
            nl: 'Versterker',
            pl: 'Wzmacniacz',
            pt: 'Amplificador',
            es: 'Amplificador',
            'zh-cn': '放大器',
        },
        icon: 'Amplifier.svg',
    },
    {
        _id: 'curtains',
        name: {
            en: 'Curtains',
            ru: 'Шторы',
            de: 'Vorhänge',
            fr: 'Des Rideaux',
            it: 'Le Tende',
            nl: 'Gordijnen',
            pl: 'Zasłony',
            pt: 'Cortinas',
            es: 'Cortinas',
            'zh-cn': '窗帘',
        },
        icon: 'Curtains.svg',
    },
    {
        _id: 'sconce',
        name: {
            en: 'Sconce',
            ru: 'Настенный светильник',
            de: 'Wandlampe',
            fr: 'Sconce',
            it: 'Sconce',
            nl: 'Sconce',
            pl: 'Kinkiety',
            pt: 'Arandelas',
            es: 'Los Apliques',
            'zh-cn': '壁灯',
        },
        icon: 'Sconces.svg',
    },
    {
        _id: 'washing_machine',
        name: {
            en: 'Washing Machine',
            ru: 'Стиральная машина',
            de: 'Waschmaschine',
            fr: 'Machines À Laver',
            it: 'Lavatrici',
            nl: 'Wasmachines',
            pl: 'Pralki',
            pt: 'Máquinas De Lavar Roupas',
            es: 'Lavadoras',
            'zh-cn': '洗衣机',
        },
        icon: 'Washing Machines.svg',
    },
    {
        _id: 'water',
        name: {
            en: 'Water',
            ru: 'Вода',
            de: 'Wasser',
            fr: "L'Eau",
            it: 'Acqua',
            nl: 'Water',
            pl: 'Woda',
            pt: 'Água',
            es: 'Agua',
            'zh-cn': '水',
        },
        icon: 'Water.svg',
    },
    {
        _id: 'water_heater',
        name: {
            en: 'Water Heater',
            ru: 'Нагреватель воды',
            de: 'Wasserkocher',
            fr: 'Chauffe-Eau',
            it: 'Scaldabagno',
            nl: 'Waterkoker',
            pl: 'Podgrzewacz Wody',
            pt: 'Aquecedor De Água',
            es: 'Calentador De Agua',
            'zh-cn': '热水器',
        },
        icon: 'Water Heater.svg',
    },
    {
        _id: 'water_consumption',
        name: {
            en: 'Water Consumption',
            ru: 'Потребление воды',
            de: 'Wasserverbrauch',
            fr: "Consommation D'Eau",
            it: "Consumo D'Acqua",
            nl: 'Waterverbruik',
            pl: 'Konsumpcja Wody',
            pt: 'Consumo De Água',
            es: 'Consumo De Agua',
            'zh-cn': '耗水量',
        },
        icon: 'Water Consumption.svg',
    },
    {
        _id: 'weather',
        name: {
            en: 'Weather',
            ru: 'Погода',
            de: 'Wetter',
            fr: 'La Météo',
            it: 'Tempo Metereologico',
            nl: 'Weer',
            pl: 'Pogoda',
            pt: 'Clima',
            es: 'Tiempo',
            'zh-cn': '天气',
        },
        icon: 'Weather.svg',
    },
];

// import rooms from '../assets/rooms/list.json';
const rooms: { _id: string; name: ioBroker.StringOrTranslated; icon: string }[] = [
    {
        _id: 'storeroom',
        name: {
            en: 'Storeroom',
            ru: 'Кладовая',
            de: 'Abstellraum',
            fr: 'Débarras',
            it: 'Dispensa',
            nl: 'Bergplaats',
            pl: 'Magazyn',
            pt: 'Despensa',
            es: 'Trastero',
            'zh-cn': '库房',
        },
        icon: 'Storeroom.svg',
    },
    {
        _id: 'second_floor',
        name: {
            en: 'Second floor',
            ru: 'Второй этаж',
            de: 'Erster OG',
            pt: 'Primeiro andar',
            nl: 'Eerste verdieping',
            fr: 'Premier étage',
            it: 'Primo piano',
            es: 'Primer piso',
            pl: 'Pierwsze piętro',
            'zh-cn': '第一层',
        },
        icon: 'Second Floor.svg',
    },
    {
        _id: 'dressing_room',
        name: {
            en: 'Dressing Room',
            ru: 'Гардеробная',
            de: 'Ankleide',
            fr: 'Vestiaire',
            it: 'Camerino',
            nl: 'Kleedkamer',
            pl: 'Przebieralnia',
            pt: 'Provador',
            es: 'Vestidor',
            'zh-cn': '更衣室',
        },
        icon: 'Dressing Room.svg',
    },
    {
        _id: 'workspace',
        name: {
            en: 'Workspace',
            ru: 'Рабочая Среда',
            de: 'Arbeitszimmer',
            fr: 'Espace De Travail',
            it: 'Area Di Lavoro',
            nl: 'Workspace',
            pl: 'Workspace',
            pt: 'Área De Trabalho',
            es: 'Espacio De Trabajo',
            'zh-cn': '工作区',
        },
        icon: 'Workspace.svg',
    },
    {
        _id: 'driveway',
        name: {
            en: 'Driveway',
            ru: 'Дорога',
            de: 'Auffahrt',
            fr: 'Allée',
            it: 'Viale',
            nl: 'Pad',
            pl: 'Podjazd',
            pt: 'Entrada Da Garagem',
            es: 'Entrada De Coches',
            'zh-cn': '车道',
        },
        icon: 'Driveway.svg',
    },
    {
        _id: 'outdoors',
        name: {
            en: 'Outdoors',
            ru: 'На Улице',
            de: 'Außenbereich',
            fr: 'En Plein Air',
            it: "All'Aperto",
            nl: 'Buitenshuis',
            pl: 'Na Dworze',
            pt: 'Ao Ar Livre',
            es: 'Al Aire Libre',
            'zh-cn': '户外',
        },
        icon: 'Outdoors.svg',
    },
    {
        _id: 'bathroom',
        name: {
            en: 'Bathroom',
            ru: 'Ванная Комната',
            de: 'Badezimmer',
            fr: 'Salle De Bains',
            it: 'Bagno',
            nl: 'Badkamer',
            pl: 'Łazienka',
            pt: 'Banheiro',
            es: 'Baño',
            'zh-cn': '浴室',
        },
        icon: 'Bathroom.svg',
    },
    {
        _id: 'balcony',
        name: {
            en: 'Balcony',
            ru: 'Балкон',
            de: 'Balkon',
            fr: 'Balcon',
            it: 'Balcone',
            nl: 'Balkon',
            pl: 'Balkon',
            pt: 'Sacada',
            es: 'Balcón',
            'zh-cn': '阳台',
        },
        icon: 'Balcony.svg',
    },
    {
        _id: 'office',
        name: {
            en: 'Office',
            ru: 'Офис',
            de: 'Office',
            fr: 'Bureau',
            it: 'Ufficio',
            nl: 'Kantoor',
            pl: 'Gabinet',
            pt: 'Escritório',
            es: 'Oficina',
            'zh-cn': '办公室',
        },
        icon: 'Office.svg',
    },
    {
        _id: 'carport',
        name: {
            en: 'Carport',
            ru: 'Навес',
            de: 'Carport',
            fr: 'Carport',
            it: 'Posto Auto Coperto',
            nl: 'Carport',
            pl: 'Wiata',
            pt: 'Telheiro',
            es: 'Cochera',
            'zh-cn': '车棚',
        },
        icon: 'Carport.svg',
    },
    {
        _id: 'attic',
        name: {
            en: 'Attic',
            ru: 'Чердак',
            de: 'Dachgeschoss',
            fr: 'Grenier',
            it: 'Attico',
            nl: 'Zolder',
            pl: 'Poddasze',
            pt: 'Sótão',
            es: 'Ático',
            'zh-cn': '阁楼',
        },
        icon: 'Attic.svg',
    },
    {
        _id: 'hall',
        name: {
            en: 'Hall',
            ru: 'Зал',
            de: 'Diele',
            fr: 'Salle',
            it: 'Sala',
            nl: 'Hal',
            pl: 'Sala',
            pt: 'Corredor',
            es: 'Sala',
            'zh-cn': '大厅',
        },
        icon: 'Hall.svg',
    },
    {
        _id: 'entrance',
        name: {
            en: 'Entrance',
            ru: 'Вход',
            de: 'Eingang',
            fr: 'Entrée',
            it: 'Ingresso',
            nl: 'Ingang',
            pl: 'Wejście',
            pt: 'Entrada',
            es: 'Entrada',
            'zh-cn': '入口',
        },
        icon: 'Entrance.svg',
    },
    {
        _id: 'ground_floor',
        name: {
            en: 'Ground Floor',
            ru: 'Первый Этаж',
            de: 'Erdgeschoss',
            fr: 'Rez-De-Chaussée',
            it: 'Piano Terra',
            nl: 'Begane Grond',
            pl: 'Parter',
            pt: 'Térreo',
            es: 'Planta Baja',
            'zh-cn': '一楼',
        },
        icon: 'Ground Floor.svg',
    },
    {
        _id: 'dining_area',
        name: {
            en: 'Dining Area',
            ru: 'Столовая',
            de: 'Essbereich',
            fr: 'Salle À Manger',
            it: 'Zona Pranzo',
            nl: 'Eethoek',
            pl: 'Jadalnia',
            pt: 'Área De Refeições',
            es: 'Comedor',
            'zh-cn': '用餐区',
        },
        icon: 'Dining Area.svg',
    },
    {
        _id: 'dining_room',
        name: {
            en: 'Dining Room',
            ru: 'Столовая',
            de: 'Esszimmer',
            fr: 'Salle À Manger',
            it: 'Sala Da Pranzo',
            nl: 'Eetkamer',
            pl: 'Jadalnia',
            pt: 'Sala De Jantar',
            es: 'Comedor',
            'zh-cn': '饭厅',
        },
        icon: 'Dining Room.svg',
    },
    {
        _id: 'gym',
        name: {
            en: 'Gym',
            ru: 'Спортзал',
            de: 'Fitnessraum',
            fr: 'Gym',
            it: 'Palestra',
            nl: 'Sportschool',
            pl: 'Siłownia',
            pt: 'Ginásio',
            es: 'Gimnasio',
            'zh-cn': '健身房',
        },
        icon: 'Gym.svg',
    },
    {
        _id: 'gallery',
        name: {
            en: 'Gallery',
            ru: 'Галерея',
            de: 'Galerie',
            fr: 'Galerie',
            it: 'Galleria',
            nl: 'Galerij',
            pl: 'Galeria',
            pt: 'Galeria',
            es: 'Galería',
            'zh-cn': '画廊',
        },
        icon: 'Gallery.svg',
    },
    {
        _id: 'garage',
        name: {
            en: 'Garage',
            ru: 'Гараж',
            de: 'Garage',
            fr: 'Garage',
            it: 'Box Auto',
            nl: 'Garage',
            pl: 'Garaż',
            pt: 'Garagem',
            es: 'Garaje',
            'zh-cn': '车库',
        },
        icon: 'Garage.svg',
    },
    {
        _id: 'wardrobe',
        name: {
            en: 'Wardrobe',
            ru: 'Гардероб',
            de: 'Garderobe',
            fr: 'Penderie',
            it: 'Armadio',
            nl: 'Garderobe',
            pl: 'Szafa',
            pt: 'Guarda Roupa',
            es: 'Armario',
            'zh-cn': '衣柜',
        },
        icon: 'Wardrobe.svg',
    },
    {
        _id: 'garden',
        name: {
            en: 'Garden',
            ru: 'Сад',
            de: 'Garten',
            fr: 'Jardin',
            it: 'Giardino',
            nl: 'Tuin',
            pl: 'Ogród',
            pt: 'Jardim',
            es: 'Jardín',
            'zh-cn': '花园',
        },
        icon: 'Garden.svg',
    },
    {
        _id: 'summer_house',
        name: {
            en: 'Summer House',
            ru: 'Дача',
            de: 'Gartenhaus',
            fr: "Maison D'Été",
            it: 'Casa Estiva',
            nl: 'Zomerhuis',
            pl: 'Domek Letniskowy',
            pt: 'Summer House',
            es: 'Casa De Verano',
            'zh-cn': '凉亭',
        },
        icon: 'Summer House.svg',
    },
    {
        _id: 'guest_bathroom',
        name: {
            en: 'Guest Bathroom',
            ru: 'Гостевая Комната',
            de: 'Gäste-WC',
            fr: 'Salle De Bains Invité',
            it: 'Guest Bathroom',
            nl: 'Gastenbadkamer',
            pl: 'Łazienka Gościnna',
            pt: 'Banheiro De Hóspedes',
            es: 'Baño De Visitas',
            'zh-cn': '客用浴室',
        },
        icon: 'Guest Bathroom.svg',
    },
    {
        _id: 'guest_room',
        name: {
            en: 'Guest Room',
            ru: 'Гостевая Комната',
            de: 'Gästezimmer',
            fr: "Chambre D'Amis",
            it: 'Stanza Degli Ospiti',
            nl: 'Guest Room',
            pl: 'Pokój Gościnny',
            pt: 'Quarto De Hóspedes',
            es: 'Habitación De Huéspedes',
            'zh-cn': '客房',
        },
        icon: 'Guest Room.svg',
    },
    {
        _id: 'laundry_room',
        name: {
            en: 'Laundry Room',
            ru: 'Прачечная',
            de: 'Hauswirtschaftsraum',
            fr: 'Buanderie',
            it: 'Lavanderia',
            nl: 'Wasruimte',
            pl: 'Pralnia',
            pt: 'Lavandaria',
            es: 'Cuarto De Lavado',
            'zh-cn': '洗衣房',
        },
        icon: 'Laundry Room.svg',
    },
    {
        _id: 'home_theater',
        name: {
            en: 'Home Theater',
            ru: 'Домашний Театр',
            de: 'Heimkino',
            fr: 'Cinéma Maison',
            it: 'Home Theater',
            nl: 'Thuisbioscoop',
            pl: 'Kino Domowe',
            pt: 'Cinema Em Casa',
            es: 'Cine En Casa',
            'zh-cn': '家庭电影院',
        },
        icon: 'Home Theater.svg',
    },
    {
        _id: 'boiler_room',
        name: {
            en: 'Boiler Room',
            ru: 'Бойлерная',
            de: 'Heizungsraum',
            fr: 'Chaufferie',
            it: 'Locale Caldaia',
            nl: 'Boiler Room',
            pl: 'Kotłownia',
            pt: 'Sala Da Caldeira',
            es: 'Sala De Calderas',
            'zh-cn': '锅炉房',
        },
        icon: 'Boiler Room.svg',
    },
    {
        _id: 'chamber',
        name: {
            en: 'Chamber',
            ru: 'Камера',
            de: 'Kammer',
            fr: 'Chambre',
            it: 'Camera',
            nl: 'Kamer',
            pl: 'Izba',
            pt: 'Câmara',
            es: 'Cámara',
            'zh-cn': '商会',
        },
        icon: 'Chamber.svg',
    },
    {
        _id: 'basement,_cellar',
        name: {
            en: 'Basement, Cellar',
            ru: 'Подвал, Погреб',
            de: 'Keller',
            fr: 'Sous-Sol, Cave',
            it: 'Taverna, Cantina',
            nl: 'Kelder, Kelder',
            pl: 'Piwnica, Piwnica',
            pt: 'Porão, Adega',
            es: 'Sótano, Bodega',
            'zh-cn': '地下室，地窖',
        },
        icon: 'Basement.svg',
    },
    {
        _id: 'nursery',
        name: {
            en: 'Nursery',
            ru: 'Питомник',
            de: 'Kinderzimmer',
            fr: 'Garderie',
            it: 'Asilo',
            nl: 'Kinderkamer',
            pl: 'Żłobek',
            pt: 'Berçário',
            es: 'Guardería',
            'zh-cn': '苗圃',
        },
        icon: 'Nursery.svg',
    },
    {
        _id: 'corridor',
        name: {
            en: 'Corridor',
            ru: 'Коридор',
            de: 'Korridor',
            fr: 'Couloir',
            it: 'Corridoio',
            nl: 'Gang',
            pl: 'Korytarz',
            pt: 'Corredor',
            es: 'Corredor',
            'zh-cn': '走廊',
        },
        icon: 'Corridor.svg',
    },
    {
        _id: 'kitchen',
        name: {
            en: 'Kitchen',
            ru: 'Кухня',
            de: 'Küche',
            fr: 'Cuisine',
            it: 'Cucina',
            nl: 'Keuken',
            pl: 'Kuchnia',
            pt: 'Cozinha',
            es: 'Cocina',
            'zh-cn': '厨房',
        },
        icon: 'Kitchen.svg',
    },
    {
        _id: 'upstairs',
        name: {
            en: 'Upstairs',
            ru: 'Вверх По Лестнице',
            de: 'Obergeschoss',
            fr: 'En Haut',
            it: 'Di Sopra',
            nl: 'Boven',
            pl: 'Na Górę',
            pt: 'Andar De Cima',
            es: 'Piso Superior',
            'zh-cn': '楼上',
        },
        icon: 'Upstairs.svg',
    },
    {
        _id: 'office',
        name: {
            en: 'Office',
            ru: 'Офис',
            de: 'Office',
            fr: 'Bureau',
            it: 'Ufficio',
            nl: 'Kantoor',
            pl: 'Gabinet',
            pt: 'Escritório',
            es: 'Oficina',
            'zh-cn': '办公室',
        },
        icon: 'Office.svg',
    },
    {
        _id: 'pool',
        name: {
            en: 'Pool',
            ru: 'Бассейн',
            de: 'Pool',
            fr: 'Piscine',
            it: 'Piscina',
            nl: 'Zwembad',
            pl: 'Basen',
            pt: 'Piscina',
            es: 'Piscina',
            'zh-cn': '水池',
        },
        icon: 'Pool.svg',
    },
    {
        _id: 'rear_wall',
        name: {
            en: 'Rear Wall',
            ru: 'Задняя Стенка',
            de: 'Rückwand',
            fr: 'Paroi Arrière',
            it: 'Parete Posteriore',
            nl: 'Achterwand',
            pl: 'Tylna Ściana',
            pt: 'Parede Traseira',
            es: 'Pared Posterior',
            'zh-cn': '后墙',
        },
        icon: 'Rear Wall.svg',
    },
    {
        _id: 'barn',
        name: {
            en: 'Barn',
            ru: 'Амбар',
            de: 'Scheune',
            fr: 'Grange',
            it: 'Fienile',
            nl: 'Schuur',
            pl: 'Stodoła',
            pt: 'Celeiro',
            es: 'Granero',
            'zh-cn': '谷仓',
        },
        icon: 'Barn.svg',
    },
    {
        _id: 'sleeping_area',
        name: {
            en: 'Sleeping Area',
            ru: 'Спальное Место',
            de: 'Schlafbereich',
            fr: 'Coin Montagne',
            it: 'Area Sleeping',
            nl: 'Sleeping Area',
            pl: 'Powierzchnia Spania',
            pt: 'Sleeping Area',
            es: 'Área De Dormir',
            'zh-cn': '睡眠区',
        },
        icon: 'Sleeping Area.svg',
    },
    {
        _id: 'bedroom',
        name: {
            en: 'Bedroom',
            ru: 'Спальная Комната',
            de: 'Schlafzimmer',
            fr: 'Chambre',
            it: 'Camera Da Letto',
            nl: 'Slaapkamer',
            pl: 'Sypialnia',
            pt: 'Quarto',
            es: 'Cuarto',
            'zh-cn': '卧室',
        },
        icon: 'Bedroom.svg',
    },
    {
        _id: 'shed',
        name: {
            en: 'Shed',
            ru: 'Сбрасывать',
            de: 'Schuppen',
            fr: 'Hangar',
            it: 'Capannone',
            nl: 'Schuur',
            pl: 'Budka',
            pt: 'Cabana',
            es: 'Cobertizo',
            'zh-cn': '棚',
        },
        icon: 'Shed.svg',
    },
    {
        _id: 'swimming_pool',
        name: {
            en: 'Swimming Pool',
            ru: 'Плавательный Бассейн',
            de: 'Schwimmbad',
            fr: 'Piscine',
            it: 'Piscina',
            nl: 'Zwembad',
            pl: 'Basen',
            pt: 'Piscina',
            es: 'Piscina',
            'zh-cn': '游泳池',
        },
        icon: 'Swimming Pool.svg',
    },
    {
        _id: 'dining',
        name: {
            en: 'Dining',
            ru: 'Обеденный',
            de: 'Speis',
            fr: 'À Manger',
            it: 'Cenare',
            nl: 'Dining',
            pl: 'Jadalnia',
            pt: 'Jantar',
            es: 'Comida',
            'zh-cn': '用餐',
        },
        icon: 'Dining.svg',
    },
    {
        _id: 'playroom',
        name: {
            en: 'Playroom',
            ru: 'Игровая Комната',
            de: 'Spielzimmer',
            fr: 'Salle De Jeux',
            it: 'Stanza Dei Giochi',
            nl: 'Speelkamer',
            pl: 'Pokój Zabaw',
            pt: 'Sala De Jogos',
            es: 'Cuarto De Jugar',
            'zh-cn': '游戏室',
        },
        icon: 'Playroom.svg',
    },
    {
        _id: 'stairway',
        name: {
            en: 'Stairway',
            ru: 'Лестница',
            de: 'Treppe',
            fr: 'Escalier',
            it: 'Scala',
            nl: 'Trap',
            pl: 'Klatka Schodowa',
            pt: 'Escada',
            es: 'Escalera',
            'zh-cn': '楼梯',
        },
        icon: 'Stairway.svg',
    },
    {
        _id: 'equipment_room',
        name: {
            en: 'Equipment Room',
            ru: 'Оборудование Номера',
            de: 'Technikraum',
            fr: "Salle D'Équipement",
            it: 'Stanza Degli Attrezzi',
            nl: 'Technische Ruimte',
            pl: 'Wyposażenie Pokoi',
            pt: 'Sala De Equipamentos',
            es: 'Cuarto De Equipos',
            'zh-cn': '机房',
        },
        icon: 'Equipment Room.svg',
    },
    {
        _id: 'terrace',
        name: {
            en: 'Terrace',
            ru: 'Терраса',
            de: 'Terrasse',
            fr: 'Terrasse',
            it: 'Terrazza',
            nl: 'Terras',
            pl: 'Taras',
            pt: 'Terraço',
            es: 'Terraza',
            'zh-cn': '阳台',
        },
        icon: 'Terrace.svg',
    },
    {
        _id: 'toilet',
        name: {
            en: 'Toilet',
            ru: 'Туалет',
            de: 'Toilette',
            fr: 'Toilette',
            it: 'Gabinetto',
            nl: 'Toilet',
            pl: 'Toaleta',
            pt: 'Banheiro',
            es: 'Inodoro',
            'zh-cn': '洗手间',
        },
        icon: 'Toilet.svg',
    },
    {
        _id: 'stairwell',
        name: {
            en: 'Stairwell',
            ru: 'Лестничная клетка',
            de: 'Treppenhaus',
            fr: "Cage D'Escalier",
            it: 'Tromba Delle Scale',
            nl: 'Trappenhuis',
            pl: 'Klatka Schodowa',
            pt: 'Caixa De Escada',
            es: 'Hueco De Escalera',
            'zh-cn': '楼梯间',
        },
        icon: 'Stairwell.svg',
    },
    {
        _id: 'locker_room',
        name: {
            en: 'Locker Room',
            ru: 'Камера Хранения',
            de: 'Umkleideraum',
            fr: 'Vestiaire',
            it: 'Spogliatoio',
            nl: 'Kleedkamer',
            pl: 'Szatnia',
            pt: 'Vestiário',
            es: 'Vestuario',
            'zh-cn': '更衣室',
        },
        icon: 'Locker Room.svg',
    },
    {
        _id: 'basement',
        name: {
            en: 'Basement',
            ru: 'Подвал',
            de: 'Untergeschoss',
            fr: 'Sous-Sol',
            it: 'Seminterrato',
            nl: 'Kelder',
            pl: 'Piwnica',
            pt: 'Porão',
            es: 'Sótano',
            'zh-cn': '地下室',
        },
        icon: 'Basement.svg',
    },
    {
        _id: 'front_yard',
        name: {
            en: 'Front Yard',
            ru: 'Передний Двор',
            de: 'Vorgarten',
            fr: 'Front Yard',
            it: 'Cortile',
            nl: 'Voortuin',
            pl: 'Podwórko',
            pt: 'Jardim Da Frente',
            es: 'Patio Delantero',
            'zh-cn': '前院',
        },
        icon: 'Front Yard.svg',
    },
    {
        _id: 'anteroom',
        name: {
            en: 'Anteroom',
            ru: 'Передняя',
            de: 'Vorraum',
            fr: 'Antichambre',
            it: 'Anticamera',
            nl: 'Voorkamer',
            pl: 'Przedpokój',
            pt: 'Ante-Sala',
            es: 'Antesala',
            'zh-cn': '接待室',
        },
        icon: 'Anteroom.svg',
    },
    {
        _id: 'washroom',
        name: {
            en: 'Washroom',
            ru: 'Уборная',
            de: 'Waschraum',
            fr: 'Toilettes',
            it: 'Bagno',
            nl: 'Waskamer',
            pl: 'Umywalnia',
            pt: 'Banheiro',
            es: 'Baño',
            'zh-cn': '卫生间',
        },
        icon: 'Washroom.svg',
    },
    {
        _id: 'wc',
        name: {
            en: 'Wc',
            ru: 'Туалет',
            de: 'WC',
            fr: 'Toilettes',
            it: 'Bagno',
            nl: 'Wc',
            pl: 'Toaleta',
            pt: 'Banheiro',
            es: 'Wc',
            'zh-cn': '厕所',
        },
        icon: 'Wc.svg',
    },
    {
        _id: 'workshop',
        name: {
            en: 'Workshop',
            ru: 'Мастерская',
            de: 'Werkstatt',
            fr: 'Atelier',
            it: 'Laboratorio',
            nl: 'Werkplaats',
            pl: 'Warsztat',
            pt: 'Oficina',
            es: 'Taller',
            'zh-cn': '作坊',
        },
        icon: 'Workshop.svg',
    },
    {
        _id: 'windscreen',
        name: {
            en: 'Windscreen',
            ru: 'Ветровое Стекло',
            de: 'Windfang',
            fr: 'Pare-Brise',
            it: 'Parabrezza',
            nl: 'Voorruit',
            pl: 'Szyba Przednia',
            pt: 'Pára-Brisas',
            es: 'Parabrisas',
            'zh-cn': '风档',
        },
        icon: 'Windscreen.svg',
    },
    {
        _id: 'living_area',
        name: {
            en: 'Living Area',
            ru: 'Жилая Площадь',
            de: 'Wohnbereich',
            fr: 'Salon',
            it: 'Zona Giorno',
            nl: 'Living Area',
            pl: 'Powierzchnia Mieszkalna',
            pt: 'Sala-De-Estar',
            es: 'Sala De Estar',
            'zh-cn': '生活区域',
        },
        icon: 'Living Area.svg',
    },
    {
        _id: 'living_room',
        name: {
            en: 'Living Room',
            ru: 'Гостинная',
            de: 'Wohnzimmer',
            fr: 'Le Salon',
            it: 'Soggiorno',
            nl: 'Woonkamer',
            pl: 'Salon',
            pt: 'Sala De Estar',
            es: 'Sala De Estar',
            'zh-cn': '客厅',
        },
        icon: 'Living Room.svg',
    },
    {
        _id: 'living_room',
        name: {
            en: 'Living Room',
            ru: 'Гостинная',
            de: 'Wohnzimmer',
            fr: 'Le Salon',
            it: 'Soggiorno',
            nl: 'Woonkamer',
            pl: 'Salon',
            pt: 'Sala De Estar',
            es: 'Sala De Estar',
            'zh-cn': '客厅',
        },
        icon: 'Living Room.svg',
    },
];

interface IconSelectorProps {
    icons?: {
        icon?: string;
        src?: string;
        href?: string;
        name?: ioBroker.StringOrTranslated;
        _id?: string;
    }[];
    onlyRooms?: boolean;
    onlyDevices?: boolean;
    onSelect?: (icon: string) => void; // one of onSelect or onChange are required
    onChange?: (icon: string) => void;
    t: Translate;
    lang: ioBroker.Languages;
}

interface IconSelectorState {
    opened: boolean;
    names: string[];
    filter: string;
    icons: string[] | null;
    loading: boolean;
    isAnyName: boolean;
}

export class IconSelector extends Component<IconSelectorProps, IconSelectorState> {
    constructor(props: IconSelectorProps) {
        super(props);

        this.state = {
            opened: false,
            names: [],
            filter: '',
            icons: null,
            loading: false,
            isAnyName: false,
        };
    }

    loadAllIcons(): void {
        if (this.state.loading || this.state.icons) {
            return;
        }
        this.setState({ loading: true }, () => {
            const icons: string[] = [];
            const names: string[] = [];

            if (!this.props.icons) {
                // load rooms
                let templates =
                    this.props.onlyRooms || (!this.props.onlyRooms && !this.props.onlyDevices) ? rooms : null;

                if (templates) {
                    templates.forEach(item => {
                        if (item.name && typeof item.name === 'object') {
                            item.name = item.name[this.props.lang] || item.name.en || item._id;
                        }
                        item.name = item.name || item._id;
                    });

                    templates = templates.filter(
                        (item, i) =>
                            !templates?.find(
                                (_item, _i) => i !== _i && _item.icon === item.icon && _item.name === item.name,
                            ),
                    );

                    templates.forEach((template, i) => {
                        names[i] = template.name as string;
                        icons[i] =
                            `data:image/svg+xml;base64,${(roomsIcons as Record<string, string>)[template.icon.replace(/\.svg$/, '')]}`;
                    });
                }

                // load devices
                templates =
                    this.props.onlyDevices || (!this.props.onlyRooms && !this.props.onlyDevices) ? devices : null;
                if (templates) {
                    const offset = icons.length;
                    templates &&
                        templates.forEach(item => {
                            if (item.name && typeof item.name === 'object') {
                                item.name = item.name[this.props.lang] || item.name.en || item._id;
                            }
                            item.name = item.name || item._id;
                        });

                    templates = templates.filter(
                        (item, i) =>
                            !templates?.find(
                                (_item, _i) => i !== _i && _item.icon === item.icon && _item.name === item.name,
                            ),
                    );

                    templates.forEach((template, i) => {
                        names[i + offset] = template.name as string;
                        icons[i + offset] =
                            `data:image/svg+xml;base64,${(devicesIcons as Record<string, string>)[template.icon.replace(/\.svg$/, '')]}`;
                    });
                }
                this.setState({
                    icons,
                    loading: false,
                    names,
                    isAnyName: !!names.find(i => i),
                });
            } else {
                const promises = this.props.icons.map((item, i) => {
                    let href: string;
                    if (typeof item === 'object') {
                        href = item.icon || item.src || item.href || '';
                        names[i] =
                            typeof item.name === 'object'
                                ? item.name[this.props.lang] || item.name.en || item._id || ''
                                : item.name || '';
                        if (!names[i]) {
                            const parts = href.split('.');
                            parts.pop();
                            names[i] = parts[parts.length - 1];
                        }
                    } else {
                        href = item;
                    }

                    if (href) {
                        if (href.startsWith('data:')) {
                            icons[i] = href;
                            return Promise.resolve();
                        }
                        return Utils.getSvg(href).then(icon => (icons[i] = icon));
                    }

                    return Promise.resolve();
                });

                void Promise.all(promises)
                    .catch((e: Error) => console.error(e))
                    .then(() =>
                        this.setState({
                            icons,
                            loading: false,
                            names,
                            isAnyName: !!names.find(i => i),
                        }),
                    );
            }
        });
    }

    render(): React.JSX.Element {
        if (this.state.loading) {
            return <CircularProgress />;
        }

        return (
            <>
                <Button
                    color="grey"
                    variant="outlined"
                    title={this.props.t('ra_Select predefined icon')}
                    onClick={() => this.setState({ opened: true }, () => this.loadAllIcons())}
                    style={{ minWidth: 40, marginRight: 8 }}
                >
                    ...
                </Button>
                {this.state.opened ? (
                    <Dialog
                        onClose={() => this.setState({ opened: false })}
                        open={!0}
                    >
                        <DialogTitle>
                            {this.props.t('ra_Select predefined icon')}
                            {this.state.isAnyName ? (
                                <TextField
                                    variant="standard"
                                    margin="dense"
                                    style={{ marginLeft: 20 }}
                                    value={this.state.filter}
                                    onChange={e => this.setState({ filter: e.target.value.toLowerCase() })}
                                    placeholder={this.props.t('ra_Filter')}
                                    slotProps={{
                                        input: {
                                            endAdornment: this.state.filter ? (
                                                <IconButton
                                                    tabIndex={-1}
                                                    size="small"
                                                    onClick={() => this.setState({ filter: '' })}
                                                >
                                                    <ClearIcon />
                                                </IconButton>
                                            ) : undefined,
                                        },
                                    }}
                                />
                            ) : null}
                        </DialogTitle>
                        <DialogContent>
                            <div style={{ width: '100%', textAlign: 'center' }}>
                                {this.state.icons &&
                                    this.state.icons.map((icon, i) => {
                                        if (
                                            !this.state.filter ||
                                            (this.state.names[i] &&
                                                this.state.names[i].toLowerCase().includes(this.state.filter))
                                        ) {
                                            return (
                                                <Tooltip
                                                    title={this.state.names[i] || ''}
                                                    key={i}
                                                    slotProps={{ popper: { sx: { pointerEvents: 'none' } } }}
                                                >
                                                    <IconButton
                                                        onClick={() =>
                                                            this.setState({ opened: false }, () => {
                                                                const onApply: ((_icon: string) => void) | undefined =
                                                                    this.props.onSelect || this.props.onChange;
                                                                if (onApply) {
                                                                    onApply(icon);
                                                                }
                                                            })
                                                        }
                                                        size="large"
                                                    >
                                                        <Icon
                                                            src={icon}
                                                            alt={i.toString()}
                                                            style={{ width: 32, height: 32, borderRadius: 5 }}
                                                        />
                                                    </IconButton>
                                                </Tooltip>
                                            );
                                        }

                                        return null;
                                    })}
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <Button
                                color="grey"
                                variant="contained"
                                onClick={() => this.setState({ opened: false })}
                                startIcon={<CloseIcon />}
                            >
                                {this.props.t('ra_Close')}
                            </Button>
                        </DialogActions>
                    </Dialog>
                ) : null}
            </>
        );
    }
}
