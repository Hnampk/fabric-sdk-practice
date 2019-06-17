'use strict';
const express = require('express');
const logger = require('../utils/common/logger').getLogger('controllers/chaincode');

const router = express.Router();

const preRes = require('../utils/common/pre-response');
const chaincode = require('../services/chaincode');

// Get installed chaincodes
router.get('/installed', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  I N S T A L L E D  C H A I N C O D E S >>>>>>>>>>>>>>>>>');

    var peer = req.query.peer;

    logger.debug('peer : ' + peer);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!peer) {
        res.json(preRes.preRes.getErrorMessage('\'peer\''));
        return;
    }

    let result = await chaincode.getInstalledChaincodes(peer, req.orgname, req.username);
    res.json(result);
});

router.get('/instantiated', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  I N S T A N T I A T E D  C H A I N C O D E S >>>>>>>>>>>>>>>>>');

    var channelName = req.query.channel;

    logger.debug('channelName : ' + channelName);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!channelName) {
        res.json(preRes.preRes.getErrorMessage('\'channel\''));
        return;
    }

    let result = await chaincode.getInstantiatedChaincodes(channelName, req.orgname, req.username);
    res.json(result);
});

router.post('/install', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< I N S T A L L  C H A I N C O D E >>>>>>>>>>>>>>>>>');

    var peers = req.body.peers;
    var chaincodeName = req.body.chaincodeName;
    var chaincodePath = req.body.chaincodePath;
    var chaincodeVersion = req.body.chaincodeVersion;
    var chaincodeType = req.body.chaincodeType;

    logger.debug('peers : ' + peers); // target peers list
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('chaincodePath  : ' + chaincodePath);
    logger.debug('chaincodeVersion  : ' + chaincodeVersion);
    logger.debug('chaincodeType  : ' + chaincodeType);

    if (!peers || peers.length == 0) {
        res.json(preRes.getErrorMessage('\'peers\''));
        return;
    }
    if (!chaincodeName) {
        res.json(preRes.getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!chaincodePath) {
        res.json(preRes.getErrorMessage('\'chaincodePath\''));
        return;
    }
    if (!chaincodeVersion) {
        res.json(preRes.getErrorMessage('\'chaincodeVersion\''));
        return;
    }
    if (!chaincodeType) {
        res.json(preRes.getErrorMessage('\'chaincodeType\''));
        return;
    }

    let result = await chaincode.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.orgname, req.username)
    res.json(result);
});

router.post('/instantiate', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< I N S T A N T I A T E  C H A I N C O D E >>>>>>>>>>>>>>>>>');

    var peers = req.body.peers;
    var chaincodeName = req.body.chaincodeName;
    var chaincodeVersion = req.body.chaincodeVersion;
    var channelName = req.body.channel;
    var chaincodeType = req.body.chaincodeType;
    var fcn = req.body.fcn;
    var args = req.body.args;

    logger.debug('peers  : ' + peers);
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('chaincodeVersion  : ' + chaincodeVersion);
    logger.debug('chaincodeType  : ' + chaincodeType);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);

    if (!chaincodeName) {
        res.json(preRes.getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!chaincodeVersion) {
        res.json(preRes.getErrorMessage('\'chaincodeVersion\''));
        return;
    }
    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channel\''));
        return;
    }
    if (!chaincodeType) {
        res.json(preRes.getErrorMessage('\'chaincodeType\''));
        return;
    }
    if (!args) {
        res.json(preRes.getErrorMessage('\'args\''));
        return;
    }

    let result = await chaincode.instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, req.orgname, req.username);
    res.json(result);
});

module.exports = router;