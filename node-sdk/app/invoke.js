'use strict';

var util = require('util');
var helper = require('./helper.js');
var logger = helper.getLogger('Invoke');

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

    let channel = null;

    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);

        // (2) Thiết lập instance của channel và kiểm tra thông tin
        channel = client.getChannel(channelName);
        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            throw new Error(message);
        }

        // (3) Gửi request yêu cầu đến các endorser
        let txId = client.newTransactionID();

        let request = {
            targets: peers,
            chaincodeId: chaincodeName,
            txId: txId,
            fcn: functionName,
            args: args,
        }

        let results = await channel.sendTransactionProposal(request);

        // (4) Kiểm tra response, nếu hợp lệ, thực hiện tiếp
        let proposalResponses = results[0];
        let allGood = true;

        for (let i in proposalResponses) {
            if (proposalResponses[i] instanceof Error) {
                allGood = false;
                errorMessage = util.format('Invoke chaincode proposal resulted in an error :: %s', proposalResponses[i].toString());
                logger.error(errorMessage);
            } else if (proposalResponses[i].response && proposalResponses[i].response.status === 200) {
                logger.info('invoke chaincode proposal was good');
            } else {
                all_good = false;
                error_message = util.format('invoke chaincode proposal failed for an unknown reason %j', proposalResponses[i]);
                logger.error(error_message);
            }
        }

        if (allGood) {
            logger.info(util.format(
                'Successfully sent Proposal and received ProposalResponse: Status - %s, message - "%s", metadata - "%s", endorsement signature: %s',
                proposalResponses[0].response.status, proposalResponses[0].response.message,
                proposalResponses[0].response.payload, proposalResponses[0].endorsement.signature));

            // (5) Thiết lập các EventHub để lắng nghe sự kiện
            let promises = [];
            let eventHubs = channel.getChannelEventHubsForOrg(); // Danh sách các ChannelEventHub của org hiện tại
            logger.debug('found %s eventhubs for this organization %s', eventHubs.length, orgName);

            eventHubs.forEach(eh => {
                let instanceEventPromise = new Promise((res, rej) => {
                    logger.debug('invokeEventPromise - setting up event');

                    let eventTimeOut = setTimeout(() => {
                        let message = 'REQUEST_TIMEOUT:' + eh.getPeerAddr();
                        logger.error(message);
                        eh.disconnect();
                    }, 60000);

                    eh.registerTxEvent(txId.getTransactionID(), (tx, code, blockNum) => {
						logger.info('The chaincode invoke chaincode transaction has been committed on peer %s',eh.getPeerAddr());
                        logger.info('Transaction %s has status of %s in block %s', tx, code, blockNum);

                        clearTimeout(eventTimeOut);

                        // Kiểm tra trạng thái của tx
                        if (code !== 'VALID') {
							let message = util.format('The invoke chaincode transaction was invalid, code:%s',code);
                            logger.error(message);
                            rej(new Error(message));
                        } else {
							let message = 'The invoke chaincode transaction was valid.';
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

            // (6) Thực hiện gửi request proposal đến orderer
            let proposal = results[1]; // proposal dùng gửi cho orderer
            let ordererRequest = {
                txId: txId, // txId của proposal request để  đảm bảo tx được ký bỏi cùng admin
                proposalResponses: proposalResponses,
                proposal: proposal
            }
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
}

exports.invokeChaincode = invokeChaincode;