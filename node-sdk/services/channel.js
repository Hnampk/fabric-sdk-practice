'use strict';
var fs = require('fs');
var path = require('path');
var util = require('util');
const hfc = require('fabric-client');
const agent = require('superagent-promise')(require('superagent'), Promise);
const requester = require('request');

const helper = require('../utils/helper');
const logger = require('../utils/common/logger').getLogger('services/channel');
const preRes = require('../utils/common/pre-response');

var blockRegistrationNumbers = new Map();
var io;

function wsConfig(socket) {
    io = socket;
}

/**
 * Thiết lập instance của channel và kiểm tra thông tin
 * @param {string} channelName 
 * @param {string} client 
 */
async function _getClientWithChannel(channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Lấy channel instance
     */
    logger.debug('\n====== _getClientWithChannel \'' + channelName + '\' ======\n');

    // (1) Thiết lập client của Org
    let client = username ?
        (await helper.getClientForOrg(orgName, username)) :
        (await helper.getClientForOrg(orgName));
    logger.debug('Successfully got the fabric client for the organization "%s"', orgName);

    // (2) Lấy channel instance
    let channel = client.getChannel(channelName);
    if (!channel) {
        let message = util.format('Channel %s was not defined in the connection profile', channelName);
        logger.error(message);
        throw new Error(message);
    }

    return { client, channel };
}

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

    logger.debug('\n====== createChannel \'' + channelName + '\' ======\n');

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
                let message = 'Channel \'' + channelName + '\' created Successfully';

                setTimeout(async() => {
                    await registerEventHub(channelName, orgName);
                }, 1000);

                return preRes.getSuccessResponse(message);
            } else {
                logger.error('Failed to create the channel. status:' + result.status + ' reason:' + result.info);
                let message = 'Channel \'' + channelName + '\' failed to create status:' + result.status + ' reason:' + result.info;

                return preRes.getFailureResponse(message);
            }
        } else {
            logger.error('\n!!!!!!!!! Failed to create the channel \'' + channelName +
                '\' !!!!!!!!!\n\n');
            let message = 'Failed to create the channel \'' + channelName + '\''

            return preRes.getFailureResponse(message);
        }
    } catch (err) {
        logger.error('Failed to initialize the channel: ' + err.stack ? err.stack : err);

        return preRes.getFailureResponse('Failed to initialize the channel: ' + err.toString());
    }
}

/**
 * Connect tới event hub của peer để nhận event
 * @param {*} channelName 
 * @param {*} orgName 
 * @param {*} username 
 */
async function registerEventHub(channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập instance của channel và kiểm tra thông tin
     *  (2) Lấy thông tin các event hub của Org hiện tại trong channel
     *  (3) Kiểm tra tình trạng đăng ký của event hub
     *  (4) Đăng ký event hub
     *  (5) Connect event hub
     *  (6) Close channel
     */

    if (io) {
        try {
            // (1) Thiết lập instance của channel và kiểm tra thông tin
            var { client, channel } = await _getClientWithChannel(channelName, orgName, username);

            // (2) Lấy thông tin các event hub của Org hiện tại trong channel
            let eventHubs = channel.getChannelEventHubsForOrg();

            if (eventHubs.length > 0) {
                let blockRegistrationNumber = blockRegistrationNumbers.get(channelName);

                // (3) Kiểm tra tình trạng đăng ký của event hub
                if (!blockRegistrationNumber) {
                    let eh = eventHubs[0];

                    // (4) Đăng ký event hub
                    blockRegistrationNumber = eh.registerBlockEvent((block => {
                        io.in('channel-blocks-' + channelName).emit('block', { channelName, block });
                    }), (e => {
                        console.log("error", e)
                    }));

                    blockRegistrationNumbers.set(channelName, blockRegistrationNumber);

                    if (!eh.isconnected()) {
                        console.log("connect");
                        // (5) Connect
                        eh.connect({ full_block: true });
                    }
                }
            }
        } catch (e) {

        } finally {
            // if (channel) channel.close();
        }
    }
}

/**
 * Join Peer vào Channel
 * @param {string} channelName 
 * @param {Array<string>} peers Danh sách các peer muốn join Channel
 * @param {string} orgName 
 * @param {string} username 
 */
async function joinChannel(channelName, peers, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập instance của channel và kiểm tra thông tin
     *  (2) Lấy Genesis block của channel
     *  (3) Thực hiện join các peer vào channel
     */

    logger.debug('\n\n============ joinChannel start ============\n')

    let errorMessage = null;
    var all_eventhubs = [];
    try {

        logger.info('Calling peers in organization "%s" to join the channel', orgName);

        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await _getClientWithChannel(channelName, orgName, username);

        // (2) Lấy Genesis block của channel
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
    } finally {
        if (channel) channel.close();
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

        return preRes.getSuccessResponse(message);;
    } else {
        let message = util.format('Failed to join all peers to channel. cause:%s', errorMessage);
        logger.error(message);
        // build a response to send back to the REST caller
        return preRes.getFailureResponse(errorMessage);
    }
}


/**
 * Lấy danh sách các Peer của Channel theo network-config
 * @param {string} channelName 
 * @param {string} orgName 
 * @param {string} username 
 */
