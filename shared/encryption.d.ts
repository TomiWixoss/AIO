export declare function createEncryption(encryptionKey: string): {
    encrypt: (text: string) => string;
    decrypt: (encryptedText: string) => string;
    decryptApiKey: (encryptedText: string) => string;
};
export type Encryption = ReturnType<typeof createEncryption>;
