import { Crypto } from './crypto';
import { Transaction } from './transaction';
import { SlpTransactionType, SlpTransactionDetails, Slp } from './slp';

import Big from 'big.js';

export interface Validation { validity: boolean|null; parents: Parent[], details: SlpTransactionDetails|null, invalidReason: string|null, waiting: boolean } 
export type GetRawTransactionAsync = (txid: string) => Promise<string|Buffer>;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface Parent {
    txid: string;
    vout: number;
    versionType: number;
    valid: boolean|null;
    inputQty: Big|null;
}

export class ValidatorType1 {
    cachedRawTransactions: MapCache<string, Buffer>; //{ [txid: string]: Buffer }
    cachedValidations: MapCache<string, Validation>; //{ [txid: string]: Validation }
    getRawTransaction: GetRawTransactionAsync;
    logger: { log: (s: string)=> any };

    constructor({ getRawTransaction, logger=console, maxTransactionCacheSize=100000, maxValidationCacheSize=100000 }: { getRawTransaction: GetRawTransactionAsync, logger?: { log: (s: string)=> any }, maxTransactionCacheSize?: number, maxValidationCacheSize?: number }) {
        if(!getRawTransaction)
            throw Error("Must provide method getRawTransaction to class constructor.")
        this.logger = logger;
        this.getRawTransaction = getRawTransaction;
        this.cachedValidations = new MapCache<string, Validation>(maxValidationCacheSize);
        this.cachedRawTransactions = new MapCache<string, Buffer>(maxTransactionCacheSize);
    }

    addValidationFromStore(hex: string, isValid: boolean) {
        let id = Crypto.hash256(Buffer.from(hex, 'hex')).toString('hex');
        if(!this.cachedValidations.has(id))
            this.cachedValidations.set(id, { validity: isValid, parents: [], details: null, invalidReason: null, waiting: false })
        if(!this.cachedRawTransactions.has(id))
            this.cachedRawTransactions.set(id, Buffer.from(hex, 'hex'));
    }
    
    async waitForCurrentValidationProcessing(txid: string) {
        let cached: Validation = this.cachedValidations.get(txid)!;

        if(!cached)
            throw Error("txid is missing from cachedValidations.")

        while(true) {
            if(typeof cached.validity === 'boolean') {
                cached.waiting = false;
                break;
            }
            await sleep(10);
        }
    }

    async waitForTransactionDownloadToComplete(txid: string){
        while(true) {
            //@ts-ignore
            if(this.cachedRawTransactions.get(txid)! && this.cachedRawTransactions.get(txid)! !== "waiting") {
                break;
            }
            await sleep(10);
        }
    }

    async retrieveRawTransaction(txid: string) {
        if(this.cachedRawTransactions.has(txid))
            return this.cachedRawTransactions.get(txid)!;
        //@ts-ignore
        this.cachedRawTransactions.set(txid, "waiting");
        let res = await this.getRawTransaction(txid);
        if(typeof res === "string")
            this.cachedRawTransactions.set(txid, Buffer.from(res, 'hex'));
        else
            this.cachedRawTransactions.set(txid, res);
        if(this.cachedRawTransactions.has(txid)) {
            if(this.cachedRawTransactions.get(txid)!.length < 60)
                throw Error("Valid transaction data not provided.")
            return this.cachedRawTransactions.get(txid)!;
        }
        throw Error("Transaction data not provided (null or undefined).")
    }

