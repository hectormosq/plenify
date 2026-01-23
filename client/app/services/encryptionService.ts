export class EncryptionService {
    private static ALGORITHM = { name: "AES-GCM", length: 256 };
    private static ITERATIONS = 100000;
  
    /**
     * Derives a cryptographic key from a passphrase and salt using PBKDF2.
     */
    private static async deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
      const encoder = new TextEncoder();
      const baseKey = await window.crypto.subtle.importKey(
        "raw",
        encoder.encode(passphrase),
        "PBKDF2",
        false,
        ["deriveKey"]
      );
  
      return window.crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt as BufferSource,
          iterations: this.ITERATIONS,
          hash: "SHA-256",
        },
        baseKey,
        this.ALGORITHM,
        false,
        ["encrypt", "decrypt"]
      );
    }
  
    /**
     * Encrypts a string (JSON) using a passphrase.
     * Returns a JSON string containing the salt, IV, and encrypted data (base64).
     */
    static async encrypt(plainText: string, passphrase: string): Promise<string> {
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(passphrase, salt);
      const encoder = new TextEncoder();
  
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encoder.encode(plainText)
      );
  
      // Convert buffers to base64 for storage/transmission
      const encryptedArray = Array.from(new Uint8Array(encryptedBuffer));
      const saltArray = Array.from(salt);
      const ivArray = Array.from(iv);
  
      const packageData = {
        salt: this.bufferToBase64(saltArray),
        iv: this.bufferToBase64(ivArray),
        data: this.bufferToBase64(encryptedArray),
      };
  
      return JSON.stringify(packageData);
    }
  
    /**
     * Decrypts an encrypted string package using a passphrase.
     */
    static async decrypt(encryptedPackage: string, passphrase: string): Promise<string> {
      try {
        const pkg = JSON.parse(encryptedPackage);
        const salt = this.base64ToBuffer(pkg.salt);
        const iv = this.base64ToBuffer(pkg.iv);
        const data = this.base64ToBuffer(pkg.data);
  
        const key = await this.deriveKey(passphrase, new Uint8Array(salt));
  
        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: "AES-GCM", iv: new Uint8Array(iv) },
          key,
          new Uint8Array(data)
        );
  
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
      } catch (error) {
        console.error("Decryption failed:", error);
        throw new Error("Failed to decrypt data. Incorrect passphrase or corrupted file.");
      }
    }
  
    // --- Utilities ---
  
    private static bufferToBase64(buffer: number[]): string {
      // Use a chunked approach to avoid Maximum call stack size exceeded
      const CHUNK_SIZE = 0x8000; // 32768
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK_SIZE)));
      }
      return btoa(binary);
    }
  
    private static base64ToBuffer(base64: string): number[] {
        const binaryString = atob(base64);
        const bytes = new Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
  }
