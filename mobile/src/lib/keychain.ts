/**
 * keychain.ts — Token & User Storage using react-native-keychain
 *
 * Uses the iOS Keychain / Android Keystore for secure persistent storage.
 * Falls back gracefully if the module is not available (e.g., during testing).
 */

import * as Keychain from 'react-native-keychain';

const SERVICE = 'black94_auth';
const USERNAME = 'black94_auth';

// ── Token Functions ──────────────────────────────────────────────────────────

/**
 * Save an auth token to the secure keychain.
 * @param token - JWT or ID token string
 */
export async function saveToken(token: string): Promise<void> {
  try {
    await Keychain.setGenericPassword(USERNAME, token, {
      service: SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (err) {
    console.error('[keychain] Failed to save token:', err);
    throw err;
  }
}

/**
 * Retrieve the stored auth token.
 * @returns The token string, or null if not found / error.
 */
export async function getToken(): Promise<string | null> {
  try {
    const result = await Keychain.getGenericPassword({ service: SERVICE });
    if (result && result.password) {
      return result.password;
    }
    return null;
  } catch (err) {
    console.error('[keychain] Failed to get token:', err);
    return null;
  }
}

/**
 * Remove the stored auth token from the keychain.
 */
export async function deleteToken(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: SERVICE });
  } catch (err) {
    // Keychain.resetGenericPassword throws if no entry exists — that's fine
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code !== 'ERR_NO_ITEM'
    ) {
      console.error('[keychain] Failed to delete token:', err);
    }
  }
}

// ── User Object Functions ───────────────────────────────────────────────────

const USER_SERVICE = 'black94_user';
const USER_USERNAME = 'black94_user';

/**
 * Save a serialized user object to the keychain.
 * @param user - Any JSON-serializable object (typically the Black94 User type)
 */
export async function saveUser(user: object): Promise<void> {
  try {
    const json = JSON.stringify(user);
    await Keychain.setGenericPassword(USER_USERNAME, json, {
      service: USER_SERVICE,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (err) {
    console.error('[keychain] Failed to save user:', err);
    throw err;
  }
}

/**
 * Retrieve the stored user object.
 * @returns The parsed user object, or null if not found / error.
 */
export async function getUser<T = object>(): Promise<T | null> {
  try {
    const result = await Keychain.getGenericPassword({ service: USER_SERVICE });
    if (result && result.password) {
      return JSON.parse(result.password) as T;
    }
    return null;
  } catch (err) {
    console.error('[keychain] Failed to get user:', err);
    return null;
  }
}

/**
 * Remove the stored user object from the keychain.
 */
export async function deleteUser(): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: USER_SERVICE });
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code !== 'ERR_NO_ITEM'
    ) {
      console.error('[keychain] Failed to delete user:', err);
    }
  }
}

// ── Keypair Storage (for E2E encryption) ────────────────────────────────────

/**
 * Save an E2E encryption keypair for a specific user.
 * @param userId - The user's UID
 * @param publicKey - Base64-encoded public key
 * @param privateKey - Base64-encoded private key
 */
export async function saveKeypair(
  userId: string,
  publicKey: string,
  privateKey: string,
): Promise<void> {
  try {
    const service = `black94_e2e_${userId}`;
    const data = JSON.stringify({ publicKey, privateKey, createdAt: Date.now() });
    await Keychain.setGenericPassword(userId, data, {
      service,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  } catch (err) {
    console.error('[keychain] Failed to save keypair:', err);
    throw err;
  }
}

/**
 * Retrieve the stored keypair for a specific user.
 * @param userId - The user's UID
 * @returns The keypair data, or null if not found.
 */
export async function getKeypair(userId: string): Promise<{
  publicKey: string;
  privateKey: string;
} | null> {
  try {
    const service = `black94_e2e_${userId}`;
    const result = await Keychain.getGenericPassword({ service });
    if (result && result.password) {
      const data = JSON.parse(result.password);
      return {
        publicKey: data.publicKey,
        privateKey: data.privateKey,
      };
    }
    return null;
  } catch (err) {
    console.error('[keychain] Failed to get keypair:', err);
    return null;
  }
}

/**
 * Delete the stored keypair for a specific user.
 */
export async function deleteKeypair(userId: string): Promise<void> {
  try {
    const service = `black94_e2e_${userId}`;
    await Keychain.resetGenericPassword({ service });
  } catch (err) {
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code: string }).code !== 'ERR_NO_ITEM'
    ) {
      console.error('[keychain] Failed to delete keypair:', err);
    }
  }
}
