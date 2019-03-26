'use strict';

var util = require('util');
var helper = require('./helper.js');
var logger = helper.getLogger('Euery');

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

    let channel = null;

    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);

        // (2) Thiết lập instance của channel và kiểm tra thông tin
        channel = client.getChannel(channelName);
        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            throw new Error(message)
        }

        // (3) Gửi request query chaincode
        let request = {
            targets: peers,
            chaincodeId: chaincodeName,
            fcn: funtionName,
            args: args
        };
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
            return args[0] + ' now has ' + queryResponse[0].toString('utf8') +
                ' after the move';
        } else {
            logger.error('queryResponse is null');
            return 'queryResponse is null';
        }
    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);
        return err.toString();
    } finally {
        // (4) Close channel
        if (channel) {
            channel.close();
        }
    }
}

exports.queryChaincode = query;