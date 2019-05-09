'use strict';

var util = require('util');
var helper = require('./helper.js');
const agent = require('superagent-promise')(require('superagent'), Promise);
var logger = helper.getLogger('Query');

var TxValidationCode = {
    VALID: 0,
    NIL_ENVELOPE: 1,
    BAD_PAYLOAD: 2,
    BAD_COMMON_HEADER: 3,
    BAD_CREATOR_SIGNATURE: 4,
    INVALID_ENDORSER_TRANSACTION: 5,
    INVALID_CONFIG_TRANSACTION: 6,
    UNSUPPORTED_TX_PAYLOAD: 7,
    BAD_PROPOSAL_TXID: 8,
    DUPLICATE_TXID: 9,
    ENDORSEMENT_POLICY_FAILURE: 10,
    MVCC_READ_CONFLICT: 11,
    PHANTOM_READ_CONFLICT: 12,
    UNKNOWN_TX_TYPE: 13,
    TARGET_CHAIN_NOT_FOUND: 14,
    MARSHAL_TX_ERROR: 15,
    NIL_TXACTION: 16,
    EXPIRED_CHAINCODE: 17,
    CHAINCODE_VERSION_CONFLICT: 18,
    BAD_HEADER_EXTENSION: 19,
    BAD_CHANNEL_HEADER: 20,
    BAD_RESPONSE_PAYLOAD: 21,
    BAD_RWSET: 22,
    ILLEGAL_WRITESET: 23,
    INVALID_OTHER_REASON: 255,
}


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

async function queryInfo(peer, channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Thiết lập instance của channel và kiểm tra thông tin
     *  (3) Gửi request query channel info
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

        let results = await channel.queryInfo(peer, true);

        // console.log(results.currentBlockHash.toBuffer());
        console.log(results.height);
        let previousBlockHash = results.previousBlockHash.toBuffer().toString('hex');
        queryBlockByHash(peer, previousBlockHash, channelName, orgName, username);
        let currentBlockHash = results.currentBlockHash.toBuffer().toString('hex');
        queryBlockByHash(peer, currentBlockHash, channelName, orgName, username);

        // console.log(Buffer.from(results.currentBlockHash.toBuffer().toString('hex'), 'hex'));


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

async function queryBlockByHash(peer, hash, channelName, orgName, username) {

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

        let results = await channel.queryBlockByHash(Buffer.from(hash, 'hex'), peer);

        console.log(results.data.data);


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


async function waitForReady(Peer) {
    const self = this;
    const client = Peer._discoveryClient;
    console.log("client", client)

    if (!client) {
        throw new Error('Missing required gRPC client');
    }
    const timeout = new Date().getTime() + 3000;

    return new Promise((resolve, reject) => {
        client.waitForReady(timeout, (err) => {
            if (err) {
                if (err.message) {
                    err.message = err.message + ' URL:'; // + self.getUrl();
                }
                err.connectFailed = true;
                logger.error(err);

                return reject(err);
            }
            logger.debug('Successfully connected to remote gRPC server');
            resolve();
        });
    });
}

async function getChannelList(peer, orgName, username) {
    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);
        let result = await client.queryChannels(peer, true);

        console.log(result.channels)

        return result.channels;
    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);
        return err.toString();
    }
}

async function getChannels(orgName) {
    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName);
        let channels = client.getChannels();

        return channels;
    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);
        return err.toString();
    }
}

async function getChannelByName(channelName, orgName, username) {
    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);

        let channel = client.getChannel(channelName, true);

        console.log(channel.getPeer('peer0.org1.example.com'));

    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);
        return err.toString();
    }
}

async function getOrgs(channelName, orgName, username) {

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

        let results = channel.getOrganizations();

        console.log(results);


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

async function getPeersForOrg(orgName, username) {
    try {
        let client = await helper.getClientForOrg(orgName, username);

        let peers = client.getPeersForOrg(orgName + "MSP");

        return peers.map(peer => {
            return peer.getName()
        });
    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);
        return err.toString();
    }
}

async function getPeers(channelName, orgName, username) {

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

        let results = channel.getChannelPeers();

        let peerLists = [];
        results.forEach(async (peer) => {
            // console.log("--------------------------");
            // console.log(peer);

            // waitForReady(peer.getPeer()); // for peer status but not ok yet!. From fabric-client/lib/Remote.js

            peerLists.push({
                name: peer.getName(),
                mspid: peer.getMspid(),
            })
        })
        console.log(peerLists);




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

/**
 * Get all the block from 'to - offset' => 'to'.
 * @param {number} to [POSITIVE] if set to -1, the last block will be the latest block in ledger
 * @param {number} offset [POSITIVE] the delta value, the first result block number = (to - offset). if set to 0 => only 1 block
 * @param {string} peer 
 * @param {string} channelName 
 * @param {string} orgName 
 * @param {string} username 
 */
async function getBlockList(to, offset, peer, channelName, orgName, username) {
    if (offset < 0) {
        throw new Error("offset must be a positive number!");
    }

    let channel = null;
    let from = null;
    let blockList = [];

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

        let latestBlock = null;
        if ((!to) || (to < 0)) {
            let result = await channel.queryInfo();

            let latestBlockBuffer = result.currentBlockHash.toBuffer();
            latestBlock = await channel.queryBlockByHash(latestBlockBuffer, peer)

            to = latestBlock.header.number;
            from = (to - offset <= 0) ? 0 : (to - offset);
            to--;
        } else {
            from = (to - offset <= 0) ? 0 : (to - offset);
        }

        for (let i = from; i <= to; i++) {
            let block = await channel.queryBlock(i, peer);

            blockList.push(block);
        }

        if (latestBlock) blockList.push(latestBlock);

        return blockList;
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

async function queryTransaction(peer, channelName, orgName, username) {
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

        let tx = await channel.queryTransaction("558a4502339a7f74e479247e675b4c540a54057a00d7b9f8ced8d17fbe1ed877", peer);

        console.log(JSON.stringify(tx));
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
exports.queryInfo = queryInfo;
exports.queryBlockByHash = queryBlockByHash;
exports.getPeers = getPeers;
exports.getBlockList = getBlockList;
exports.queryTransaction = queryTransaction;
exports.getChannelList = getChannelList;
exports.getOrgs = getOrgs;
exports.getPeersForOrg = getPeersForOrg;
exports.getChannels = getChannels;
exports.getChannelByName = getChannelByName;