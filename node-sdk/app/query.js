'use strict';

var util = require('util');
var helper = require('./helper.js');
var utils = require('./utils.js')
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
exports.queryTransaction = queryTransaction;
exports.getOrgs = getOrgs;