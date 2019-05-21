'use strict';

const fs = require('fs');
const path = require('path');
var util = require('util');
const hfc = require('fabric-client');
const superagent = require('superagent');
const agent = require('superagent-promise')(require('superagent'), Promise);
const requester = require('request');

var helper = require('./helper.js');
var logger = helper.getLogger('Update-channel-config');

async function getChannelConfig(channelName, orgName, username) {
    let channel = null

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
        let configEnvelope = await channel.getChannelConfigFromOrderer();
        let originalConfigProto = configEnvelope.config.toBuffer(); // Lưu lại config gốc


        // (4) Chỉnh sửa config
        // Sử dụng tool configtxlator để convert config sang json
        let response = await agent.post('http://127.0.0.1:7059/protolator/decode/common.Config',
            originalConfigProto).buffer();

        let originalConfigJson = response.text.toString(); // config định dạng json

        return {
            success: true,
            result: originalConfigJson,
            msg: ''
        };
    } catch (e) {
        console.log(e);
        return {
            success: false,
            msg: e
        };
    } finally {
        // ( ) Close channel
        if (channel) {
            channel.close();
        }
    }
}

/**
 * Cập nhật số  transaction tối đa bên trong 01 block
 * @param {{absolute_max_bytes: number, max_message_count: number, preferred_max_bytes: number}} batchSize BatchSize
 * @param {string} batchTimeout
 * @param {string} channelName 
 * @param {string} orgName 
 * @param {string} username 
 */
async function modifyChannelBatchConfig(channelName, batchSize, batchTimeout, orgName, username) {
    /**
     *  TODO:
     *  (1) Thiết lập client của Org
     *  (2) Thiết lập instance của channel và kiểm tra thông tin
     *  (3) Lấy config mới nhất của Orderer
     *  (4) Chỉnh sửa config
     *  (5) Thực hiện update
     *  (6) Close channel
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
        let configEnvelope = await channel.getChannelConfigFromOrderer();
        let originalConfigProto = configEnvelope.config.toBuffer(); // Lưu lại config gốc


        // (4) Chỉnh sửa config
        // Sử dụng tool configtxlator để convert config sang json
        let response = await agent.post('http://127.0.0.1:7059/protolator/decode/common.Config',
            originalConfigProto).buffer();

        let originalConfigJson = response.text.toString(); // config định dạng json
        let updatedConfigJson = originalConfigJson; // config dùng cho chỉnh sửa

        // Chỉnh sửa!
        let updatedConfig = JSON.parse(updatedConfigJson); // chuyển sang dạng object để chỉnh sửa
        updatedConfig.channel_group.groups.Orderer.values.BatchSize.value.absolute_max_bytes = batchSize.absoluteMaxBytes;
        updatedConfig.channel_group.groups.Orderer.values.BatchSize.value.max_message_count = batchSize.maxMessageCount;
        updatedConfig.channel_group.groups.Orderer.values.BatchSize.value.preferred_max_bytes = batchSize.preferredMaxBytes;
        updatedConfig.channel_group.groups.Orderer.values.BatchTimeout.value.timeout = batchTimeout.timeout;
        updatedConfigJson = JSON.stringify(updatedConfig);

        // Sử dụng tool configtxlator để convert lại proto config
        response = await agent.post('http://127.0.0.1:7059/protolator/encode/common.Config',
                updatedConfigJson.toString())
            .buffer();
        let updatedConfigProto = response.body;

        let formData = {
            channel: channelName,
            original: {
                value: originalConfigProto,
                options: {
                    filename: 'original.proto',
                    contentType: 'application/octet-stream'
                }
            },
            updated: {
                value: updatedConfigProto,
                options: {
                    filename: 'updated.proto',
                    contentType: 'application/octet-stream'
                }
            }
        };3

        // Sử dụng tool configtxlator để tìm phần chỉnh sửa
        // Kết quả nhận được sẽ dùng để ký và gửi đển orderer update
        response = await new Promise((resolve, reject) => {
            requester.post({
                url: 'http://127.0.0.1:7059/configtxlator/compute/update-from-configs',
                // encoding: null,
                // headers: {
                //     accept: '/',
                //     expect: '100-continue'
                // },
                formData: formData
            }, (err, res, body) => {
                if (err) {
                    t.fail('Failed to get the updated configuration ::' + err);
                    reject(err);
                } else {
                    const proto = Buffer.from(body, 'binary');
                    resolve(proto);
                }
            });
        });

        let configProto = response; // nội dung config dùng để  update

        // (5) Thực hiện update
        let signatures = [];

        // Ký bởi orderer admin
        helper.getOrdererAdmin(client);
        signatures.push(client.signChannelConfig(configProto));

        let request = {
            config: configProto,
            signatures: signatures,
            name: channelName,
            txId: client.newTransactionID(true),
        };

        try {
            console.log("???")
            // Thực hiện update channel config
            let result = await client.updateChannel(request);
            console.log(result);

            if(result.status != 'SUCCESS'){
                return {
                    success: false,
                    msg: result.info
                }
            }
            return {
                success: true,
                result: result,
                msg: ''
            }
        } catch (error) {
            console.log(error);
            return {
                success: false,
                msg: error
            }
        }
    } catch (err) {
        console.log(error);
        return {
            success: false,
            msg: error
        }
    } finally {
        // ( ) Close channel
        if (channel) {
            channel.close();
        }
    }
}

exports.modifyChannelBatchConfig = modifyChannelBatchConfig;
exports.getChannelConfig = getChannelConfig;