'use strict';
const express = require('express');
const logger = require('../utils/common/logger').getLogger('controllers/chaincode');
// const IncomingForm = require('formidable').IncomingForm;
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const rimraf = require("rimraf");
const mkdirp = require('mkdirp');

const router = express.Router();

const preRes = require('../utils/common/pre-response');
const chaincode = require('../services/chaincode');

const MIME_TYPE_MAP = {
    'node': 'node',
    'golang': 'golang',
    'java': 'java',
}

var upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            let chaincodeName = req.body.chaincodeName;
            let chaincodeType = req.body.chaincodeType;
            let error = null;
            console.log(file);
            let filePath = file.fieldname.split("/");
            filePath.pop();
            filePath.shift();
            filePath = filePath.join("/");

            let tempPath = path.join(__dirname, '../../fabric/src/viettel.com', chaincodeName, chaincodeType, filePath);
            if (!fs.existsSync(tempPath)) {
                mkdirp(tempPath, e => {
                    if (e) {
                        error = e;
                    }
                });
            }

            // Delay for sure!
            setTimeout(() => {
                callback(error, tempPath);
            }, 100);
        },
        filename: async(req, file, callback) => {
            const name = file.originalname.split(' ').join('-');
            const ext = MIME_TYPE_MAP[file.mimetype];

            callback(null, name);
        }
    })
}).any();

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
    var endorsementPolicy = req.body.endorsementPolicy;

    logger.debug('peers  : ' + peers);
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('chaincodeVersion  : ' + chaincodeVersion);
    logger.debug('chaincodeType  : ' + chaincodeType);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);
    logger.debug('endorsementPolicy  : ' + JSON.stringify(endorsementPolicy));

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
    if (!endorsementPolicy) {
        res.json(preRes.getErrorMessage('\'endorsementPolicy\''));
        return;
    }

    let result = await chaincode.instantiateChaincode(peers ? peers : null, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, endorsementPolicy, req.orgname, req.username);
    res.json(result);
});

router.post('/query', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< Q U E R Y  C H A I N C O D E >>>>>>>>>>>>>>>>>');

    var peers = req.body.peers;
    var channelName = req.body.channel;
    var chaincodeName = req.body.chaincodeName;
    var fcn = req.body.fcn;
    var args = req.body.args;

    logger.debug('peers  : ' + peers);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);

    if (!chaincodeName) {
        res.json(preRes.getErrorMessage('\'chaincodeName\''));
        return;
    }

    if (!args) {
        res.json(preRes.getErrorMessage('\'args\''));
        return;
    }

    let result = await chaincode.query(peers ? peers : null, chaincodeName, fcn, args, channelName, req.orgname, req.username);
    res.json(result);
});

router.post('/invoke', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< I N V O K E  C H A I N C O D E >>>>>>>>>>>>>>>>>');

    var peers = req.body.peers;
    var channelName = req.body.channel;
    var chaincodeName = req.body.chaincodeName;
    var fcn = req.body.fcn;
    var args = req.body.args;

    logger.debug('peers  : ' + peers);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('fcn  : ' + fcn);
    logger.debug('args  : ' + args);

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channel\''));
        return;
    }

    if (!chaincodeName) {
        res.json(preRes.getErrorMessage('\'chaincodeName\''));
        return;
    }

    if (!peers) {
        res.json(preRes.getErrorMessage('\'peers\''));
        return;
    }

    if (!fcn) {
        res.json(preRes.getErrorMessage('\'fcn\''));
        return;
    }

    if (!args) {
        res.json(preRes.getErrorMessage('\'args\''));
        return;
    }

    let result = await chaincode.invokeChaincode(peers ? peers : null, chaincodeName, fcn, args, channelName, req.orgname, req.username);
    res.json(result);
});

router.post('/install-by-package', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< I N S T A L L  C H A I N C O D E  B Y  P A C K A G E >>>>>>>>>>>>>>>>>');

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

        if (installedChaincodesResponse.result) {
            let isInstalled = installedChaincodesResponse.result.chaincodes.map(chaincode => {
                return { name: chaincode.name, version: chaincode.version }
            }).find(chaincode => { return (chaincode.name == chaincodeName) && (chaincode.version == chaincodeVersion) });

            if (isInstalled) {
                res.json(preRes.getFailureResponse("Chaincode name " + chaincodeName + " has already existed!"));
                return;
            }
        }

        // let's install
        let chaincodePath = "viettel.com/" + chaincodeName + "/" + chaincodeType;

        if (chaincodeType != 'golang') {
            chaincodePath = "/src/" + chaincodePath
        }

        let result = await chaincode.installChaincode([peer], chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.orgname, req.username);

        // Remove chaincode folder after installation
        setTimeout(() => {
            rimraf(path.join(__dirname, '../../fabric/src/viettel.com/', chaincodeName), (e) => {
                console.log(e);
            });
        }, 2000);

        res.json(result);
        // Everything went fine.
    })
});

router.get('/endorsement-plan', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  E N D O R S E M E N T  P L A N >>>>>>>>>>>>>>>>>');

    var peer = req.query.peer;
    var channelName = req.query.channel;
    var chaincodeName = req.query.chaincodeName;

    logger.debug('peer : ' + peer);
    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('username :' + req.username);
    logger.debug('orgname:' + req.orgname);

    if (!channelName) {
        res.json(preRes.getErrorMessage('\'channel\''));
        return;
    }

    if (!peer) {
        res.json(preRes.getErrorMessage('\'peer\''));
        return;
    }

    if (!chaincodeName) {
        res.json(preRes.getErrorMessage('\'chaincodeName\''));
        return;
    }

    let result = await chaincode.getChaincodeEndorsementPlan(peer, channelName, chaincodeName, req.orgname, req.username);
    res.json(result);
});


module.exports = router;