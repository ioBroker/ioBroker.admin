import { FcElectricalSensor } from 'react-icons/fc';
import { SiBoost } from 'react-icons/si';
import { TiCogOutline as IconWorking } from 'react-icons/ti';
import {
    MdPermScanWifi as IconUnreach,
    MdPriorityHigh as IconMaintain,
    MdBatteryAlert as IconLowbat,
    MdError as IconError,
    MdDirections,
    MdGpsFixed,
    MdWork,
    MdDeveloperMode,
} from 'react-icons/md';
import {
    AiOutlineAppstoreAdd,
    AiOutlineRadiusBottomleft,
    AiOutlineColumnHeight,
    AiOutlineColumnWidth,
    AiOutlineSwap,
    AiFillPauseCircle,
    AiOutlinePoweroff,
} from 'react-icons/ai';
import { BiLastPage } from 'react-icons/bi';
import {
    FaCompressArrowsAlt,
    FaRunning,
    FaSun,
    FaCompress,
    FaVolumeMute,
    FaToggleOn,
    FaDoorOpen,
} from 'react-icons/fa';
import {
    GiElectricalResistance,
    GiLaserPrecision,
    GiStopSign,
    GiNuclearWaste,
    GiMatterStates,
    GiTreeSwing,
    GiSpeedometer,
    GiElectric,
    GiLightningFrequency,
} from 'react-icons/gi';
import { IoIosColorPalette, IoIosWater } from 'react-icons/io';
import { WiDaySunny, WiFire, WiHumidity, WiSmoke, WiThermometer } from 'react-icons/wi';
import { FiPower } from 'react-icons/fi';
import { HiOutlineLightBulb } from 'react-icons/hi';
import { ImPower } from 'react-icons/im';
import type { IconType } from 'react-icons';

import { WindowTilted } from './icons';

export const STATES_NAME_ICONS: Record<string, IconType> = {
    SET: AiOutlineAppstoreAdd,
    WORKING: MdWork,
    UNREACH: IconUnreach,
    LOWBAT: IconLowbat,
    MAINTAIN: IconMaintain,
    ERROR: IconError,
    DIRECTION: MdDirections,
    CONNECTED: IconUnreach,
    ACTUAL: IconWorking,
    SECOND: BiLastPage,
    PRESS_LONG: FaCompressArrowsAlt,
    PRESS: FaCompress,
    MUTE: FaVolumeMute,
    ACCURACY: GiLaserPrecision,
    RADIUS: AiOutlineRadiusBottomleft,
    ELEVATION: AiOutlineColumnHeight,
    LATITUDE: AiOutlineColumnWidth,
    LONGITUDE: AiOutlineSwap,
    GPS: MdGpsFixed,
    ON_ACTUAL: FaToggleOn,
    ON_SET: FaToggleOn,
    OPEN: FaDoorOpen,
    STOP: GiStopSign,
    WATER_ALARM: IoIosWater, // water
    WASTE_ALARM: GiNuclearWaste,
    PAUSE: AiFillPauseCircle,
    STATE: GiMatterStates,
    BATTERY: IconLowbat,
    WASTE: GiNuclearWaste,
    WATER: IoIosWater,
    WORK_MODE: MdWork,
    MODE: MdDeveloperMode,
    POWER: AiOutlinePoweroff,
    BOOST: SiBoost,
    HUMIDITY: WiHumidity,
    TEMPERATURE: WiThermometer,
    BRIGHTNESS: WiDaySunny,
    MOTION: FaRunning,
    FIRE: WiFire,
    WINDOW: WindowTilted,
    SMOKE: WiSmoke,
    SWING: GiTreeSwing,
    SPEED: GiSpeedometer,
    DIMMER: HiOutlineLightBulb,
    ON: FiPower,
    COLOR_TEMP: FaSun,
    ELECTRIC_POWER: ImPower,
    CURRENT: GiElectric,
    VOLTAGE: GiElectricalResistance,
    CONSUMPTION: FcElectricalSensor,
    FREQUENCY: GiLightningFrequency,
    HUE: IoIosColorPalette,
};
