import { createEncryption } from "shared/encryption";
import { config } from "../config/index.js";

const { encrypt, decrypt, decryptApiKey } = createEncryption(
  config.encryptionKey
);

export { encrypt, decrypt, decryptApiKey };
