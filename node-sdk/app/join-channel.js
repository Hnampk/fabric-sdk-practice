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
    try {

        logger.info('Calling peers in organization "%s" to join the channel', orgName);

        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);
        console.log('Successfully got the fabric client for the organization "%s"', orgName);

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
        let joinRequest = {
            targets: peers, // mảng tên các peer, phải khớp với connection profile
            txId: client.newTransactionID(true),
            block: genesisBlock
        }
        let results = await channel.joinChannel(joinRequest);
        for (let i in results) {
            let peerResult = results[i];
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
        errorMessage = error.toString();
    }
}

exports.joinChannel = joinChannel;