async function getPeers(channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập instance của channel và kiểm tra thông tin
     *  (2) get Peers
     *  (3) Close channel
     */
    logger.debug('\n\n============ getPeers start ============\n')

    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await _getClientWithChannel(channelName, orgName, username);

        // (2) get Peers
        let results = channel.getChannelPeers();

        let peerLists = [];
        results.forEach(async(peer) => {
            // waitForReady(peer.getPeer()); // for peer status but not ok yet!. From fabric-client/lib/Remote.js
            // console.log(peer);
            peerLists.push({
                name: peer.getName(),
                mspid: peer.getMspid(),
            });
        });

        return preRes.getSuccessResponse('Successfully get peers of channel ' + channelName, peerLists);
    } catch (e) {
        logger.error('Failed to query due to error: ' + e.stack ? e.stack : e);
        return preRes.getFailureResponse(e.toString());
    } finally {
        // (3) Close channel
        if (channel) {
            channel.close();
        }
    }
}

/**
 * Lấy config của Channel (Max Timeout, Batch Size,...)
 * @param {string} channelName 
 * @param {string} orgName 
 * @param {string} username 
 */
async function getChannelBatchConfig(channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập instance của channel và kiểm tra thông tin
     *  (2) Lấy config mới nhất của Orderer
     *  (3) convert config sang json
     *  (4) Close channel
     */
    logger.debug('\n\n============ getChannelBatchConfig start ============\n')

    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await _getClientWithChannel(channelName, orgName, username);

        // (2) Lấy config mới nhất của Orderer
        let configEnvelope = await channel.getChannelConfigFromOrderer();
        let originalConfigProto = configEnvelope.config.toBuffer(); // Lưu lại config gốc

        // (3) Sử dụng tool configtxlator để convert config sang json
        let response = await agent.post(hfc.getConfigSetting('configtxlator') + '/protolator/decode/common.Config',
            originalConfigProto).buffer();

        let originalConfigJson = response.text.toString(); // config định dạng json

        return preRes.getSuccessResponse('Successfully get the channel configuration!', originalConfigJson);
    } catch (e) {
        return preRes.getFailureResponse(e.toString());
    } finally {
        // (4) Close channel
        if (channel) channel.close();
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
     *  (1) Thiết lập instance của channel và kiểm tra thông tin
     *  (2) Lấy config mới nhất của Orderer
     *  (3) Chỉnh sửa config
     *  (4) Thực hiện update
     *  (5) Close channel
     */
    logger.debug('\n\n============ modifyChannelBatchConfig start ============\n')

    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await _getClientWithChannel(channelName, orgName, username);

        // (2) Lấy config mới nhất của Orderer
        let configEnvelope = await channel.getChannelConfigFromOrderer();
        let originalConfigProto = configEnvelope.config.toBuffer(); // Lưu lại config gốc


        // (3) Chỉnh sửa config
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
        };

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

        // (4) Thực hiện update
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
            // Thực hiện update channel config
            let result = await client.updateChannel(request);

            if (result.status != 'SUCCESS') {
                return preRes.getFailureResponse(result.info);
            }

            return preRes.getSuccessResponse("Successfully modify batch config!");
        } catch (e) {
            return preRes.getFailureResponse(e.toString());
        }
    } catch (e) {
        return preRes.getFailureResponse(e.toString());
    } finally {
        // (5) Close channel
        if (channel) channel.close();
    }
}

/**
 * Lấy danh sách peer available qua Discovery service
 * @param {*} channelName 
 * @param {*} orgName 
 * @param {*} username 
 * @param {*} peer 
 */
async function getChannelDiscoveryResults(channelName, orgName, username, peer) {
    /**
     *  TODO:
     *  (1) Thiết lập instance của channel và kiểm tra thông tin
     *  (2) Lấy danh sách peer available qua Discovery service
     *  (3) Close channel
     */
    logger.debug('\n\n============ getChannelDiscoveryResults start ============\n')

    try {
        // (1) Thiết lập instance của channel và kiểm tra thông tin
        var { client, channel } = await _getClientWithChannel(channelName, orgName, username);

        if (peer) {
            await channel.initialize({
                discover: true,
                asLocalhost: true,
                target: peer
            });
        } else {
            // default peer: peer0.org1.example.com
            await channel.initialize({
                discover: true,
                asLocalhost: true,
            });
        }

        // (2) Lấy danh sách peer available qua Discovery service
        let something = await channel.getDiscoveryResults();

        return {
            success: true,
            result: {
                orderers: something.orderers,
                peers_by_org: something.peers_by_org,
                endorsement_plans: something.endorsement_plans
            },
            msg: ''
        }
    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);
        return {
            success: false,
            msg: err.toString()
        };
    } finally {
        // (3) Close channel
        if (channel) {
            channel.close();
        }
    }
}


exports.createChannel = createChannel;
exports.joinChannel = joinChannel;
exports.getPeers = getPeers;
exports.getChannelBatchConfig = getChannelBatchConfig;
exports.modifyChannelBatchConfig = modifyChannelBatchConfig;
exports.getChannelDiscoveryResults = getChannelDiscoveryResults;
exports.registerEventHub = registerEventHub;
exports.wsConfig = wsConfig;
exports._getClientWithChannel = _getClientWithChannel;