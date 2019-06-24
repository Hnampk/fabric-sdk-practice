'use strict';
const express = require('express');
const logger = require('../utils/common/logger').getLogger('controllers/chaincode');
// const IncomingForm = require('formidable').IncomingForm;
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const rimraf = require("rimraf");

const router = express.Router();

const preRes = require('../utils/common/pre-response');
const chaincode = require('../services/chaincode');

const MIME_TYPE_MAP = {
    'text/x-go': 'go',
    'text/javascript': 'js'
}


const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        const isValid = MIME_TYPE_MAP[file.mimetype];
        let error = new Error("Invalid mime type");

        if (isValid) {
            error = null;
        }

        let chaincodeName = req.body.chaincodeName;
        let chaincodeType = req.body.chaincodeType;
        console.log("chaincodeType", chaincodeType);

        if (!fs.existsSync(path.join(__dirname, '../../fabric/src/viettel.com'))) {
            fs.mkdir(path.join(__dirname, '../../fabric/src/viettel.com'), (e => {
                if (e) {
                    error = new Error(e);
                    console.log("Error", e);
                }
            }));
        }

        if (!fs.existsSync(path.join(__dirname, '../../fabric/src/viettel.com/', chaincodeName))) {
            fs.mkdir(path.join(__dirname, '../../fabric/src/viettel.com/', chaincodeName), (e => {
                if (e) {
                    error = new Error(e);
                    console.log("Error", e);
                }
            }));
        }

        if (!fs.existsSync(path.join(__dirname, '../../fabric/src/viettel.com/', chaincodeName, '/', chaincodeType))) {
            fs.mkdir(path.join(__dirname, '../../fabric/src/viettel.com/', chaincodeName, '/', chaincodeType), (e => {
                if (e) {
                    error = new Error(e);
                    console.log("Error", e);
                }
            }));
        }

        callback(error, path.join(__dirname, '../../fabric/src/viettel.com/', chaincodeName, '/', chaincodeType));
    },
    filename: async(req, file, callback) => {
        const name = file.originalname.toLowerCase().split(' ').join('-');
        const ext = MIME_TYPE_MAP[file.mimetype];

        callback(null, name);
    }
});

// Get installed chaincodes
router.get('/installed', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  I N S T A L L E D  C H A I N C O D E S >>>>>>>>>>>>>>>>>');

    var peer = req.query.peer;

    logger.debug('peer : ' + peer);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!peer) {
        res.json(preRes.getErrorMessage('\'peer\''));
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
        res.json(preRes.getErrorMessage('\'channel\''));
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

var upload = multer({ storage: storage }).single('file');
router.post('/test-upload', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< TEST UPLOAD >>>>>>>>>>>>>>>>>');

    upload(req, res, async(error) => {
        if (error instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.log("A Multer error occurred when uploading.", error)
            res.json(preRes.getFailureResponse("A Multer error occurred when uploading."));
            return;
        } else if (error) {
            // An unknown error occurred when uploading.
            console.log("An unknown error occurred when uploading.", error)
            res.json(preRes.getFailureResponse(error));
            return;
        }

        var peer = req.body.peer;
        var chaincodeName = req.body.chaincodeName;
        var chaincodeVersion = req.body.chaincodeVersion;
        var chaincodeType = req.body.chaincodeType;

        logger.debug('peer : ' + peer);
        logger.debug('username :' + req.username);
        logger.debug('orgname:' + req.orgname);
        logger.debug('chaincodeName:' + chaincodeName);
        logger.debug('chaincodeVersion:' + chaincodeVersion);
        logger.debug('chaincodeType:' + chaincodeType);

        if (!peer) {
            res.json(preRes.getErrorMessage('\'peer\''));
            return;
        }
        if (!chaincodeName) {
            res.json(preRes.getErrorMessage('\'chaincodeName\''));
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

        // Check installed
        let installedChaincodesResponse = await chaincode.getInstalledChaincodes(peer, req.orgname, req.username);

        if (!installedChaincodesResponse.success) {
            res.json(preRes.getFailureResponse(installedChaincodesResponse.message));
            return;
        }

        let isInstalled = installedChaincodesResponse.result.chaincodes.map(chaincode => {
            return { name: chaincode.name, version: chaincode.version }
        }).find(chaincode => { return (chaincode.name == chaincodeName) && (chaincode.version == chaincodeVersion) });

        if (isInstalled) {
            res.json(preRes.getFailureResponse("Chaincode name " + chaincodeName + " has already existed!"));
            return;
        }

        // let's install
        let chaincodePath = "";

        if (chaincodeType == 'golang') {
            chaincodePath = "viettel.com/" + chaincodeName + "/" + chaincodeType;
        } else {
            chaincodePath = "/src/viettel.com/" + chaincodeName + "/" + chaincodeType;
        }

        let result = await chaincode.installChaincode([peer], chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.orgname, req.username);

        res.json(result);
        // Everything went fine.
    })
});

module.exports = router;