'use strict';


var util = require('util');
var helper = require('./helper.js');
var logger = helper.getLogger('Join-Channel');

async function joinChannel(channelName, peers, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Kiểm tra thông tin và lấy Genesis block của channel
     *  (3) Thực hiện join các peer vào channel
     */

    logger.debug('\n\n============ Join Channel start ============\n')

    let errorMessage = null;
	var all_eventhubs = [];
    try {

        logger.info('Calling peers in organization "%s" to join the channel', orgName);

        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);
        logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

        // (2) Kiểm tra thông tin và lấy Genesis block của channel
        let channel = client.getChannel(channelName);
        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            throw new Error(message);
        }
        let request = {
            txId: client.newTransactionID(true)
        }
        let genesisBlock = await channel.getGenesisBlock(request);

        // (3) Thực hiện join các peer vào channel

        // tell each peer to join and wait 10 seconds
        // for the channel to be created on each peer
        var promises = [];
        promises.push(new Promise(resolve => setTimeout(resolve, 10000)));

        let joinRequest = {
            targets: peers, // mảng tên các peer, phải khớp với connection profile
            txId: client.newTransactionID(true),
            block: genesisBlock
        }
        let joinPromise = channel.joinChannel(joinRequest);
        promises.push(joinPromise);
        let results = await Promise.all(promises);
        logger.debug(util.format('Join Channel R E S P O N S E : %j', results));

		// lets check the results of sending to the peers which is
		// last in the results array
        let peersResults = results.pop();
        
        for (let i in peersResults) {
            let peerResult = peersResults[i];
            if (peerResult instanceof Error) {
                errorMessage = util.format('Failed to join peer to the channel with error :: %s', peerResult.toString());
                logger.error(errorMessage);
            } else if (peerResult.response && peerResult.response.status == 200) {
                logger.info('Successfully joined peer to the channel %s', channelName);
            } else {
                errorMessage = util.format('Failed to join peer to the channel %s', channelName);
                logger.error(errorMessage);
            }
        }
    } catch (err) {
        logger.error('Failed to join channel due to error: ' + err.stack ? err.stack : err);
        errorMessage = err.toString();
    }

	// need to shutdown open event streams
	all_eventhubs.forEach((eh) => {
		eh.disconnect();
	});

	if (!errorMessage) {
		let message = util.format(
			'Successfully joined peers in organization %s to the channel:%s',
			orgName, channelName);
		logger.info(message);
		// build a response to send back to the REST caller
		const response = {
			success: true,
			message: message
		};
		return response;
	} else {
		let message = util.format('Failed to join all peers to channel. cause:%s',errorMessage);
		logger.error(message);
		// build a response to send back to the REST caller
		const response = {
			success: false,
			message: errorMessage
		};
		return response;
	}
}

exports.joinChannel = joinChannel;