'use strict';
const express = require('express');
const logger = require('../utils/common/logger').getLogger('controllers/user');
const jwt = require('jsonwebtoken');
const hfc = require('fabric-client');

const app = require('../app');
const router = express.Router();

const preRes = require('../utils/common/pre-response');
const user = require('../services/user');

// Register and enroll user
router.post('/enroll', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< E N R O L L  U S E R >>>>>>>>>>>>>>>>>');
    var username = req.body.username;
    var orgName = req.body.orgName;
    logger.debug('End point : /api/users/enroll');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);

    if (!username) {
        res.json(preRes.getErrorMessage('\'username\''));
        return;
    }
    if (!orgName) {
        res.json(preRes.getErrorMessage('\'orgName\''));
        return;
    }
    var token = jwt.sign({
        exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
        username: username,
        orgName: orgName
    }, app.get('secret'));
    let response = await user.getRegisteredUser(username, orgName, true);
    logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
    if (response && typeof response !== 'string') {
        logger.debug('Successfully registered the username %s for organization %s', username, orgName);
        response.result.token = token;
        res.json(response);
    } else {
        logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
        res.json(preRes.getFailureResponse(response));
    }
});

module.exports = router;