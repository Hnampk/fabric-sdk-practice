'use strict';
const express = require('express');
const logger = require('../utils/common/logger').getLogger('controllers/channel');

const router = express.Router();

const channel = require('../services/channel');
const preRes = require('../utils/common/pre-response');

// Create Channel
router.post('/create', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
    logger.debug('End point : api/channels/create');

    var channelName = req.body.channelName;
    var channelConfigPath = req.body.channelConfigPath;

    logger.debug('Channel name : ' + channelName);
    logger.debug('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channelName\''));
        return;
    }
    if (!channelConfigPath) {
        res.json(preRes.getErrorMessage('\'channelConfigPath\''));
        return;
    }

    let message = await channel.createChannel(channelName, channelConfigPath, req.orgname);
    res.json(message);
});


// Join Channel
router.post('/join', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
    logger.debug('End point : api/channels/join');
    var channelName = req.body.channelName;
    var peers = req.body.peers;

    logger.debug('channelName : ' + channelName);
    logger.debug('peers : ' + peers);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channelName\''));
        return;
    }
    if (!peers || peers.length == 0) {
        res.json(preRes.getErrorMessage('\'peers\''));
        return;
    }

    let message = await channel.joinChannel(channelName, peers, req.orgname, req.username);
    res.json(message);
});

// getChannelConfig
router.get('/:channel/batch-config', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  C H A N N E L  C O N F I G >>>>>>>>>>>>>>>>>');
    logger.debug('End point : api/channels/batch-config');

    var channelName = req.params.channel;

    logger.debug('channelName : ' + channelName);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channelName\''));
        return;
    }

    let result = await channel.getChannelBatchConfig(channelName, req.orgname, req.username);
    res.json(result);
});

// updateChannelConfig
router.post('/update-batch-config', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< U P D A T E  C H A N N E L  C O N F I G >>>>>>>>>>>>>>>>>');

    var channelName = req.body.channelName;
    var batchSize = req.body.batchSize;
    var batchTimeout = req.body.batchTimeout;

    logger.debug('channelName : ' + channelName);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);
    logger.debug('batchSize:' + batchSize);
    logger.debug('batchTimeout:' + batchTimeout);

    let result = await channel.modifyChannelBatchConfig(channelName, batchSize, batchTimeout, req.orgname, req.username);

    res.json(result);
});


// Get getChannelDiscoveryResults
router.get('/discovery-service', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< DISCOVER CHANNEL >>>>>>>>>>>>>>>>>');

    var channelName = req.query.channel;
    var peer = req.query.peer;

    logger.debug('channelName : ' + channelName);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }

    let message = await channel.getChannelDiscoveryResults(channelName, req.orgname, req.username, peer);
    res.json(message);
});

module.exports = router;