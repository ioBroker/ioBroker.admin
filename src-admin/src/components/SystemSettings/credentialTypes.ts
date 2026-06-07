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
export type CredentialType = 'email' | 'cloud' | 'ai' | 'custom';

/** All credential categories */
export const CREDENTIAL_TYPES: CredentialType[] = ['email', 'cloud', 'ai', 'custom'];

/** The two forms a credential can have: login/password or a single key */
export type CredentialForm = 'login' | 'key';

/** Description of one field of a credential form */
export interface CredentialFieldDefinition {
    /** Attribute name in the object's `native` */
    name: string;
    /** How the field should be rendered and validated */
    type: 'text' | 'password';
    /** The field is stored encrypted with the system secret */
    encrypted?: boolean;
    /** The field must be filled */
    required?: boolean;
    /** Translation key for the field label (admin UI only) */
    label: string;
}

/** Registry of the two credential forms and their fields */
export const CREDENTIAL_FORMS: Record<CredentialForm, CredentialFieldDefinition[]> = {
    login: [
        { name: 'login', type: 'text', required: true, label: 'Login' },
        { name: 'password', type: 'password', encrypted: true, required: true, label: 'Password' },
    ],
    key: [{ name: 'key', type: 'password', encrypted: true, required: true, label: 'Key' }],
};

/**
 * Detects the form of a credential from its `native`.
 *
 * @param native The `native` of the credential object
 */
export function getCredentialForm(native: Record<string, any>): CredentialForm {
    return native.key !== undefined ? 'key' : 'login';
}
