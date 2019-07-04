'use strict';
const hfc = require('fabric-client');
var path = require('path');
var util = require('util');

const helper = require('../utils/helper');
const logger = require('../utils/common/logger').getLogger('services/chaincode');
const preRes = require('../utils/common/pre-response');

const channelService = require('./channel');

/**
 * Lấy danh sách các chaincode đã install trên peer
 * @param {string} peer 
 * @param {string} orgName 
 * @param {string} username 
 */
async function getInstalledChaincodes(peer, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Query lấy danh sách các chaincode
     */

    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);

        // (2) Query lấy danh sách các chaincode
        let response = await client.queryInstalledChaincodes(peer, true);

        if (response.chaincodes < 1) {
            return preRes.getSuccessResponse(peer + ' did not install any chaincodes!');
        }

        return preRes.getSuccessResponse('Successfully get the installed chaincodes of ' + peer + '!', { peer: peer, chaincodes: response.chaincodes });
    } catch (e) {
        return preRes.getFailureResponse(e.toString());
    }

}

/**
 * Lấy danh sách các chaincode đã triển khai trên channel
 * @param {string} channelName 
 * @param {string} orgName 
 * @param {string} username 
 */
async function getInstantiatedChaincodes(channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập instance của channel và kiểm tra thông tin
     *  (2) Query lấy danh sách các chaincode
     *  (3) Close channel
     */

    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await channelService._getClientWithChannel(channelName, orgName, username);

        // (2) Query lấy danh sách các chaincode
        let response = await channel.queryInstantiatedChaincodes(null, true);

        if (response.chaincodes < 1) {
            return preRes.getSuccessResponse('List of instantiated chaincodes is empty!');
        }

        return preRes.getSuccessResponse('Successfully get the instantiated chaincodes on channel ' + channelName + '!', { channel: channelName, chaincodes: response.chaincodes });
    } catch (e) {
        return preRes.getFailureResponse(e.toString());
    } finally {
        // (3) Close channel
        if (channel) channel.close()
    }
}

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
            chaincodePath: ((ChaincodeType == 'node') || ChaincodeType == 'java') ? (SRC_PATH + chaincodePath) : chaincodePath,
            chaincodeType: ChaincodeType
        };
        let results = await client.installChaincode(request);

        // (3) Kiểm tra 
        let proposalResponses = results[0]; // mảng các response của request install trên từng peer yêu cầu

        errorMessage = checkResponse(proposalResponses, "install");
    } catch (err) {
        logger.error('Failed to install due to error: ' + err.stack ? err.stack : err);
        errorMessage = err.toString();

    }

    if (!errorMessage) {
        let message = util.format('Successfully installed chaincode');
        logger.info(message);

        return preRes.getSuccessResponse(message);
    } else {
        let message = util.format('Failed to install due to:%s', errorMessage);
        logger.error(message);

        return preRes.getFailureResponse(message);
    }
}

async function installChaincodeByPackage(peers, chaincodePackage, orgName, username) {
    let errorMessage = null;

    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);

        let request = {
            targets: peers,
            chaincodePackage: chaincodePackage
        }

        let results = await client.installChaincode(request);

        // (3) Kiểm tra 
        let proposalResponses = results[0]; // mảng các response của request install trên từng peer yêu cầu

        errorMessage = checkResponse(proposalResponses, "install");
    } catch (e) {
        console.log("ERRRR", e)
    }

    if (!errorMessage) {
        let message = util.format('Successfully installed chaincode');
        logger.info(message);

        return preRes.getSuccessResponse(message);
    } else {
        let message = util.format('Failed to install due to:%s', errorMessage);
        logger.error(message);

        return preRes.getFailureResponse(message);
    }
}

/**
 * Instantiate chaincode lên channel
 * @param {Array<string>} peers 
 * @param {string} channelName 
 * @param {string} chaincodeName 
 * @param {string} chaincodeVersion  e.g. 'v0'
 * @param {string} chaincodeType  e.g. 'node', 'golang', 'java'
 * @param {string} functionName bỏ trống, null hoặc 'init'
 * @param {Array<string>} args danh sách các state khởi tạo
 * @param {} endorsementPolicy https://fabric-sdk-node.github.io/release-1.4/global.html#ChaincodeInstantiateUpgradeRequest
 * @param {string} orgName 
 * @param {string} username 
 */
