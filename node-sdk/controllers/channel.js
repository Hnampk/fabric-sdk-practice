'use strict';
const express = require('express');
const logger = require('../utils/common/logger').getLogger('controllers/channel');

const router = express.Router();

const preRes = require('../utils/common/pre-response');
const channel = require('../services/channel');

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

// Query getPeers
router.get('/peers', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< Q U E R Y  C H A N N E L  P E E R S >>>>>>>>>>>>>>>>>');
    logger.debug('End point : api/channels/peers');

    var username = req.username;
    var orgName = req.orgname;
    var channelName = req.query.channel;

    logger.debug('channelName : ' + channelName);
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channelName\''));
        return;
    }

    let response = await channel.getPeers(channelName, orgName, username);
    // console.log(JSON.stringify(response));
    res.send(response);
});

// getChannelConfig
router.get('/batch-config', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  C H A N N E L  C O N F I G >>>>>>>>>>>>>>>>>');
    logger.debug('End point : api/channels/batch-config');

    var channelName = req.query.channel;

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
    logger.debug('End point : api/channels/update-batch-config');

    var channelName = req.body.channelName;
    var batchSize = req.body.batchSize;
    var batchTimeout = req.body.batchTimeout;

    logger.debug('channelName : ' + channelName);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);
    logger.debug('batchSize:' + batchSize);
    logger.debug('batchTimeout:' + batchTimeout);

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channelName\''));
        return;
    }

    let result = await channel.modifyChannelBatchConfig(channelName, batchSize, batchTimeout, req.orgname, req.username);

    res.json(result);
});


// Get getChannelDiscoveryResults
router.get('/discovery-service', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< D I S C O V E R  C H A N N E L >>>>>>>>>>>>>>>>>');
    logger.debug('End point : api/channels/discovery-service');

    var channelName = req.query.channel;
    var peer = req.query.peer;

    logger.debug('channelName : ' + channelName);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channelName\''));
        return;
    }

    let message = await channel.getChannelDiscoveryResults(channelName, req.orgname, req.username, peer);
    res.json(message);
});

router.post('/register-event-hub', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< R E G I S T E R  E V E N T  H U B >>>>>>>>>>>>>>>>>');
    logger.debug('End point : api/channels/register-event-hub');

    var channelName = req.body.channel;

    logger.debug('channelName : ' + channelName);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channelName\''));
        return;
    }

    let message = await channel.registerEventHub(channelName, req.orgname, req.username);
    res.json(message);
})

module.exports = router;