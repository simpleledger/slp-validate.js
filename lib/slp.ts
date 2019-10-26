import { Script } from "./script";

import Big from "big.js";

export enum SlpTransactionType {
    "GENESIS" = "GENESIS",
    "MINT" = "MINT",
    "SEND" = "SEND",
}

export enum SlpVersionType {
    "TokenVersionType1" = 1,
    "TokenVersionType1_NFT_Child" = 65,
    "TokenVersionType1_NFT_Parent" = 129,
}

export interface SlpTransactionDetails {
    transactionType: SlpTransactionType;
    tokenIdHex: string;
    versionType: SlpVersionType;
    timestamp?: string;
    symbol: string;
    name: string;
    documentUri: string|Buffer;
    documentSha256: Buffer|null;
    decimals: number;
    containsBaton: boolean;
    batonVout: number|null;
    genesisOrMintQuantity: Big|null;
    sendOutputs?: Big[]|null;
}

export interface PushDataOperation {
    opcode: number;
    data: Buffer|null;
}

export class Slp {

    static get lokadIdHex() { return "534c5000"; }

    // get list of data chunks resulting from data push operations
    public static parseOpReturnToChunks(script: Buffer, allowOP_0= false, allowOP_number= false) {
        // """Extract pushed bytes after opreturn. Returns list of bytes() objects,
        // one per push.
        let ops: PushDataOperation[];

        // Strict refusal of non-push opcodes; bad scripts throw OpreturnError."""
        try {
            ops = this.getScriptOperations(script);
        } catch (e) {
            // console.log(e);
            throw Error("Script error");
        }

        if (ops[0].opcode !== Script.opcodes.OP_RETURN) {
            throw Error("No OP_RETURN");
        }
        const chunks: Array<Buffer|null> = [];
        ops.slice(1).forEach(opitem => {
            if (opitem.opcode > Script.opcodes.OP_16) {
                throw Error("Non-push opcode");
            }
            if (opitem.opcode > Script.opcodes.OP_PUSHDATA4) {
                if (opitem.opcode === 80) {
                    throw Error("Non-push opcode");
                }
                if (!allowOP_number) {
                    throw Error("OP_1NEGATE to OP_16 not allowed");
                }
                if (opitem.opcode === Script.opcodes.OP_1NEGATE) {
                    opitem.data = Buffer.from([0x81]);
                } else { // OP_1 - OP_16
                    opitem.data = Buffer.from([opitem.opcode - 80]);
                }
            }
            if (opitem.opcode === Script.opcodes.OP_0 && !allowOP_0) {
                throw Error("OP_0 not allowed");
            }
            chunks.push(opitem.data);
        });
        // console.log(chunks);
        return chunks;
    }

