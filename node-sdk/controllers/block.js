'use strict';
const express = require('express');
const logger = require('../utils/common/logger').getLogger('controllers/block');

const router = express.Router();

const preRes = require('../utils/common/pre-response');
const block = require('../services/block');

// Query queryBlockByHash
router.get('/by-hash', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< QUERY BLOCKS >>>>>>>>>>>>>>>>>');

    var channelName = req.query.channel;
    var blockHash = req.query.block_hash;
    var peer = req.query.peer;

    logger.debug('channelName : ' + channelName);
    logger.debug('peer : ' + peer);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);
    logger.debug('blockHash: ' + blockHash);

    let result = await block.queryBlockByHash(peer, blockHash, channelName, req.orgname, req.username);
    res.json(result);
});

//getLatestBlockIndex
router.get('/latest-index', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  L A T E S T  B L O C K  I N D E X >>>>>>>>>>>>>>>>>');
    logger.debug('End point : api/blocks/latest-index');

    var username = req.username;
    var orgName = req.orgname;
    var channelName = req.query.channel;

    logger.debug('channelName : ' + channelName);
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);

    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }

    let response = await block.getLatestBlockIndex(channelName, orgName, username);
    res.send(response);
});

// Query blocks
router.get('/:channelName', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< QUERY BLOCKS >>>>>>>>>>>>>>>>>');

    var channelName = req.params.channelName;
    var peer = req.query.peer;
    var to = req.query.to;
    var offset = req.query.offset;

    logger.debug('channelName : ' + channelName);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);
    logger.debug('query details: to: %s, offset: %s, peer: %s', to, offset, peer);

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channelName\''));
        return;
    }
    if ((to == null) || (typeof(to) == 'undefined')) {
        res.json(preRes.getErrorMessage('\'to\''));
        return;
    }
    if ((offset == null) || (typeof(offset) == 'undefined')) {
        res.json(preRes.getErrorMessage('\'offset\''));
        return;
    }

    let result = await block.getBlockList(to, offset, peer, channelName, req.orgname, req.username);
    res.json(result);
});

module.exports = router;