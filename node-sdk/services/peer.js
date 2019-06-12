'use strict';

const helper = require('../utils/helper');
const logger = require('../utils/common/logger').getLogger('services/peer');
const preRes = require('../utils/common/pre-response');

const organization = require('./organization');

/**
 * Lấy danh sách các Channel mà peer đã tham gia
 * @param {*} peer 
 * @param {*} orgName 
 * @param {*} username 
 * @returns {}
 */
async function getChannelList(peer, orgName, username) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) query danh sách channel
     */
    try {
        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName, username);

        // (2) query danh sách channel
        let result = await client.queryChannels(peer, true);

        return preRes.getSuccessResponse("Successfully get channels of peer " + peer, result.channels);
    } catch (err) {
        logger.error('Failed to query due to error: ' + err.stack ? err.stack : err);
        return preRes.getFailureResponse(err.toString());
    }
}

/**
 * Lấy danh sách các Channel của các Peer khác
 * @param {*} peer 
 * @param {*} orgName 
 * @param {*} username 
 * @returns {}
 */
async function getChannelListSameOrg(peer, orgName, username) {
    /**
     * TODO:
     *  (1) Lấy danh sách các Peer khác trong cùng Org
     *  (2) Bỏ Peer query khỏi danh sách
     *  (3) Lấy danh sách các Channel đã join của từng Peer và lọc trùng
     */
    try {
        let result = [];
        let msg = "";

        // (1) Lấy danh sách các Peer khác trong cùng Org
        let peerListResponse = await organization.getPeersForOrg(orgName, username);

        if (!peerListResponse.success) {
            throw new Error("Can not getPeersForOrg")
        }

        // (2) Bỏ Peer query khỏi danh sách
        let peerList = peerListResponse.result;
        let peerIndex = peerList.indexOf(peer);

        if (peerIndex > -1)
            peerList.splice(peerIndex, 1);

        // (3) Lấy danh sách các Channel đã join của từng Peer và lọc trùng
        for (let i = 0; i < peerList.length; i++) {
            let otherPeer = peerList[i];

            // Với mỗi Peer, lấy danh sách các Channel đã join
            let channelsResponse = await getChannelList(otherPeer, orgName, username);

            if (!channelsResponse.success) {
                // lỗi
                msg += "---" + channelsResponse.message;
                continue;
            }

            let channels = channelsResponse.result;

            // Lọc trùng, đưa vào mảng
            if (i = 0) {
                result = channels;
            } else {
                channels.forEach(channel => {
                    let exist = result.indexOf(channel.channel_id);

                    if (exist == -1) {
                        // chưa có trong mảng
                        result.push(channel.channel_id);
                    }
                });
            }
        }

        return preRes.getSuccessResponse(msg ? msg : "Successfully get the channel list of " + orgName, result);
    } catch (e) {
        logger.error('Failed to query due to error: ' + e.stack ? e.stack : e);
        return preRes.getFailureResponse(e.toString());
    }
}

exports.getChannelList = getChannelList;
exports.getChannelListSameOrg = getChannelListSameOrg;