    public static parseSlpOutputScript(outputScript: Buffer): SlpTransactionDetails {
        const slpMsg = {} as SlpTransactionDetails;
        let chunks: Array<Buffer|null>;
        try {
            chunks = this.parseOpReturnToChunks(outputScript);
        } catch (e) {
            throw Error("Bad OP_RETURN");
        }
        if (chunks.length === 0) {
            throw Error("Empty OP_RETURN");
        }
        if (!chunks[0]) {
            throw Error("Not SLP");
        }
        if (!chunks[0]!.equals(Buffer.from(this.lokadIdHex, "hex"))) {
            throw Error("Not SLP");
        }
        if (chunks.length === 1) {
            throw Error("Missing token versionType");
        }
        // # check if the token version is supported
        if (!chunks[1]) {
            throw Error("Bad versionType buffer");
        }
        slpMsg.versionType = (Slp.parseChunkToInt(chunks[1]!, 1, 2, true) as SlpVersionType);
        const supportedTypes = [
                SlpVersionType.TokenVersionType1,
                SlpVersionType.TokenVersionType1_NFT_Parent,
                SlpVersionType.TokenVersionType1_NFT_Child ];
        if (!supportedTypes.includes(slpMsg.versionType)) {
            throw Error("Unsupported token type: " + slpMsg.versionType);
        }
        if (chunks.length === 2) {
            throw Error("Missing SLP transaction type");
        }
        try {
            const msgType: string = chunks[2]!.toString("latin1");
            slpMsg.transactionType = SlpTransactionType[msgType as keyof typeof SlpTransactionType];
        } catch (_) {
            throw Error("Bad transaction type");
        }
        if (slpMsg.transactionType === SlpTransactionType.GENESIS) {
            if (chunks.length !== 10) {
                throw Error("GENESIS with incorrect number of parameters");
            }
            slpMsg.symbol = chunks[3] ? chunks[3]!.toString("utf8") : "";
            slpMsg.name = chunks[4] ? chunks[4]!.toString("utf8") : "";
            slpMsg.documentUri = chunks[5] ? chunks[5]!.toString("utf8") : "";
            slpMsg.documentSha256 = chunks[6] ? chunks[6] : null;
            if (slpMsg.documentSha256) {
                if (slpMsg.documentSha256.length !== 0 && slpMsg.documentSha256.length !== 32) {
                    throw Error("Token document hash is incorrect length");
                }
            }
            if (!chunks[7]) {
                throw Error("Bad decimals buffer");
            }
            slpMsg.decimals = (Slp.parseChunkToInt(chunks[7]!, 1, 1, true) as number);
            if (slpMsg.versionType === 0x41 && slpMsg.decimals !== 0) {
                throw Error("NFT1 child token must have divisibility set to 0 decimal places.");
            }
            if (slpMsg.decimals > 9) {
                throw Error("Too many decimals");
            }
            slpMsg.batonVout = chunks[8] ? Slp.parseChunkToInt(chunks[8]!, 1, 1) : null;
            if (slpMsg.batonVout !== null) {
                if (slpMsg.batonVout < 2) {
                    throw Error("Mint baton cannot be on vout=0 or 1");
                }
                slpMsg.containsBaton = true;
            }
            if (slpMsg.versionType === 0x41 && slpMsg.batonVout !== null) {
                throw Error("NFT1 child token must not have a minting baton!");
            }
            if (!chunks[9]) {
                throw Error("Bad Genesis quantity buffer");
            }
            if (chunks[9]!.length !== 8) {
                throw Error("Genesis quantity must be provided as an 8-byte buffer");
            }
            slpMsg.genesisOrMintQuantity = this.buffer2BigNumber(chunks[9]!);
            if (slpMsg.versionType === 0x41 && !slpMsg.genesisOrMintQuantity.eq(1)) {
                throw Error("NFT1 child token must have GENESIS quantity of 1.");
            }
        } else if (slpMsg.transactionType === SlpTransactionType.SEND) {
            if (chunks.length < 4) {
                throw Error("SEND with too few parameters");
            }
            if (!chunks[3]) {
                throw Error("Bad tokenId buffer");
            }
            if (chunks[3]!.length !== 32) {
                throw Error("token_id is wrong length");
            }
            slpMsg.tokenIdHex = chunks[3]!.toString("hex");
            // # Note that we put an explicit 0 for  ['token_output'][0] since it
            // # corresponds to vout=0, which is the OP_RETURN tx output.
            // # ['token_output'][1] is the first token output given by the SLP
            // # message, i.e., the number listed as `token_output_quantity1` in the
            // # spec, which goes to tx output vout=1.
            slpMsg.sendOutputs = [];
            slpMsg.sendOutputs.push(new Big(0));
            chunks.slice(4).forEach(chunk => {
                if (!chunk) {
                    throw Error("Bad send quantity buffer.");
                }
                if (chunk.length !== 8) {
                    throw Error("SEND quantities must be 8-bytes each.");
                }
                slpMsg.sendOutputs!.push(this.buffer2BigNumber(chunk));
            });
            // # maximum 19 allowed token outputs, plus 1 for the explicit [0] we inserted.
            if (slpMsg.sendOutputs.length < 2) {
                throw Error("Missing output amounts");
            }
            if (slpMsg.sendOutputs.length > 20) {
                throw Error("More than 19 output amounts");
            }
        } else if (slpMsg.transactionType === SlpTransactionType.MINT) {
            if (slpMsg.versionType === 0x41) {
                throw Error("NFT1 Child cannot have MINT transaction type.");
            }
            if (chunks.length !== 6) {
                throw Error("MINT with incorrect number of parameters");
            }
            if (!chunks[3]) {
                throw Error("Bad token_id buffer");
            }
            if (chunks[3]!.length !== 32) {
                throw Error("token_id is wrong length");
            }
            slpMsg.tokenIdHex = chunks[3]!.toString("hex");
            slpMsg.batonVout = chunks[4] ? Slp.parseChunkToInt(chunks[4]!, 1, 1) : null;
            if (slpMsg.batonVout !== null && slpMsg.batonVout !== undefined) {
                if (slpMsg.batonVout < 2) {
                    throw Error("Mint baton cannot be on vout=0 or 1");
                }
                slpMsg.containsBaton = true;
            }
            if (!chunks[5]) {
                throw Error("Bad Mint quantity buffer");
            }
            if (chunks[5]!.length !== 8) {
                throw Error("Mint quantity must be provided as an 8-byte buffer");
            }
            slpMsg.genesisOrMintQuantity = this.buffer2BigNumber(chunks[5]!);
        } else {
            throw Error("Bad transaction type");
 }

        if (!slpMsg.genesisOrMintQuantity && (!slpMsg.sendOutputs || slpMsg.sendOutputs.length === 0)) {
            throw Error("SLP message must have either Genesis/Mint outputs or Send outputs, both are missing");
        }

        return slpMsg;
    }

