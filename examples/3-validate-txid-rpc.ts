/***************************************************************************************
 *
 *  Example 3: Validate a specific txid.  This method comes with no burn protections.
 *
 *  Instructions:
 *      (1) - Set bitcoind RPC user, password, and URL.
 *      (2) - Optional: set custom txid.
 *
 * ************************************************************************************/

import { ValidatorType1 } from "../lib/index";
const RpcClient = require("bitcoin-rpc-promise-retry");

const RPC_USER_NAME = "bitcoin";
const RPC_PASSWORD = "password";
const RPC_URL = "localhost:8332";

const txid = "3ff425384539519e815507f7f6739d9c12a44af84ff895601606b85157e0fb19";

(async () => {
    console.time("SLP-VALIDATE-RPC");
    const connectionString = `http://${RPC_USER_NAME}:${RPC_PASSWORD}@${RPC_URL}`;
    const rpc = new RpcClient(connectionString);
    const slpValidator = new ValidatorType1({ getRawTransaction: async (txid) => await rpc.getRawTransaction(txid) });
    console.log("Validating:", txid);
    console.log("This may take a several seconds...");
    let isValid = await slpValidator.isValidSlpTxid({ txid });
    console.log("Final Result:", isValid);
    console.timeEnd("SLP-VALIDATE-RPC");
})();
