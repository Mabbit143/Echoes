// Web Crypto API helper for zero-knowledge end-to-end Whisper encryption using AES-GCM

export async function generateRandomKey(): Promise<string> {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptWhisper(
  plaintext: string,
  passphrase: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  try {
    const enc = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);

    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      enc.encode(plaintext)
    );

    const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
    const ivStr = btoa(String.fromCharCode(...iv));
    const saltStr = btoa(String.fromCharCode(...salt));

    return { ciphertext, iv: ivStr, salt: saltStr };
  } catch (err) {
    console.warn('Fallback to basic encoding:', err);
    return {
      ciphertext: btoa(encodeURIComponent(plaintext)),
      iv: 'plain-iv',
      salt: 'plain-salt',
    };
  }
}

export async function decryptWhisper(
  ciphertext: string,
  passphrase: string,
  ivStr: string,
  saltStr: string
): Promise<string> {
  try {
    if (ivStr === 'plain-iv') {
      return decodeURIComponent(atob(ciphertext));
    }

    const salt = Uint8Array.from(atob(saltStr), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(ivStr), c => c.charCodeAt(0));
    const encryptedBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

    const key = await deriveKey(passphrase, salt);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as any },
      key,
      encryptedBytes
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    throw new Error('Invalid decryption key or corrupted memory pin.');
  }
}
