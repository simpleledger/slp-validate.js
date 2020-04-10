/***************************************************************************************
 *
 *  Example 4: Validate a specific txid using BCHD gRPC.
 *
 *  Instructions:
 *      (1) - Set bitcoind RPC user, password, and URL.
 *      (2) - Optional: set custom txid.
 *
 * ************************************************************************************/

import { GrpcClient } from "grpc-bchrpc-node";
import { ValidatorType1 } from "../lib/index";

const GRPC_URL = "localhost:8335";
// const GRPC_CERT = '/Users/jamescramer/Library/Application Support/Bchd/rpc.cert';
const GRPC_CERT = "<path to your BCHD cert>";

const txid = "cecf484fa8b65b938131392e8e0e0a83a939c83d2e3f6673e28349ad5cc74244";

(async function() {
    console.time("SLP-VALIDATE-GRPC");
    const rpc = new GrpcClient({ url: GRPC_URL, rootCertPath: GRPC_CERT });
    const slpValidator = new ValidatorType1({ getRawTransaction: async (txid: string) => {
        const res = await rpc.getRawTransaction({ hash: txid, reversedHashOrder: true});
        return Buffer.from(res.getTransaction_asU8());
    } });
    console.log("Validating:", txid);
    console.log("This may take a several seconds...");
    const isValid = await slpValidator.isValidSlpTxid({ txid });
    console.log("Final Result:", isValid);
    console.log("WARNING: THIS VALIDATION METHOD COMES WITH NO BURN PROTECTION.");
    console.timeEnd("SLP-VALIDATE-GRPC");
})();
