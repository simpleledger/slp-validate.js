/***************************************************************************************
 *
 *  Example 5: Validate using gs++ server.
 *
 *  Instructions:
 *      (1) - Optional: Setup SLP graph search server URL
 *      (2) - Optional: set custom txid.
 *
 * ************************************************************************************/

import { GraphSearchClient } from "grpc-slp-graphsearch-node";
import { Crypto, ValidatorType1 } from "../lib/index";

const txid = "3ff425384539519e815507f7f6739d9c12a44af84ff895601606b85157e0fb19";

(async () => {
    console.time("SLP-VALIDATE-W-GRAPH-SEARCH");

    // perform graph search
    const gs = new GraphSearchClient(); // optional set server url
    const dag = new Map<string, Buffer>();
    (await gs.graphSearchFor(txid)).getTxdataList_asU8().forEach((txn) => {
        const txnBuf = Buffer.from(txn);
        const id = Crypto.hash256(txnBuf).toString("hex");
        dag.set(id, txnBuf);
    });

    // create SLP validator
    const getRawTransaction =  async (id: string) => {
        if (dag.has(id)) { return dag.get(id)!; }
        else { return Buffer.alloc(60); }
    };
    const slpValidator = new ValidatorType1({ getRawTransaction });

    console.log("Validating:", txid);
    console.log("This may take a several seconds...");
    const isValid = await slpValidator.isValidSlpTxid({ txid });
    console.log("Final Result:", isValid);
    console.log("WARNING: THIS VALIDATION METHOD COMES WITH NO BURN PROTECTION.");
    console.timeEnd("SLP-VALIDATE-W-GRAPH-SEARCH");
})();
