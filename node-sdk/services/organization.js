'use strict';

const helper = require('../utils/helper');
const logger = require('../utils/common/logger').getLogger('services/organization');
const preRes = require('../utils/common/pre-response');

/**
 * Lấy danh sách các Peer của Org
 * @param {string} orgName 
 * @param {string} username 
 * @returns {Promise<Array<string>>}
 */
async function getPeersForOrg(orgName, username) {
    try {
        let client = await helper.getClientForOrg(orgName, username);

        let peers = client.getPeersForOrg(orgName + "MSP");

        return preRes.getSuccessResponse("Successfully get Peer list of Org " + orgName, peers.map(peer => {
            return peer.getName();
        }));
    } catch (e) {
        logger.error('Failed to query due to error: ' + e.stack ? e.stack : e);
        return preRes.getFailureResponse(e.toString());
    }
}

exports.getPeersForOrg = getPeersForOrg;