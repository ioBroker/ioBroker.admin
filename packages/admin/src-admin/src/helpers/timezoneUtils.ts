/**
 * Utility functions for timezone detection and comparison
 */

export interface TimezoneInfo {
    /** Timezone offset in minutes from UTC */
    offset: number;
    /** Timezone name/identifier */
    timezone: string;
    /** Current timestamp */
    timestamp: number;
}

/**
 * Get client timezone information
 */
export function getClientTimezoneInfo(): TimezoneInfo {
    const now = new Date();
    return {
        offset: -now.getTimezoneOffset(), // getTimezoneOffset returns negative of UTC offset
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timestamp: now.getTime(),
    };
}

/**
 * Get server timezone information from system config
 */
export function getServerTimezoneInfo(systemConfig: ioBroker.SystemConfigObject): TimezoneInfo {
    const serverTime = Date.now();
    // Try to get timezone from system config
    let serverTimezone = 'UTC';
    let serverOffset = 0;

    // Since timezone is not directly available in system config,
    // we'll use the server's current timezone
    try {
        const serverDate = new Date(serverTime);
        serverOffset = -serverDate.getTimezoneOffset(); // getTimezoneOffset returns negative of UTC offset

        // Try to get timezone name
        if (Intl?.DateTimeFormat) {
            serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        }
    } catch (error) {
        console.warn('Could not determine server timezone offset:', error);
    }

    return {
        offset: serverOffset,
        timezone: serverTimezone,
        timestamp: serverTime,
    };
}

/**
 * Check if there's a significant difference between client and server timezones
 *
 * @param clientInfo Client timezone information
 * @param serverInfo Server timezone information
 * @param thresholdMinutes Minimum difference in minutes to consider significant (default: 60)
 * @returns Object with difference information
 */
export function checkTimezoneDifference(
    clientInfo: TimezoneInfo,
    serverInfo: TimezoneInfo,
    thresholdMinutes: number = 60,
): {
    hasDifference: boolean;
    offsetDifferenceMinutes: number;
    offsetDifferenceHours: number;
    clientFormatted: string;
    serverFormatted: string;
} {
    const offsetDifferenceMinutes = Math.abs(clientInfo.offset - serverInfo.offset);
    const offsetDifferenceHours = offsetDifferenceMinutes / 60;
    const hasDifference = offsetDifferenceMinutes >= thresholdMinutes;

    // Format timezone offset for display
    const formatOffset = (offset: number): string => {
        const hours = Math.floor(Math.abs(offset) / 60);
        const minutes = Math.abs(offset) % 60;
        const sign = offset >= 0 ? '+' : '-';
        return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    return {
        hasDifference,
        offsetDifferenceMinutes,
        offsetDifferenceHours,
        clientFormatted: `${clientInfo.timezone} (${formatOffset(clientInfo.offset)})`,
        serverFormatted: `${serverInfo.timezone} (${formatOffset(serverInfo.offset)})`,
    };
}

/**
 * Generate timezone fix instructions based on the operating system
 */
export function getTimezoneFixInstructions(lang: ioBroker.Languages): {
    windows: string[];
    linux: string[];
    macos: string[];
} {
    // Instructions will be translated, here are the key identifiers
    const instructions = {
        windows: [
            'timezone_fix_windows_1',
            'timezone_fix_windows_2',
            'timezone_fix_windows_3',
            'timezone_fix_windows_4',
        ],
        linux: ['timezone_fix_linux_1', 'timezone_fix_linux_2', 'timezone_fix_linux_3'],
        macos: ['timezone_fix_macos_1', 'timezone_fix_macos_2', 'timezone_fix_macos_3'],
    };

    return instructions;
}

/**
 * Check if timezone warning should be shown based on system config and language
 * This implements the logic suggested in the GitHub comment about using location/language
 */
export function shouldShowTimezoneWarning(
    systemConfig: ioBroker.SystemConfigObject,
    clientInfo: TimezoneInfo,
    serverInfo: TimezoneInfo,
): boolean {
    const difference = checkTimezoneDifference(clientInfo, serverInfo);

    if (!difference.hasDifference) {
        return false;
    }

    // Additional logic based on system configuration
    // If language is set to Germany, we expect Berlin timezone
    if (systemConfig?.common?.language === 'de') {
        if (
            serverInfo.timezone !== 'Europe/Berlin' &&
            !serverInfo.timezone.includes('Europe/') &&
            serverInfo.timezone !== 'CET' &&
            serverInfo.timezone !== 'CEST'
        ) {
            return true;
        }
    }

    // If city/country is configured, we could check against expected timezone
    if (systemConfig?.common?.city || systemConfig?.common?.country) {
        // This would require a mapping of locations to expected timezones
        // For now, we'll just show the warning if there's a difference
        return true;
    }

    // Default: show warning if there's a significant difference
    return true;
}
