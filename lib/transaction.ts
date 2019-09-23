export class Transaction {
    version: number;
    inputs: TransactionInput[];
    outputs: TransactionOutput[];
    lockTime: number;
    constructor(version?: number, inputs?: TransactionInput[], outputs?: any[], lockTime?: number) {
        this.version = version || 1;
        this.inputs = inputs || [];
        this.outputs = outputs || [];
        this.lockTime = lockTime || 0;
    }
    
    static parseFromBuffer(buffer: Buffer) {
        let source = new Primatives.ArraySource(buffer.toJSON().data)
        let stream = new Primatives.ByteStream(source);
        return Transaction.parse(stream);
    }
  
    static parse(stream: Primatives.ByteStream) {
        var transaction = new Transaction();
        transaction.version = stream.readInt(4);

        var txInNum = stream.readVarInt();
        for (var i = 0; i < txInNum; i++) {
            let input: TransactionInput = {
                previousTxHash: stream.readHexBytes(32),
                previousTxOutIndex: stream.readInt(4),
                scriptSig: Buffer.from(stream.readString()),
                sequenceNo: stream.readHexBytes(4),
            }

            transaction.inputs.push(input);
        }

        var txOutNum = stream.readVarInt();
        for (var i = 0; i < txOutNum; i++) {
            transaction.outputs.push({
                value: stream.readInt(8),
                scriptPubKey: Buffer.from(stream.readString())
            });
        }

        transaction.lockTime = stream.readInt(4);

        return transaction;
    }
}

export interface TransactionInput {
    previousTxHash: string,
    previousTxOutIndex: number,
    scriptSig: Buffer,
    sequenceNo: string,
    satoshis?: number
}

export interface TransactionOutput {
    value: number;
    scriptPubKey: Buffer;
}

export namespace Primatives {
    class Hex {
        static decode(text: string) {
            return text.match(/.{2}/g)!.map(function(byte) {
                return parseInt(byte, 16);
            });
        }
        static encode(bytes: number[]) {
            var result = [];
            for (var i = 0, hex; i < bytes.length; i++) {
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
        static decode(bytes: number[]) {
            return bytes.reduce(function(previous, current, index) {
                return previous + current * Math.pow(256, index);
            }, 0);
        }
        static encode(number: number, count: number) {
            var rawBytes = [];
            for (var i = 0; i < count; i++) {
                rawBytes[i] = number & 0xff;
                number = Math.floor(number / 256);
            }
            return rawBytes;
        }
    };
    
    export class ArraySource {
        rawBytes: number[];
        index: number;
        constructor(rawBytes: number[], index?: number) {
            this.rawBytes = rawBytes;
            this.index = index || 0;
        }
        readByte() {
            if (!this.hasMoreBytes()) {
                throw new Error('Cannot read past the end of the array.');
            }
            return this.rawBytes[this.index++];
        }
        hasMoreBytes() {
            return this.index < this.rawBytes.length;
        }
        getPosition() {
            return this.index;
        }
    }
    
    export class ByteStream {
        source: ArraySource;
        constructor(source: ArraySource){
            this.source = source;
        }
        readByte() {
            return this.source.readByte();
        }
        readBytes(num: number) {
            var bytes = [];
            for (var i = 0; i < num; i++) {
                bytes.push(this.readByte());
            }
            return bytes;
        }
        readInt(num: number) {
            var bytes = this.readBytes(num);
            return LittleEndian.decode(bytes);
        }
        readVarInt() {
            var num = this.readByte();
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
        readString() {
            var length = this.readVarInt();
            return this.readBytes(length);
        }
        readHexBytes(num: number) {
            var bytes = this.readBytes(num);
            return Hex.encode(bytes.reverse());
        }
        hasMoreBytes() {
            return this.source.hasMoreBytes();
        }
        getPosition() {
            return this.source.getPosition();
        }
    }
}
