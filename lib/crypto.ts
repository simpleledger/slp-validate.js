import * as crypto from "crypto";

export class Crypto {
    public static Hash256(message: Buffer): Buffer {
        const hash1 = crypto.createHash("sha256");
        const hash2 = crypto.createHash("sha256");
        hash1.update(message);
        hash2.update(hash1.digest());
        return Buffer.from(hash2.digest().toJSON().data);
    }

    public static HashTxid(txnBuf: Buffer): Buffer {
        return Crypto.Hash256(txnBuf).reverse();
    }
}
