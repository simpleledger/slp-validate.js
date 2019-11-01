export class Transaction {
    public static parseFromBuffer(buffer: Buffer) {
        const source = new Primatives.ArraySource(buffer.toJSON().data);
        const stream = new Primatives.ByteStream(source);
        return Transaction.parse(stream);
    }

    public static parse(stream: Primatives.ByteStream) {
        const transaction = new Transaction();
        transaction.version = stream.readInt(4);

        var txInNum = stream.readVarInt();
        for (let i = 0; i < txInNum; i++) {
            const input: TransactionInput = {
                previousTxHash: stream.readHexBytes(32),
                previousTxOutIndex: stream.readInt(4),
                scriptSig: Buffer.from(stream.readString()),
                sequenceNo: stream.readHexBytes(4),
            };

            transaction.inputs.push(input);
        }

        const txOutNum = stream.readVarInt();
        for (let i = 0; i < txOutNum; i++) {
            transaction.outputs.push({
                value: stream.readInt(8),
                // tslint:disable-next-line: object-literal-sort-keys
                scriptPubKey: Buffer.from(stream.readString()),
            });
        }

        transaction.lockTime = stream.readInt(4);
        return transaction;
    }
    public version: number;
    public inputs: TransactionInput[];
    public outputs: TransactionOutput[];
    public lockTime: number;
    constructor(version?: number, inputs?: TransactionInput[], outputs?: any[], lockTime?: number) {
        this.version = version || 1;
        this.inputs = inputs || [];
        this.outputs = outputs || [];
        this.lockTime = lockTime || 0;
    }
}

export interface TransactionInput {
    previousTxHash: string;
    previousTxOutIndex: number;
    scriptSig: Buffer;
    sequenceNo: string;
    satoshis?: number;
}

export interface TransactionOutput {
    value: number;
    scriptPubKey: Buffer;
}

export namespace Primatives {
    class Hex {
        public static decode(text: string) {
            return text.match(/.{2}/g)!.map(function(byte) {
                return parseInt(byte, 16);
            });
        }
        public static encode(bytes: number[]) {
            const result = [];
            for (let i = 0, hex; i < bytes.length; i++) {
                hex = bytes[i].toString(16);
                if (hex.length < 2) {
                    hex = '0' + hex;
                }
                result.push(hex);
            }
            return result.join('');
        }
    };

    class LittleEndian {
        public static decode(bytes: number[]) {
            return bytes.reduce(function(previous, current, index) {
                return previous + current * Math.pow(256, index);
            }, 0);
        }
        public static encode(number: number, count: number) {
            const rawBytes = [];
            for (let i = 0; i < count; i++) {
                rawBytes[i] = number & 0xff;
                number = Math.floor(number / 256);
            }
            return rawBytes;
        }
    };

    export class ArraySource {
        public rawBytes: number[];
        public index: number;
        constructor(rawBytes: number[], index?: number) {
            this.rawBytes = rawBytes;
            this.index = index || 0;
        }
        public readByte() {
            if (!this.hasMoreBytes()) {
                throw new Error('Cannot read past the end of the array.');
            }
            return this.rawBytes[this.index++];
        }
        public hasMoreBytes() {
            return this.index < this.rawBytes.length;
        }
        public getPosition() {
            return this.index;
        }
    }

    export class ByteStream {
        public source: ArraySource;
        constructor(source: ArraySource){
            this.source = source;
        }
        public readByte() {
            return this.source.readByte();
        }
        public readBytes(num: number) {
            const bytes = [];
            for (let i = 0; i < num; i++) {
                bytes.push(this.readByte());
            }
            return bytes;
        }
        public readInt(num: number) {
            const bytes = this.readBytes(num);
            return LittleEndian.decode(bytes);
        }
        public readVarInt() {
            const num = this.readByte();
            if (num < 0xfd) {
                return num;
            } else if (num === 0xfd) {
                return this.readInt(2);
            } else if (num === 0xfe) {
                return this.readInt(4);
            } else {
                return this.readInt(8);
            }
        }
        public readString() {
            const length = this.readVarInt();
            return this.readBytes(length);
        }
        public readHexBytes(num: number) {
            const bytes = this.readBytes(num);
            return Hex.encode(bytes.reverse());
        }
        public hasMoreBytes() {
            return this.source.hasMoreBytes();
        }
        public getPosition() {
            return this.source.getPosition();
        }
    }
}
