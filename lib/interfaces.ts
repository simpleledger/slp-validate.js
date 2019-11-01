import Big from "big.js";
export interface IValidSlpTxnParams {
    txn: string | Buffer;
    tokenIdFilter?: string;
    tokenTypeFilter?: number;
    burnQuantity?: Big;
}
export interface IValidSlpTxidParams {
    txid: string;
    tokenIdFilter?: string;
    tokenTypeFilter?: number;
}
