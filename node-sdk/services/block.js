'use strict';

var util = require('util');

const helper = require('../utils/helper');
const logger = require('../utils/common/logger').getLogger('services/block');
const preRes = require('../utils/common/pre-response');
const encoder = require('../utils/common/encoder');

/**
 * Lấy các danh sách các block
 * @param {number} to [POSITIVE] index của block cuối cùng trong danh sách truy vấn. Nếu set = -1, block 'to' sẽ là block mới nhất trong Ledger
 * @param {number} offset [POSITIVE] block đầu tiên sẽ  block thứ 'to' - 'offset' trong ledger. Nếu set = 0 => chỉ lấy 1 block.
 * @param {string} peer 
 * @param {string} channelName
 * @param {string} orgName 
 * @param {string} username 
 */
async function getBlockList(to, offset, peer, channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Thiết lập instance của channel và kiểm tra thông tin
     *  (3) Tinh chỉnh arguments
     *  (4) query
     *  (5) Close channel
     */

    if (offset < 0) {
        throw new Error("offset must be a positive number!");
    }

    let channel = null;
    let from = null;
    let blockList = [];
    let orgininalTo = to;

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

        // (3) Tinh chỉnh arguments
        let latestBlock = null;
        if ((!to) || (to < 0)) {
            // Nếu to = -1 => lấy đến block cuối cùng
            let result = await channel.queryInfo();

            let latestBlockBuffer = result.currentBlockHash.toBuffer();
            if (peer) {
                latestBlock = await channel.queryBlockByHash(latestBlockBuffer, peer)
            } else {
                latestBlock = await channel.queryBlockByHash(latestBlockBuffer)
            }

            to = latestBlock.header.number;
            orgininalTo = latestBlock.header.number;
            from = (to - offset <= 0) ? 0 : (to - offset);
            to--;
        } else {
            from = (to - offset <= 0) ? 0 : (to - offset);
        }

        // (4) query
        if (peer) {
            for (let i = from; i <= to; i++) {
                let block;

                block = await channel.queryBlock(i, peer);
                block.blockHash = encoder.calculateBlockHash(block.header);
                blockList.push(block);
            }
        } else {
            for (let i = from; i <= to; i++) {
                let block;

                block = await channel.queryBlock(i);
                block.blockHash = encoder.calculateBlockHash(block.header);
                blockList.push(block);
            }
        }

        if (latestBlock) {
            latestBlock.blockHash = encoder.calculateBlockHash(latestBlock.header);
            blockList.push(latestBlock);
        }

        return preRes.getSuccessResponse('Successfully get blocks ' + from + ' - ' + orgininalTo, blockList);
    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);

        return preRes.getFailureResponse(err.toString());
    } finally {
        // (5) Close channel
        if (channel) {
            channel.close();
        }
    }
}

/**
 * Lấy block theo mã hash 
 * @param {string} peer 
 * @param {string} hash 
 * @param {string} channelName 
 * @param {string} orgName 
 * @param {string} username 
 */
async function queryBlockByHash(peer, hash, channelName, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Thiết lập instance của channel và kiểm tra thông tin
     *  (3) query
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

        // (3) query
        let result = await channel.queryBlockByHash(Buffer.from(hash, 'hex'), peer);

        return preRes.getSuccessResponse("Successfully get block " + hash, result);

    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);
        return preRes.getFailureResponse(err.toString());
    } finally {
        // (4) Close channel
        if (channel) {
            channel.close();
        }
    }
}

exports.getBlockList = getBlockList;
exports.queryBlockByHash = queryBlockByHash;