    async isValidSlpTxn({ txn, tokenIdFilter, tokenTypeFilter, burnQuantity=Big(0) }: { txn: string|Buffer, tokenIdFilter?: string, tokenTypeFilter?: number, burnQuantity?: Big }): Promise<boolean> {
        let txid;
        if(typeof txn === 'string') {
            let txnBuf = Buffer.from(txn,'hex');
            txid = Crypto.hash256(txnBuf).toString('hex');
            this.cachedRawTransactions.set(txid, txnBuf);
        }
        else {
            txid = Crypto.hash256(txn).toString('hex');
            this.cachedRawTransactions.set(txid, txn);
        }

        let validity = await this.isValidSlpTxid({ txid, tokenIdFilter, tokenTypeFilter });
        if(!validity)
            return validity;
        let validation = this.cachedValidations.get(txid)!;
        if(burnQuantity.eq(0)) {
            let validInputs: Big;
            let outputs: Big;
            outputs = validation.details!.sendOutputs!.reduce((p, c) => p.plus(c), Big(0));
            validInputs = validation.parents.map(p => p.inputQty ? p.inputQty : Big(0)).reduce((p, c) => p.plus(c), Big(0));
            if(!validInputs.eq(outputs) && validation.details!.transactionType === SlpTransactionType.SEND)
                throw Error('SLPJS: Outputs do not match valid inputs');
        } else if (burnQuantity.gt(0)) {
            let validInputs: Big;
            let outputs: Big;
            outputs = validation.details!.sendOutputs!.reduce((p, c) => p.plus(c), Big(0));
            validInputs = validation.parents.map(p => p.inputQty ? p.inputQty : Big(0)).reduce((p, c) => p.plus(c), Big(0));
            if(!validInputs.minus(burnQuantity).eq(outputs) && validation.details!.transactionType === SlpTransactionType.SEND)
                throw Error('SLPJS: Burn amount specified is not properly being burned in the provided transaction.');
        }
        return validity;
    }

    async isValidSlpTxid({ txid, tokenIdFilter, tokenTypeFilter }:{ txid: string, tokenIdFilter?: string, tokenTypeFilter?: number }): Promise<boolean> {
        this.logger.log("SLPJS Validating: " + txid);
        let valid = await this._isValidSlpTxid(txid, tokenIdFilter, tokenTypeFilter);
        this.logger.log("SLPJS Result: " + valid + " (" + txid + ")");
        if(!valid && this.cachedValidations.get(txid)!.invalidReason)
            this.logger.log("SLPJS Invalid Reason: " + this.cachedValidations.get(txid)!.invalidReason);
        else if(!valid)
            this.logger.log("SLPJS Invalid Reason: unknown (result is user supplied)")
        return valid;
    }

