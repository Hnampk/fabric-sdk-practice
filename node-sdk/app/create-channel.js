'use strict';
var fs = require('fs');
var path = require('path');
var helper = require('./helper.js');
var logger = helper.getLogger('Create-Channel');

/**
 * Tạo channel
 * @param {string} channelName tên Channel
 * @param {string} channelConfigPath đường dẫn tới file channel.tx
 * @param {string} orgName tên Org thực hiện tạo channel
 */
async function createChannel(channelName, channelConfigPath, orgName) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Lấy/tạo configuration binary của channel
     *  (3) Ký config
     *  (4) Tạo request
     *  (5) Gửi request tạo channel
     */

    logger.debug('\n====== Creating Channel \'' + channelName + '\' ======\n');

    try {
        // (1) Thiết lập client của Org
        var client = await helper.getClientForOrg(orgName);
        logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

        // (2) Lấy/tạo configuration binary của channel
        let envelope = fs.readFileSync(path.join(__dirname, channelConfigPath));
        let channelConfig = client.extractChannelConfig(envelope);

        // (3) Ký config
        let signatures = [];
        let signature = client.signChannelConfig(channelConfig);
        signatures.push(signature);

        // (4) Tạo request
        let request = {
            config: channelConfig,
            signatures: signatures,
            name: channelName,
            txId: client.newTransactionID(true)
        }

        // (5) Gửi request tạo channel
        let result = await client.createChannel(request);

        logger.debug(' result ::%j', result);

        if (result) {
            if (result.status === 'SUCCESS') {
                logger.debug('Successfully created the channel.');
                const response = {
                    success: true,
                    message: 'Channel \'' + channelName + '\' created Successfully'
                };
                return response;
            } else {
                logger.error('Failed to create the channel. status:' + result.status + ' reason:' + result.info);
                const response = {
                    success: false,
                    message: 'Channel \'' + channelName + '\' failed to create status:' + result.status + ' reason:' + result.info
                };
                return response;
            }
        } else {
            logger.error('\n!!!!!!!!! Failed to create the channel \'' + channelName +
                '\' !!!!!!!!!\n\n');
            const response = {
                success: false,
                message: 'Failed to create the channel \'' + channelName + '\'',
            };
            return response;
        }
    } catch (err) {
        logger.error('Failed to initialize the channel: ' + err.stack ? err.stack : err);
        throw new Error('Failed to initialize the channel: ' + err.toString());
    }
}

exports.createChannel = createChannel;