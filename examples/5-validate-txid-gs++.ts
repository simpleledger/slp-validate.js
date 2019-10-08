/***************************************************************************************
 * 
 *  Example 5: Validate using gs++ server.
 * 
 *  Instructions:
 *      (1) - Optional: Setup SLP graph search server URL
 *      (2) - Optional: set custom txid.
 * 
 * ************************************************************************************/

import { ValidatorType1, Crypto } from '../index';
import { GraphSearchClient } from 'grpc-slp-graphsearch-node';

const txid = "ecaaf0a4de119a59a440089c99a2c103791dbd06086472ff8ff4229c5cd7cc4f";

(async function() {
    console.time("SLP-VALIDATE-W-GRAPH-SEARCH");

    // perform graph search
    let gs = new GraphSearchClient(); // optional set server url
    let dag = new Map<string, Buffer>();
    (await gs.graphSearchFor(txid)).getTxdataList_asU8().forEach(txn => { 
        let txnBuf = Buffer.from(txn);
        let id = Crypto.hash256(txnBuf).toString('hex');
        dag.set(id, txnBuf);
    });

    // create SLP validator
    let getRawTransaction =  async (id: string) => {
        if(dag.has(id)) return dag.get(id)!;
        else return Buffer.alloc(60);
    }
    const slpValidator = new ValidatorType1({ getRawTransaction });

    console.log("Validating:", txid);
    console.log("This may take a several seconds...");
    let isValid = await slpValidator.isValidSlpTxid({ txid });
    console.log("Final Result:", isValid);
    console.log("WARNING: THIS VALIDATION METHOD COMES WITH NO BURN PROTECTION.")
    console.timeEnd("SLP-VALIDATE-W-GRAPH-SEARCH");
})();
