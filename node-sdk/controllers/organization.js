'use strict';
const express = require('express');
const logger = require('../utils/common/logger').getLogger('controllers/organization');

const router = express.Router();

const organization = require('../services/organization');

// Query getPeersForOrg
router.get('/peers', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< G E T  O R G \' S  P E E R S >>>>>>>>>>>>>>>>>');

    var username = req.username;
    var orgName = req.orgname;

    logger.debug('End point : api/organization/peers');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);

    let response = await organization.getPeersForOrg(orgName, username);
    res.json(response);
});

module.exports = router;