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

        let tempPath = path.join(__dirname, '../../fabric/src/viettel.com');
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, (e => {
                if (e) {
                    error = new Error(e);
                    console.log("Error1", e);
                }
                // Delay for sure!
                setTimeout(() => {}, 100);
            }));
        }

        tempPath = path.join(__dirname, '../../fabric/src/viettel.com', chaincodeName);
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, (e => {
                if (e) {
                    error = new Error(e);
                    console.log("Error2", e);
                }
                // Delay for sure!
                setTimeout(() => {}, 100);

                tempPath = path.join(__dirname, '../../fabric/src/viettel.com', chaincodeName, chaincodeType);
                fs.mkdir(tempPath, (e => {
                    if (e) {
                        error = new Error(e);
                        console.log("Error21", e);
                    }
                    // Delay for sure!
                    setTimeout(() => {}, 100);
                }));
            }));
        }

        tempPath = path.join(__dirname, '../../fabric/src/viettel.com', chaincodeName, chaincodeType);
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, (e => {
                if (e) {
                    error = new Error(e);
                    console.log("Error3", e);
                }
                // Delay for sure!
                setTimeout(() => {}, 100);
            }));
        }

        callback(error, tempPath);
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

    let result = await chaincode.instantiateChaincode(peers ? peers : null, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, req.orgname, req.username);
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

    if (!chaincodeName) {
        res.json(preRes.getErrorMessage('\'chaincodeName\''));
        return;
    }

    if (!args) {
        res.json(preRes.getErrorMessage('\'args\''));
        return;
    }

    let result = await chaincode.invokeChaincode(peers ? peers : null, chaincodeName, fcn, args, channelName, req.orgname, req.username);
    res.json(result);
});

var testUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, callback) => {
            console.log("req", req)
            console.log("file", file)
        },
        filename: async(req, file, callback) => {
            const name = file.originalname.toLowerCase().split(' ').join('-');
            const ext = MIME_TYPE_MAP[file.mimetype];

            callback(null, name);
        }
    })
}).any();
router.post('/test', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< TEST UPLOAD >>>>>>>>>>>>>>>>>');

    testUpload(req, res, async(error) => {
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

        console.log("EVERY THING IS OKAY!");
        console.log(req.files);

    });
});

var upload = multer({ storage: storage }).single('file');
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
        // rimraf(path.join(__dirname, '../../fabric/src/viettel.com/', chaincodeName), (e) => {
        //     console.log(e);
        // });

        res.json(result);
        // Everything went fine.
    })
});

module.exports = router;