/***************************************************************************************
 *
 *  Example 5: Validate using gs++ server.
 *
 *  Instructions:
 *      (1) - Set "txid" and "excludeList"
 *
 * ************************************************************************************/

import { GraphSearchClient } from "grpc-graphsearch-node";
import { Crypto, ValidatorType1 } from "../lib/index";

// Transaction to validate
const txid = "3ff425384539519e815507f7f6739d9c12a44af84ff895601606b85157e0fb19";

// List of known valid txids, this will greatly reduce load on the graphsearch server
const excludeList: string[] = [
    "daaac179106abf8ca2946ee7415d9cca1c6648ce1ba1f5ce3dd4e7ad090482a7",
    "56c2ddcaf9ebb3785f3ca0a1c136c793bd33dd7e019a77bf1193bc8ef77eb38f",
    "9a64336b6f11235b415b278c5690b6538ff14197af00ebc5abf93e318b1debae",
];

// create SLP validator
const dag = new Map<string, Buffer>();
const getRawTransaction = async (id: string) => {
    if (! dag.has(id)) {
        if (! excludeList.includes(id)) {
            { return Buffer.alloc(60); }
        }
        throw Error(`gs++ server response is missing txid ${id}`);
    }
    return dag.get(id)!;
};
const validator = new ValidatorType1({ getRawTransaction });

for (const validTxid of excludeList) {
    validator.addValidTxidFromStore(validTxid);
}

(async () => {
    console.time("SLP-VALIDATE-W-GRAPH-SEARCH");

    // perform graph search
    const gs = new GraphSearchClient({url: "0.0.0.0:50051"}); // optional set server url
    let downloadCount = 0;
    (await gs.graphSearchFor({hash: txid, excludeList})).getTxdataList_asU8().forEach((txn) => {
        const txnBuf = Buffer.from(txn);
        const id = Crypto.HashTxid(txnBuf).toString("hex");
        downloadCount++;
        dag.set(id, txnBuf);
    });

    console.log(`Validating: ${txid}`);
    console.log(`This may take a several seconds...`);
    const isValid = await validator.isValidSlpTxid({ txid });
    console.log(`Final Result: ${isValid}`);
    console.log(`Transactions Downloaded: ${downloadCount}`);
    console.log(`WARNING: THIS VALIDATION METHOD COMES WITH NO BURN PROTECTION.`);
    console.timeEnd(`SLP-VALIDATE-W-GRAPH-SEARCH`);
})();
