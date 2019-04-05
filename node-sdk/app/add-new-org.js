'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const superagent = require('superagent');
const agent = require('superagent-promise')(require('superagent'), Promise);
const requester = require('request');

var helper = require('./helper.js');
var logger = helper.getLogger("Add-new-org");

async function addNewOrg(newOrgName, channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Chuẩn bị 02 file cấu hình: File crypto và file configtx.yaml của Org mới
     *  (2) Sinh certificate & config cho Org mới
     *  (3) Update cấu hình channel
     *      (3.1) Thiết lập client của Org
     *      (3.2) Thiết lập instance của channel và kiểm tra thông tin
     *      (3.3) Lấy config mới nhất của Orderer
     *      (3.4) Chỉnh sửa config
     *      (3.5) Thực hiện update
     *      (3.6) Close channel
     *  (4) Start các container của Org mới
     */

    let channel = null;

    try {
        // (3) Update cấu hình channel
        // (3.1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);

        // (3.2) Thiết lập instance của channel và kiểm tra thông tin
        let channel = await client.getChannel(channelName);
        if (!channel) {
            let message = util.format('Channel %s was not defined in the connection profile', channelName);
            logger.error(message);
            throw new Error(message);
        }

        // (3.3) Lấy config mới nhất của Orderer
        let configEnvelope = await channel.getChannelConfigFromOrderer();
        let originalConfigProto = configEnvelope.config.toBuffer(); // Lưu lại config gốc

        // (3.4) Chỉnh sửa config
        // Sử dụng tool configtxlator để convert config sang json
        let response = await agent.post('http://127.0.0.1:7059/protolator/decode/common.Config',
            originalConfigProto).buffer();

        let originalConfigJson = response.text.toString(); // config định dạng json
        let updatedConfigJson = originalConfigJson; // config dùng cho chỉnh sửa

        // Load file config
        let configPath = path.join(__dirname, util.format('../../fabric/channel-artifacts/%s.json', newOrgName.toLowerCase()));
        let newOrgConfig = fs.readFileSync(configPath);

        // Chỉnh sửa!
        let updatedConfig = JSON.parse(updatedConfigJson); // chuyển sang dạng object để chỉnh sửa
        updatedConfig.channel_group.groups.Application.groups[newOrgName + "MSP"] = JSON.parse(newOrgConfig);
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
        };

        // Sử dụng tool configtxlator để tìm phần chỉnh sửa
        // Kết quả nhận được sẽ dùng để ký và gửi đển orderer update
        response = await new Promise((resolve, reject) => {
            requester.post({
                url: 'http://127.0.0.1:7059/configtxlator/compute/update-from-configs',
                encoding: null,
                headers: {
                    accept: '/',
                    expect: '100-continue'
                },
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

        // (3.5) Thực hiện update
        // Lưu ý rằng trong triển khai thực tế, do các thành phần là decentralized,
        // việc ký configProto sẽ được thực hiện với từng org chứ không phải được ký cùng lúc
        let signatures = [];
        signatures.push(client.signChannelConfig(configProto)); // Ký bởi Org 1

        let newClient = await helper.getClientForOrg("Org2", "Jim")
        signatures.push(newClient.signChannelConfig(configProto)); // Ký bởi Org 2

        let request = {
            config: configProto,
            signatures: signatures,
            name: channelName,
            txId: client.newTransactionID(true),
        };

        try {
            // Thực hiện update channel config
            let result = await client.updateChannel(request);
            console.log("result", result);
        } catch (error) {
            console.log(error);
        }
    } catch (err) {

    } finally {
        // (3.6) Close channel
        if (channel) channel.close();
    }

}

exports.addNewOrg = addNewOrg;