async function instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, functionName, args, endorsementPolicy, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập instance của channel và kiểm tra thông tin
     *  (2) Gửi yêu cầu instantiate đến các endorser
     *  (3) Kiểm tra response, nếu hợp lệ, thực hiện tiếp
     *  ---
     *  (4) Thiết lập các EventHub để lắng nghe sự kiện instantiate
     *  (5) Thực hiện gửi request proposal đến orderer
     *  ---
     *  (6) Close channel
     */

    logger.debug('\n\n============ Instantiate chaincode on channel ' + channelName +
        ' ============\n');

    let errorMessage = null;

    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await channelService._getClientWithChannel(channelName, orgName, username);

        // (2) Gửi yêu cầu đến các endorser
        let txId = client.newTransactionID(true);
        let request = {
            targets: peers,
            chaincodeType: chaincodeType,
            chaincodeId: chaincodeName,
            chaincodeVersion: chaincodeVersion,
            txId: txId,
            args: args,
            'endorsement-policy': endorsementPolicy
        };

        if (functionName) {
            request.fcn = functionName;
        }

        // Phản hồi nhận lại bao gồm tình hình cái đặt trên từng peer
        // và proposal kèm chữ ký của các endorser
        let results = await channel.sendInstantiateProposal(request, 60000);

        // (3) Kiểm tra response
        let proposalResponses = results[0]; // mảng các response của request trên từng peer yêu cầu
        let allGood = true;

        errorMessage = checkResponse(proposalResponses, "instantiate");

        if (errorMessage) {
            allGood = false;
        }

        // Các response hợp lệ
        if (allGood) {
            logger.info(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                proposalResponses[0].response.status, proposalResponses[0].response.message,
                proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));;

            errorMessage = await onProposalProcess(results, channel, orgName, txId);
        }
    } catch (err) {
        logger.error('Failed to send instantiate due to error: ' + err.stack ? err.stack : err);
        errorMessage = err.toString();
    } finally {
        // (6) Close channel
        if (channel) {
            channel.close();
        }
    }

    if (errorMessage) {
        let message = util.format('Failed to instantiate the chaincode. cause:%s', errorMessage);
        logger.error(message);

        return preRes.getFailureResponse(message);
    } else {
        let message = util.format('Successfully instantiate chaincode in organization %s to the channel \'%s\'', orgName, channelName);
        logger.info(message);

        return preRes.getSuccessResponse(message);
    }
}

async function upgradeChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, functionName, args, endorsementPolicy, orgName, username) {

    logger.debug('\n\n============ upgrade chaincode on channel ' + channelName +
        ' ============\n');

    let errorMessage = null;

    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await channelService._getClientWithChannel(channelName, orgName, username);

        // (2) Gửi yêu cầu đến các endorser
        let txId = client.newTransactionID(true);
        let request = {
            targets: peers,
            chaincodeType: chaincodeType,
            chaincodeId: chaincodeName,
            chaincodeVersion: chaincodeVersion,
            txId: txId,
            args: args,
            'endorsement-policy': endorsementPolicy
        };

        if (functionName) {
            request.fcn = functionName;
        }

        // Phản hồi nhận lại bao gồm tình hình cái đặt trên từng peer
        // và proposal kèm chữ ký của các endorser
        let results = await channel.sendUpgradeProposal(request, 60000);

        // (3) Kiểm tra response
        let proposalResponses = results[0]; // mảng các response của request trên từng peer yêu cầu
        let allGood = true;

        errorMessage = checkResponse(proposalResponses, "upgrade");

        if (errorMessage) {
            allGood = false;
        }

        // Các response hợp lệ
        if (allGood) {
            logger.info(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                proposalResponses[0].response.status, proposalResponses[0].response.message,
                proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));;

            errorMessage = await onProposalProcess(results, channel, orgName, txId);
        }
    } catch (err) {
        logger.error('Failed to send upgrade due to error: ' + err.stack ? err.stack : err);
        errorMessage = err.toString();
    } finally {
        // (6) Close channel
        if (channel) {
            channel.close();
        }
    }

    if (errorMessage) {
        let message = util.format('Failed to upgrade the chaincode. cause:%s', errorMessage);
        logger.error(message);

        return preRes.getFailureResponse(message);
    } else {
        let message = util.format('Successfully upgrade chaincode in organization %s to the channel \'%s\'', orgName, channelName);
        logger.info(message);

        return preRes.getSuccessResponse(message);
    }
}

/**
 * Query chaincode
 * @param {Array<string>} peers SDK hỗ trợ query multiple peers
 * @param {string} chaincodeName 
 * @param {string} funtionName 
 * @param {string} args 
 * @param {string} channelName 
 * @param {string} orgName 
 * @param {string} username 
 */
