'use strict';
const express = require('express');
const logger = require('../utils/common/logger').getLogger('controllers/peer');

const router = express.Router();

const peer = require('../services/peer');


// Query getChannelListByPeer
router.get('/channels', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  P E E R \' S  J O I N E D  C H A N N E L S >>>>>>>>>>>>>>>>>');
    var username = req.username;
    var orgName = req.orgname;
    var peerName = req.query.peer
    logger.debug('End point : api/peers/channels');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    logger.debug('peer name  : ' + peer);

    if (!peerName) {
        res.json(logger.getErrorMessage('\'peer\''));
        return;
    }

    let response = await peer.getChannelList(peerName, orgName, username);
    res.json(response);
});

// Query getChannelListSameOrg
router.get('/not-joined-channels', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  P E E R \' S  D I D N O T  J O I N  C H A N N E L S >>>>>>>>>>>>>>>>>');
    var username = req.username;
    var orgName = req.orgname;
    var peerName = req.query.peer

    logger.debug('End point : api/peers/not-joined-channels');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    logger.debug('Peer name  : ' + peerName);

    if (!peerName) {
        res.json(preRes.getErrorMessage('\'peer\''));
        return;
    }

    let response = await peer.getChannelListSameOrg(peerName, orgName, username);

    res.json(response);
});

module.exports = router;