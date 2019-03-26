'use strict';

var util = require('util');
var path = require('path');
var hfc = require('fabric-client');

var helper = require('./helper.js');
var logger = helper.getLogger('install-chaincode');

/**
 * Install chaincode cho các peer
 * @param {Array<string>} peers 
 * @param {string} chaincodeName 
 * @param {string} chaincodePath e.g. 'github.com/example_cc/go' || 
 * @param {string} chaincodeVersion e.g. 'v0'
 * @param {string} ChaincodeType e.g. 'node', 'golang'
 * @param {string} orgName 
 * @param {string} username 
 */
async function installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, ChaincodeType, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Thực hiện install chaincode
     *  (3) Kiểm tra 
     */

    logger.debug('\n\n============ Install chaincode on organizations ============\n');
    
    process.env.GOPATH = path.join(__dirname, hfc.getConfigSetting('CC_SRC_PATH'));
    let SRC_PATH = path.join(__dirname, hfc.getConfigSetting('CC_SRC_PATH'));
    console.log("hello", SRC_PATH);
    
    let errorMessage = null;

    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);
		logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

        // (2) Thực hiện install chaincode
        let request = {
            targets: peers,
            chaincodeId: chaincodeName,
            chaincodeVersion: chaincodeVersion,
            chaincodePath: (ChaincodeType == 'node') ? (SRC_PATH + chaincodePath) : chaincodePath,
            chaincodeType: ChaincodeType
        };
        let results = await client.installChaincode(request);

        // (3) Kiểm tra 
        let proposalResponses = results[0]; // mảng các response của request install trên từng peer yêu cầu

        for (let i in proposalResponses) {
            if (proposalResponses[i] instanceof Error) {
				errorMessage = util.format('install proposal resulted in an error :: %s', proposalResponses[i].toString());
				logger.error(errorMessage);
            } else if (proposalResponses[i].response && proposalResponses[i].response.status === 200) {
                logger.info('install proposal was good');
            } else {
				errorMessage = util.format('install proposal was bad for an unknown reason %j', proposalResponses[i]);
				logger.error(errorMessage);
            }
        }
    } catch (err) {
		logger.error('Failed to install due to error: ' + err.stack ? err.stack : err);
        errorMessage = err.toString();

    }

    if (!errorMessage) {
		let message = util.format('Successfully installed chaincode');
		logger.info(message);
        // build a response to send back to the REST caller
        const response = {
            success: true,
            message: message
        };
        return response;
    } else {
		let message = util.format('Failed to install due to:%s',errorMessage);
		logger.error(message);
        const response = {
            success: false,
            message: message
        };
        return response;
    }
}
exports.installChaincode = installChaincode;