    //
    // This method uses recursion to do a Depth-First-Search with the node result being
    // computed in Postorder Traversal (left/right/root) order.  A validation cache 
    // is used to keep track of the results for nodes that have already been evaluated.
    // 
    // Each call to this method evaluates node validity with respect to 
    // its parent node(s), so it walks backwards until the
    // validation cache provides a result or the GENESIS node is evaluated.
    // Root nodes await the validation result of their upstream parent.  
    // 
    // In the case of NFT1 the search continues to the group/parent NFT DAG after the Genesis 
    // of the NFT child is discovered.
    //
    async _isValidSlpTxid(txid: string, tokenIdFilter?: string, tokenTypeFilter?: number): Promise<boolean> {
        // Check to see if this txn has been processed by looking at shared cache, if doesn't exist then download txn.
        if(!this.cachedValidations.has(txid)) {
            this.cachedValidations.set(txid, { 
                validity: null, 
                parents: [], 
                details: null, 
                invalidReason: null, 
                waiting: false 
            });
            await this.retrieveRawTransaction(txid);
        }
        // Otherwise, we can use the cached result as long as a special filter isn't being applied.
        else if(typeof this.cachedValidations.get(txid)!.validity === 'boolean' && !tokenIdFilter && !tokenTypeFilter) {
            return this.cachedValidations.get(txid)!.validity!;
        }

        //
        // Handle the case where neither branch of the previous if/else statement was
        // executed and the raw transaction has never been downloaded.
        //
        // Also handle case where a 2nd request of same txid comes in 
        // during the download of a previous request.
        //
        //@ts-ignore
        if(!this.cachedRawTransactions.get(txid)! || this.cachedRawTransactions.get(txid)! === "waiting") {
            //@ts-ignore
            if(this.cachedRawTransactions.get(txid)! !== "waiting")
                this.retrieveRawTransaction(txid);

            // Wait for previously a initiated download to completed
            await this.waitForTransactionDownloadToComplete(txid);
        }

        let validation = this.cachedValidations.get(txid)!;
        let transaction = this.cachedRawTransactions.get(txid)!;

        // Handle case where txid is already in the process of being validated from a previous call
        if(validation.waiting) {
            await this.waitForCurrentValidationProcessing(txid);
            if(typeof validation.validity === 'boolean' && !tokenIdFilter && !tokenTypeFilter) {
                return validation.validity!;
            }
        }

        validation.waiting = true;

        // Check SLP message validity
        let txn: Transaction = Transaction.parseFromBuffer(transaction);
        let slpmsg: SlpTransactionDetails;
        try {
            slpmsg = validation.details = Slp.parseSlpOutputScript(txn.outputs[0].scriptPubKey);
            if(slpmsg.transactionType === SlpTransactionType.GENESIS)
                slpmsg.tokenIdHex = txid;
        } catch(e) {
            validation.validity = false;
            validation.waiting = false;
            validation.invalidReason = "SLP OP_RETURN parsing error (" + e.message + ").";
            return validation.validity!;
        }

        // Check for tokenId filter
        if(tokenIdFilter && slpmsg.tokenIdHex !== tokenIdFilter) {
            validation.waiting = false;
            validation.invalidReason = "Validator was run with filter only considering tokenId " + tokenIdFilter + " as valid.";
            return false; // Don't save boolean result to cache incase cache is ever used without tokenIdFilter.
        } else {
            if(validation.validity !== false)
                validation.invalidReason = null;
        }

        // Check specified token type is being respected
        if(tokenTypeFilter && slpmsg.versionType !== tokenTypeFilter) {
            validation.validity = null;
            validation.waiting = false;
            validation.invalidReason = "Validator was run with filter only considering token type: " + tokenTypeFilter + " as valid.";
            return false; // Don't save boolean result to cache incase cache is ever used with different token type.
        } else {
            if(validation.validity !== false)
                validation.invalidReason = null;
        }

        // Check DAG validity
        if(slpmsg.transactionType === SlpTransactionType.GENESIS) {
            // Check for NFT1 child (type 0x41)
            if(slpmsg.versionType === 0x41) { 
                // An NFT1 parent should be provided at input index 0, 
                // so we check this first before checking the whole parent DAG
                let input_txid = txn.inputs[0].previousTxHash;
                let input_txhex = await this.retrieveRawTransaction(input_txid);
                let input_tx: Transaction = Transaction.parseFromBuffer(input_txhex);
                let input_slpmsg;
                try {
                    input_slpmsg = Slp.parseSlpOutputScript(input_tx.outputs[0].scriptPubKey);
                } catch(_) { }
                if(!input_slpmsg || input_slpmsg.versionType !== 0x81) {
                    validation.validity = false;
                    validation.waiting = false;
                    validation.invalidReason = "NFT1 child GENESIS does not have a valid NFT1 parent input.";
                    return validation.validity!;
                }
                // Check that the there is a burned output >0 in the parent txn SLP message
                if(input_slpmsg.transactionType === SlpTransactionType.SEND &&
                    (!input_slpmsg.sendOutputs![1].gt(0))) 
                {
                    validation.validity = false;
                    validation.waiting = false;
                    validation.invalidReason = "NFT1 child's parent has SLP output that is not greater than zero.";
                    return validation.validity!;
                } else if((input_slpmsg.transactionType === SlpTransactionType.GENESIS ||
                            input_slpmsg.transactionType === SlpTransactionType.MINT) &&
                            !input_slpmsg.genesisOrMintQuantity!.gt(0))
                {
                    validation.validity = false;
                    validation.waiting = false;
                    validation.invalidReason = "NFT1 child's parent has SLP output that is not greater than zero.";
                    return validation.validity!;
                }
                // Continue to check the NFT1 parent DAG
                let nft_parent_dag_validity = await this.isValidSlpTxid({txid: input_txid, tokenIdFilter: undefined, tokenTypeFilter: 0x81 });
                validation.validity = nft_parent_dag_validity;
                validation.waiting = false;
                if(!nft_parent_dag_validity) {
                    validation.invalidReason = "NFT1 child GENESIS does not have valid parent DAG."
                }
                return validation.validity!;
            } 
            // All other supported token types (includes 0x01 and 0x81)
            // No need to check type here since op_return parser throws on other types.
            else {
                validation.validity = true;
                validation.waiting = false;
                return validation.validity!;
            }
        }
        else if (slpmsg.transactionType === SlpTransactionType.MINT) {
            for(let i = 0; i < txn.inputs.length; i++) {
                let input_txid = txn.inputs[i].previousTxHash;
                let input_txhex = await this.retrieveRawTransaction(input_txid);
                let input_tx: Transaction = Transaction.parseFromBuffer(input_txhex);
                try {
                    let input_slpmsg = Slp.parseSlpOutputScript(input_tx.outputs[0].scriptPubKey);
                    if(input_slpmsg.transactionType === SlpTransactionType.GENESIS)
                        input_slpmsg.tokenIdHex = input_txid;
                    if(input_slpmsg.tokenIdHex === slpmsg.tokenIdHex) {
                        if(input_slpmsg.transactionType === SlpTransactionType.GENESIS || input_slpmsg.transactionType === SlpTransactionType.MINT) {
                            if(txn.inputs[i].previousTxOutIndex === input_slpmsg.batonVout) {
                                validation.parents.push({ 
                                    txid: txn.inputs[i].previousTxHash, 
                                    vout: txn.inputs[i].previousTxOutIndex, 
                                    versionType: input_slpmsg.versionType,
                                    valid: null,
                                    inputQty: null 
                                })
                            }
                        }
                    }
                } catch(_) {}
            }
            if(validation.parents.length !== 1) {
                validation.validity = false;
                validation.waiting = false;
                validation.invalidReason = "MINT transaction must have 1 valid baton parent."
                return validation.validity!;
            }
        }
        else if(slpmsg.transactionType === SlpTransactionType.SEND) {
            let tokenOutQty = slpmsg.sendOutputs!.reduce((t,v)=>{ return t.plus(v) }, new Big(0))
            let tokenInQty = new Big(0);
            for(let i = 0; i < txn.inputs.length; i++) {
                let input_txid = txn.inputs[i].previousTxHash;
                let input_txhex = await this.retrieveRawTransaction(input_txid);
                let input_tx: Transaction = Transaction.parseFromBuffer(input_txhex);
                try {
                    let input_slpmsg = Slp.parseSlpOutputScript(input_tx.outputs[0].scriptPubKey)
                    if(input_slpmsg.transactionType === SlpTransactionType.GENESIS)
                        input_slpmsg.tokenIdHex = input_txid;
                    if(input_slpmsg.tokenIdHex === slpmsg.tokenIdHex) {
                        if(input_slpmsg.transactionType === SlpTransactionType.SEND) {
                            if(txn.inputs[i].previousTxOutIndex <= input_slpmsg.sendOutputs!.length-1) {
                                tokenInQty = tokenInQty.plus(input_slpmsg.sendOutputs![txn.inputs[i].previousTxOutIndex])
                                validation.parents.push({ 
                                    txid: txn.inputs[i].previousTxHash, 
                                    vout: txn.inputs[i].previousTxOutIndex, 
                                    versionType: input_slpmsg.versionType, 
                                    valid: null, 
                                    inputQty: input_slpmsg.sendOutputs![txn.inputs[i].previousTxOutIndex] 
                                })
                            }
                        }
                        else if(input_slpmsg.transactionType === SlpTransactionType.GENESIS || input_slpmsg.transactionType === SlpTransactionType.MINT) {
                            if(txn.inputs[i].previousTxOutIndex === 1) {
                                tokenInQty = tokenInQty.plus(input_slpmsg.genesisOrMintQuantity!)
                                validation.parents.push({ 
                                    txid: txn.inputs[i].previousTxHash, 
                                    vout: txn.inputs[i].previousTxOutIndex, 
                                    versionType: input_slpmsg.versionType, 
                                    valid: null, 
                                    inputQty: input_slpmsg.genesisOrMintQuantity 
                                })
                            }
                        }
                    }
                } catch(_) {}
            }

            // Check token inputs are greater than token outputs (includes valid and invalid inputs)
            if(tokenOutQty.gt(tokenInQty)) {
                validation.validity = false;
                validation.waiting = false;
                validation.invalidReason = "Token outputs are greater than possible token inputs."
                return validation.validity!;
            }
        }

        // Set validity validation-cache for parents, and handle MINT condition with no valid input
        // we don't need to check proper token id since we only added parents with same ID in above steps.
        let parentTxids = [...new Set(validation.parents.map(p => p.txid))];
        for(let i = 0; i < parentTxids.length; i++) {
            let valid = await this.isValidSlpTxid({ txid: parentTxids[i] }) 
            validation.parents.filter(p => p.txid === parentTxids[i]).map(p => p.valid = valid);
            if(validation.details!.transactionType === SlpTransactionType.MINT && !valid) {
                validation.validity = false;
                validation.waiting = false;
                validation.invalidReason = "MINT transaction with invalid baton parent."
                return validation.validity!;
            }
        }

        // Check valid inputs are greater than token outputs
        if(validation.details!.transactionType === SlpTransactionType.SEND) {
            let validInputQty = validation.parents.reduce((t, v) => { return v.valid ? t.plus(v.inputQty!) : t }, new Big(0));
            let tokenOutQty = slpmsg.sendOutputs!.reduce((t,v)=>{ return t.plus(v) }, new Big(0))
            if(tokenOutQty.gt(validInputQty)) {
                validation.validity = false;
                validation.waiting = false;
                validation.invalidReason = "Token outputs are greater than valid token inputs."
                return validation.validity!;
            }
        }

        // Check versionType is not different from valid parents
        if(validation.parents.filter(p => p.valid).length > 0) {
            let validVersionType = validation.parents.find(p => p.valid!)!.versionType;
            if(validation.details!.versionType !== validVersionType) {
                validation.validity = false;
                validation.waiting = false;
                validation.invalidReason = "SLP version/type mismatch from valid parent."
                return validation.validity!;
            }
        }
        validation.validity = true;
        validation.waiting = false;
        return validation.validity!;
    }

    async validateSlpTransactions(txids: string[]): Promise<string[]> {
        let res = [];
        for (let i = 0; i < txids.length; i++) {
            res.push((await this.isValidSlpTxid({ txid: txids[i] })) ? txids[i] : '')
        }
        return res.filter((id: string) => id.length > 0);
    }
}

class MapCache<T, M> {
    private map = new Map<T, M>()
    private list: T[] = [];
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    get length(): number {
        return this.list.length;
    }

    set(key: T, item: M) {
        this.list.push(key);
        this.map.set(key, item);
        if(this.map.size > this.maxSize) {
            this.shift();
        }
    }

    get(key: T) {
        return this.map.get(key);
    }

    has(key: T) {
        return this.map.has(key);
    }

    private shift(): T | undefined {
        let key = this.list.shift();
        if(key)
            this.map.delete(key);
        return key;
    }

    clear() {
        this.list = [];
        this.map.clear();
    }
}