    public static parseChunkToInt(intBytes: Buffer, minByteLen: number, maxByteLen: number, raiseOnNull = false) {
        // # Parse data as unsigned-big-endian encoded integer.
        // # For empty data different possibilities may occur:
        // #      minByteLen <= 0 : return 0
        // #      raise_on_Null == False and minByteLen > 0: return None
        // #      raise_on_Null == True and minByteLen > 0:  raise SlpInvalidOutputMessage
        if (intBytes.length >= minByteLen && intBytes.length <= maxByteLen) {
            return intBytes.readUIntBE(0, intBytes.length);
        }
        if (intBytes.length === 0 && !raiseOnNull) {
            return null;
        }
        throw Error("Field has wrong length");
    }

    public static buffer2BigNumber(amount: Buffer): Big {
        if (amount.length < 5 || amount.length > 8) {
            throw Error("Buffer must be between 4-8 bytes in length");
        }
        return (new Big(amount.readUInt32BE(0).toString())).times(2 ** 32).plus(amount.readUInt32BE(4).toString());
    }

    // Get a list of operations with accompanying push data (if a push opcode)
    public static getScriptOperations(script: Buffer) {
        const ops: PushDataOperation[] = [];
        try {
            let n = 0;
            let dlen: number;
            while (n < script.length) {
                const op: PushDataOperation = { opcode: script[n], data: null };
                n += 1;
                if (op.opcode <= Script.opcodes.OP_PUSHDATA4) {
                    if (op.opcode < Script.opcodes.OP_PUSHDATA1) {
                        dlen = op.opcode;
                    } else if (op.opcode === Script.opcodes.OP_PUSHDATA1) {
                        dlen = script[n];
                        n += 1;
                    } else if (op.opcode === Script.opcodes.OP_PUSHDATA2) {
                        dlen = script.slice(n, n + 2).readUIntLE(0, 2);
                        n += 2;
                    } else {
                        dlen = script.slice(n, n + 4).readUIntLE(0, 4);
                        n += 4;
                    }
                    if ((n + dlen) > script.length) {
                        throw Error("IndexError");
                    }
                    if (dlen > 0) {
                        op.data = script.slice(n, n + dlen);
                    }
                    n += dlen;
                }
                ops.push(op);
            }
        } catch (e) {
            // console.log(e);
            throw Error("truncated script");
        }
        return ops;
    }
}
