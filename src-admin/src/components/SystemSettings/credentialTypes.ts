/**
 * Definitions of the central credential storage.
 *
 * KEEP IN SYNC with `@iobroker/adapter-core` (src/credentials.ts), which is the
 * canonical source of truth that adapters use to read the credentials.
 * It is duplicated here because the admin frontend cannot bundle the backend package.
 */

/** Prefix of all credential object IDs */
export const CREDENTIALS_PREFIX = 'system.credentials.';

/** Placeholder that is shown instead of an encrypted value as long as the user did not change it */
export const SOME_PASSWORD = '__SOME_PASSWORD__';

/** Current version of the credential data format */
export const CREDENTIALS_VERSION = 1;

/** Categories of credentials (stored in `native.type`) */
export type CredentialType = 'email' | 'cloud' | 'ai' | 'aws' | 'azure' | 'custom';

/** All credential categories */
export const CREDENTIAL_TYPES: CredentialType[] = ['email', 'cloud', 'ai', 'aws', 'azure', 'custom'];

/** The forms a credential can have: login/password, a single key, or a cloud-provider field set */
export type CredentialForm = 'login' | 'key' | 'aws' | 'azure';

/** One entry of a `select` field's dropdown */
export interface CredentialFieldOption {
    /** Value stored in `native` */
    value: string;
    /** Text shown in the dropdown (defaults to `value`) */
    label?: string;
}

/** Description of one field of a credential form */
export interface CredentialFieldDefinition {
    /** Attribute name in the object's `native` */
    name: string;
    /** How the field should be rendered and validated */
    type: 'text' | 'password' | 'select';
    /** The field is stored encrypted with the system secret */
    encrypted?: boolean;
    /** The field must be filled */
    required?: boolean;
    /** Translation key for the field label (admin UI only) */
    label: string;
    /** For `type: 'select'`: the selectable options */
    options?: CredentialFieldOption[];
}

/** Common AWS regions offered in the region selector (an unknown stored value is still kept). */
export const AWS_REGIONS: CredentialFieldOption[] = [
    { value: 'us-east-1', label: 'us-east-1 (US East, N. Virginia)' },
    { value: 'us-east-2', label: 'us-east-2 (US East, Ohio)' },
    { value: 'us-west-1', label: 'us-west-1 (US West, N. California)' },
    { value: 'us-west-2', label: 'us-west-2 (US West, Oregon)' },
    { value: 'ca-central-1', label: 'ca-central-1 (Canada Central)' },
    { value: 'sa-east-1', label: 'sa-east-1 (South America, São Paulo)' },
    { value: 'eu-west-1', label: 'eu-west-1 (Europe, Ireland)' },
    { value: 'eu-west-2', label: 'eu-west-2 (Europe, London)' },
    { value: 'eu-west-3', label: 'eu-west-3 (Europe, Paris)' },
    { value: 'eu-central-1', label: 'eu-central-1 (Europe, Frankfurt)' },
    { value: 'eu-central-2', label: 'eu-central-2 (Europe, Zurich)' },
    { value: 'eu-north-1', label: 'eu-north-1 (Europe, Stockholm)' },
    { value: 'eu-south-1', label: 'eu-south-1 (Europe, Milan)' },
    { value: 'eu-south-2', label: 'eu-south-2 (Europe, Spain)' },
    { value: 'ap-south-1', label: 'ap-south-1 (Asia Pacific, Mumbai)' },
    { value: 'ap-northeast-1', label: 'ap-northeast-1 (Asia Pacific, Tokyo)' },
    { value: 'ap-northeast-2', label: 'ap-northeast-2 (Asia Pacific, Seoul)' },
    { value: 'ap-northeast-3', label: 'ap-northeast-3 (Asia Pacific, Osaka)' },
    { value: 'ap-southeast-1', label: 'ap-southeast-1 (Asia Pacific, Singapore)' },
    { value: 'ap-southeast-2', label: 'ap-southeast-2 (Asia Pacific, Sydney)' },
    { value: 'me-central-1', label: 'me-central-1 (Middle East, UAE)' },
    { value: 'me-south-1', label: 'me-south-1 (Middle East, Bahrain)' },
    { value: 'af-south-1', label: 'af-south-1 (Africa, Cape Town)' },
];