async function query(peers, chaincodeName, funtionName, args, channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Thiết lập instance của channel và kiểm tra thông tin
     *  (3) Gửi request query chaincode
     * 
     *  (4) Close channel
     */

    try {

        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await channelService._getClientWithChannel(channelName, orgName, username);

        // (3) Gửi request query chaincode
        let request = {
            chaincodeId: chaincodeName,
            fcn: funtionName,
            args: args
        };

        if (peers) {
            request['targets'] = peers
        }

        let queryResponse = await channel.queryByChaincode(request);

        if (queryResponse) {
            for (let i = 0; i < queryResponse.length; i++) {
                if (queryResponse[i] instanceof Error) {
                    logger.error(queryResponse[i].toString());
                    throw new Error(queryResponse[i].toString());
                }
                logger.info(args[0] + ' now has ' + queryResponse[i].toString('utf8') +
                    ' after the move');
            }
            return preRes.getSuccessResponse(args[0] + ' now has ' + queryResponse[0].toString('utf8') +
                ' after the move');
        } else {
            logger.error('queryResponse is null');
            return preRes.getFailureResponse('queryResponse is null');
        }
    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);
        return preRes.getFailureResponse(err.toString());
    } finally {
        // (4) Close channel
        if (channel) {
            channel.close();
        }
    }
}

/**
 * 
 * @param {*} peers 
 * @param {*} chaincodeName 
 * @param {*} functionName 
 * @param {*} args 
 * @param {*} channelName 
 * @param {*} orgName 
 * @param {*} username 
 */
async function invokeChaincode(peers, chaincodeName, functionName, args, channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Thiết lập instance của channel và kiểm tra thông tin
     *  (3) Gửi request yêu cầu đến các endorser
     *  (4) Kiểm tra response, nếu hợp lệ, thực hiện tiếp
     *  ---
     *  (5) Thiết lập các EventHub để lắng nghe sự kiện
     *  (6) Thực hiện gửi request proposal đến orderer
     *  ---
     *  (7) Close channel
     */
    logger.debug(util.format('\n============ invoke transaction on channel %s ============\n', channelName));

    let errorMessage = "";

    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await channelService._getClientWithChannel(channelName, orgName, username);

        // (3) Gửi request yêu cầu đến các endorser
        let txId = client.newTransactionID();

        let request = {
            chaincodeId: chaincodeName,
            txId: txId,
            fcn: functionName,
            args: args,
        }

        if (peers) {
            request['targets'] = peers
        }

        console.log(request);

        let results = await channel.sendTransactionProposal(request);

        // (4) Kiểm tra response, nếu hợp lệ, thực hiện tiếp
        let proposalResponses = results[0];
        let allGood = true;

        errorMessage = checkResponse(proposalResponses, "instantiate");

        if (errorMessage) {
            allGood = false;
        }

        if (allGood) {
            logger.info(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                proposalResponses[0].response.status, proposalResponses[0].response.message,
                proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));

            errorMessage = await onProposalProcess(results, channel, orgName, txId);

            if (!errorMessage) {
                return preRes.getSuccessResponse("The invoke chaincode transaction was valid");
            } else {
                return preRes.getFailureResponse(errorMessage)
            }
        } else {
            return preRes.getFailureResponse(errorMessage)
        }
    } catch (err) {
        logger.error('Failed to send instantiate due to error: ' + err.stack ? err.stack : err);
        errorMessage = err.toString();

        return preRes.getFailureResponse(errorMessage)
    } finally {
        // (7) Close channel
        if (channel) {
            channel.close();
        }
    }
}

function checkResponse(proposalResponses, type) {
    let errorMessage = "";
    for (let i in proposalResponses) {
        if (proposalResponses[i] instanceof Error) {
            errorMessage = util.format(type + ' proposal resulted in an error :: %s', proposalResponses[i].toString());
            logger.error(errorMessage);
        } else if (proposalResponses[i].response && proposalResponses[i].response.status === 200) {
            logger.info(type + ' proposal was good');
        } else {
            errorMessage = util.format(type + ' proposal was bad for an unknown reason %j', proposalResponses[i]);
            logger.error(errorMessage);
        }
    }

    return errorMessage;
}

async function onProposalProcess(results, channel, orgName, txId) {
    let proposalResponses = results[0];
    let promises = [];
    let errorMessage = "";
    // Danh sách các ChannelEventHub của org hiện tại
    let eventHubs = channel.getChannelEventHubsForOrg();

    promises = await eventHubHandler(eventHubs, orgName, txId);


    // (6) Thực hiện gửi proposal đến orderer
    let proposal = results[1]; // proposal dùng gửi cho orderer
    let ordererRequest = {
        txId: txId, // txId của proposal request để  đảm bảo tx được ký bỏi cùng admin
        proposalResponses: proposalResponses,
        proposal: proposal
    };
    let sendPromise = channel.sendTransaction(ordererRequest);

    promises.push(sendPromise);

    let submittingResults = await Promise.all(promises);
    logger.debug(util.format('------->>> R E S P O N S E : %j', results));
    let response = submittingResults.pop(); // response của request proposal gửi đển orderer

    if (response.status === 'SUCCESS') {
        logger.info('Successfully sent transaction to the orderer.');
    } else {
        errorMessage = util.format('Failed to order the transaction. Error code: %s', response.status);
        logger.debug(errorMessage);
    }

    for (let i in submittingResults) {
        let eventHubResult = submittingResults[i];
        let eventHub = eventHubs[i];
        logger.debug('Event results for event hub :%s', eventHub.getPeerAddr());

        if (typeof eventHubResult === 'string') {
            logger.debug(eventHubResult);
        } else {
            if (!errorMessage)
                errorMessage = eventHubResult.toString();
            logger.debug(eventHubResult.toString());
        }
    }

    return errorMessage;
}

