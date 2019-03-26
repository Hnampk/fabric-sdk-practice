'use strict';

var util = require('util');
var helper = require('./helper.js');
var logger = helper.getLogger('Update-channel-config');
var hfc = require('fabric-client');
var decoder = hfc.BlockDecoder;
async function modifyBatchSize(channelName, orgName, username) {
    /**
     *  TODO:
     *  (1) Thiết lập client của Org
     *  (2) Thiết lập instance của channel và kiểm tra thông tin
     *  (3) Lấy config mới nhất của Orderer
     *  (4) Chỉnh sửa config
     *  (5) Thực hiện update
     * 
     * 
     * 
     *  ( ) Close channel
     */

    let channel = null;

    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);

        // (2) Thiết lập instance của channel và kiểm tra thông tin
        channel = await client.getChannel(channelName);
        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            throw new Error(message);
        }

        // (3) Lấy config mới nhất của Orderer
        let ordererConfig = await channel.getChannelConfigFromOrderer();

        let groupsObj = ordererConfig['config']['channel_group']['groups'];
        console.log("ordererConfig", groupsObj.toString());

    } catch (err) {

    } finally {
        // ( ) Close channel
        if (channel) {
            channel.close();
        }
    }

}

exports.modifyBatchSize = modifyBatchSize;