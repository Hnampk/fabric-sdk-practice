'use strict';

const util = require('util');
const helper = require('./helper.js');
const logger = helper.getLogger('instantiate-chaincode');

/**
 * Instantiate chaincode lên channel
 * @param {Array<string>} peers 
 * @param {string} channelName 
 * @param {string} chaincodeName 
 * @param {string} chaincodeVersion  e.g. 'v0'
 * @param {string} ChaincodeType  e.g. 'node', 'golang' 
 * @param {string} functionName bỏ trống, null hoặc 'init'
 * @param {Array<string>} args danh sách các state khởi tạo
 * @param {string} orgName 
 * @param {string} username 
 */
async function instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, ChaincodeType, functionName, args, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Thiết lập instance của channel và kiểm tra thông tin
     *  (3) Gửi yêu cầu instantiate đến các endorser
     *  (4) Kiểm tra response, nếu hợp lệ, thực hiện tiếp
     *  ---
     *  (5) Thiết lập các EventHub để lắng nghe sự kiện instantiate
     *  (6) Thực hiện gửi request proposal đến orderer
     *  ---
     *  (7) Close channel
     */

    logger.debug('\n\n============ Instantiate chaincode on channel ' + channelName +
        ' ============\n');

    let errorMessage = null;
    let channel = null;

    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);
        logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

        // (2) Thiết lập instance của channel và kiểm tra thông tin
        channel = client.getChannel(channelName);

        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            throw new Error(message);
        }

        // (3) Gửi yêu cầu đến các endorser
        let txId = client.newTransactionID(true);
        let request = {
            targets: peers,
            chaincodeType: ChaincodeType,
            chaincodeId: chaincodeName,
            chaincodeVersion: chaincodeVersion,
            txId: txId,
            args: args,
            'endorsement-policy': {
                identities: [{
                        role: {
                            name: 'member',
                            mspId: 'Org1MSP'
                        }
                    },
                    {
                        role: {
                            name: 'member',
                            mspId: 'Org2MSP'
                        }
                    }
                ],
                policy: {
                    '1-of': [{
                        'signed-by': 0
                    }, {
                        'signed-by': 1
                    }]
                }
            }
        };

        if (functionName) {
            request.fcn = functionName;
        }

        // Phản hồi nhận lại bao gồm tình hình cái đặt trên từng peer
        // và proposal kèm chữ ký của các endorser
        let results = await channel.sendInstantiateProposal(request, 60000);

        // (4) Kiểm tra response
        let proposalResponses = results[0]; // mảng các response của request trên từng peer yêu cầu
        let allGood = true;

        for (let i in proposalResponses) {
            if (proposalResponses[i] instanceof Error) {
                allGood = false;
                errorMessage = util.format('instantiate proposal resulted in an error :: %s', proposalResponses[i].toString());
                logger.error(errorMessage);
            } else if (proposalResponses[i].response && proposalResponses[i].response.status === 200) {
                logger.info('instantiate proposal was good');
            } else {
                allGood = false;
                errorMessage = util.format('instantiate proposal was bad for an unknown reason %j', proposalResponses[i]);
                logger.error(errorMessage);
            }
        }

        // Các response hợp lệ
        if (allGood) {
            logger.info(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                proposalResponses[0].response.status, proposalResponses[0].response.message,
                proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));;

            // (5) Thiết lập các EventHub để lắng nghe sự kiện instantiate
            let promises = [];
            let eventHubs = channel.getChannelEventHubsForOrg(); // Danh sách các ChannelEventHub của org hiện tại
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
                        rej(err);
                    }, {
                        unregister: true,
                        disconnect: true // tự động disconnect sau khi hoàn thành
                    });
                    eh.connect();
                });
                promises.push(instanceEventPromise);
            });

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
        }
    } catch (err) {
		logger.error('Failed to send instantiate due to error: ' + err.stack ? err.stack : err);
        errorMessage = err.toString();
    } finally {
        // (7) Close channel
        if (channel) {
            channel.close();
        }
    }

    let success = true;
	let message = util.format('Successfully instantiate chaincode in organization %s to the channel \'%s\'', orgName, channelName);

    if (errorMessage) {
		message = util.format('Failed to instantiate the chaincode. cause:%s',errorMessage);
        success = false;
        logger.error(message);
    }
    else{
		logger.info(message);
    }

    return {
        success: success,
        message: message
    }
}

exports.instantiateChaincode = instantiateChaincode;