/**
 * (5) Thiết lập các EventHub để lắng nghe sự kiện
 * @param {*} eventHubs 
 * @param {*} orgName 
 * @param {*} txId 
 */
function eventHubHandler(eventHubs, orgName, txId) {
    return new Promise((res, rej) => {

        let promises = [];
        logger.debug('found %s eventhubs for this organization %s', eventHubs.length, orgName);

        eventHubs.forEach(eh => {
            let instanceEventPromise = new Promise((res, rej) => {
                logger.debug('instantiateEventPromise - setting up event');

                let eventTimeOut = setTimeout(() => {
                    let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
                    logger.error(message);
                    eh.disconnect();
                }, 60000);

                eh.registerTxEvent(txId.getTransactionID(), (tx, code, blockNum) => {
                    logger.info('The chaincode instantiate transaction has been committed on peer %s', eh.getPeerAddr());
                    logger.info('Transaction %s has status of %s in block %s', tx, code, blockNum);

                    clearTimeout(eventTimeOut);

                    // Kiểm tra trạng thái của tx
                    if (code !== 'VALID') {
                        let message = util.format('The chaincode instantiate transaction was invalid, code:%s', code);
                        logger.error(message);
                        rej(new Error(message));
                    } else {
                        let message = 'The chaincode instantiate transaction was valid.';
                        logger.info(message);
                        res(message);
                    }
                }, (err) => {
                    clearTimeout(eventTimeOut);
                    logger.error(err);
                    return;
                }, {
                    unregister: true,
                    disconnect: true // tự động disconnect sau khi hoàn thành
                });
                eh.connect();
            });
            promises.push(instanceEventPromise);
        });

        res(promises);
    })
}

/**
 * Lấy endorsement plan trước khi thực hiện Invoke chaincode
 * @param {string} peer 
 * @param {string} channelName 
 * @param {string} chaincodeName 
 * @param {string} orgName 
 * @param {string} username 
 */
async function getChaincodeEndorsementPlan(peer, channelName, chaincodeName, orgName, username) {
    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await channelService._getClientWithChannel(channelName, orgName, username);
        // default peer: peer0.org1.example.com
        await channel.initialize({
            target: peer,
            discover: true,
            asLocalhost: true,
        });

        let endorsementHint = { chaincodes: [{ name: chaincodeName }] }
        let endorsementPlan = await channel.getEndorsementPlan(endorsementHint);

        if (endorsementPlan) {
            return preRes.getSuccessResponse("Successfully get endorsement plan for chaincode " + chaincodeName, endorsementPlan);
        } else {
            return preRes.getFailureResponse("Problem occurred! Make sure that peers are running and chaincode \"" + chaincodeName + "\" is installed on needed peers!");
        }
    } catch (e) {
        return preRes.getFailureResponse(e.toString());
    } finally {
        if (channel) channel.close();
    }
}

async function test(chaincodeName, channelName, orgName, username) {
    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await channelService._getClientWithChannel(channelName, orgName, username);
        // default peer: peer0.org1.example.com
        await channel.initialize({
            target: "peer1.org1.example.com",
            discover: true,
            asLocalhost: true,
        });

        let endorsementHint = { chaincodes: [{ name: chaincodeName }] }
        let endorsementPlan = await channel.getEndorsementPlan(endorsementHint);
        console.log("endorsementPlan", endorsementPlan);
        return endorsementPlan;
    } catch (e) {
        console.log(e)
    } finally {
        if (channel) channel.close();
    }
}

exports.instantiateChaincode = instantiateChaincode;
exports.upgradeChaincode = upgradeChaincode;
exports.installChaincode = installChaincode;
exports.installChaincodeByPackage = installChaincodeByPackage;
exports.getInstalledChaincodes = getInstalledChaincodes;
exports.getInstantiatedChaincodes = getInstantiatedChaincodes;
exports.query = query;
exports.invokeChaincode = invokeChaincode;
exports.getChaincodeEndorsementPlan = getChaincodeEndorsementPlan;
exports.test = test;