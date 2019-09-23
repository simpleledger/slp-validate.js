/***************************************************************************************
 * 
 *  Example 4: Validate a specific txid using BCHD gRPC.
 * 
 *  Instructions:
 *      (1) - Set bitcoind RPC user, password, and URL.
 *      (2) - Optional: set custom txid.
 * 
 * ************************************************************************************/

import { ValidatorType1 } from '../index';
import { GrpcClient } from 'grpc-bchrpc-node';

const GRPC_URL = 'localhost:8335';
//const GRPC_CERT = '/Users/jamescramer/Library/Application Support/Bchd/rpc.cert';
const GRPC_CERT = '<path to your BCHD cert>';

const txid = "9cd705998fcc233ccf0a840f4ee7fcbc1eb678eba79e708560ecc95fedecfec9";

(async function() {
    console.time("SLP-VALIDATE-GRPC");
    const rpc = new GrpcClient({ url: GRPC_URL, rootCertPath: GRPC_CERT });
    const slpValidator = new ValidatorType1({ getRawTransaction: async (txid: string) => {
        let res = await rpc.getRawTransaction({ hash: txid, reverseOrder: true});
        return Buffer.from(res.getTransaction_asU8());
    } });
    console.log("Validating:", txid);
    console.log("This may take a several seconds...");
    let isValid = await slpValidator.isValidSlpTxid({ txid });
    console.log("Final Result:", isValid);
    console.log("WARNING: THIS VALIDATION METHOD COMES WITH NO BURN PROTECTION.")
    console.timeEnd("SLP-VALIDATE-GRPC");
})();