/** Common Azure regions offered in the region selector (an unknown stored value is still kept). */
export const AZURE_REGIONS: CredentialFieldOption[] = [
    { value: 'eastus', label: 'eastus (East US)' },
    { value: 'eastus2', label: 'eastus2 (East US 2)' },
    { value: 'centralus', label: 'centralus (Central US)' },
    { value: 'northcentralus', label: 'northcentralus (North Central US)' },
    { value: 'southcentralus', label: 'southcentralus (South Central US)' },
    { value: 'westus', label: 'westus (West US)' },
    { value: 'westus2', label: 'westus2 (West US 2)' },
    { value: 'westus3', label: 'westus3 (West US 3)' },
    { value: 'canadacentral', label: 'canadacentral (Canada Central)' },
    { value: 'brazilsouth', label: 'brazilsouth (Brazil South)' },
    { value: 'northeurope', label: 'northeurope (North Europe)' },
    { value: 'westeurope', label: 'westeurope (West Europe)' },
    { value: 'francecentral', label: 'francecentral (France Central)' },
    { value: 'germanywestcentral', label: 'germanywestcentral (Germany West Central)' },
    { value: 'norwayeast', label: 'norwayeast (Norway East)' },
    { value: 'swedencentral', label: 'swedencentral (Sweden Central)' },
    { value: 'switzerlandnorth', label: 'switzerlandnorth (Switzerland North)' },
    { value: 'uksouth', label: 'uksouth (UK South)' },
    { value: 'ukwest', label: 'ukwest (UK West)' },
    { value: 'uaenorth', label: 'uaenorth (UAE North)' },
    { value: 'southafricanorth', label: 'southafricanorth (South Africa North)' },
    { value: 'centralindia', label: 'centralindia (Central India)' },
    { value: 'eastasia', label: 'eastasia (East Asia)' },
    { value: 'southeastasia', label: 'southeastasia (Southeast Asia)' },
    { value: 'japaneast', label: 'japaneast (Japan East)' },
    { value: 'koreacentral', label: 'koreacentral (Korea Central)' },
    { value: 'australiaeast', label: 'australiaeast (Australia East)' },
];

/** Registry of the credential forms and their fields */
export const CREDENTIAL_FORMS: Record<CredentialForm, CredentialFieldDefinition[]> = {
    login: [
        { name: 'login', type: 'text', required: true, label: 'Login' },
        { name: 'password', type: 'password', encrypted: true, required: true, label: 'Password' },
    ],
    key: [{ name: 'key', type: 'password', encrypted: true, required: true, label: 'Key' }],
    aws: [
        { name: 'accessKeyId', type: 'text', required: true, label: 'Access Key ID' },
        { name: 'secretAccessKey', type: 'password', encrypted: true, required: true, label: 'Secret Access Key' },
        { name: 'region', type: 'select', required: true, label: 'Region', options: AWS_REGIONS },
    ],
    azure: [
        { name: 'subscriptionKey', type: 'password', encrypted: true, required: true, label: 'Subscription Key' },
        { name: 'region', type: 'select', required: true, label: 'Region', options: AZURE_REGIONS },
    ],
};

/**
 * Detects the form of a credential from its `native`.
 *
 * New credentials store the form explicitly in `native.form`; older login/key credentials are
 * recognized by the presence of `native.key` (fallback for objects created before `native.form`).
 *
 * @param native The `native` of the credential object
 */
export function getCredentialForm(native: Record<string, any>): CredentialForm {
    if (typeof native.form === 'string' && CREDENTIAL_FORMS[native.form as CredentialForm]) {
        return native.form as CredentialForm;
    }
    return native.key !== undefined ? 'key' : 'login';
}
