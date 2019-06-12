'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('app');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = module.exports = express();
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');

require('./app/config.js');

var hfc = require('fabric-client');

const preRes = require('./utils/common/pre-response');

var query = require('./app/query.js');

const users = require('./controllers/user');
const channels = require('./controllers/channel');
const peers = require('./controllers/peer');
const blocks = require('./controllers/block');
const transactions = require('./controllers/transaction');


var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
    extended: false
}));
// set secret variable
app.set('secret', 'thisismysecret');
app.use(expressJWT({
    secret: 'thisismysecret'
}).unless({
    path: ['/api/users/enroll']
}));
app.use(bearerToken());
app.use(function(req, res, next) {
    logger.debug(' ------>>>>>> new request for %s', req.originalUrl);

    if (req.originalUrl.indexOf('/users') >= 0) {
        return next();
    }

    if (req.originalUrl.indexOf('/api/users') >= 0) {
        return next();
    }

    var token = req.token;
    jwt.verify(token, app.get('secret'), function(err, decoded) {
        if (err) {
            res.json(preRes.getFailureResponse('Failed to authenticate token. Make sure to include the ' +
                'token returned from /users call in the authorization header ' +
                ' as a Bearer token'));
            return;
        } else {
            // add the decoded user name and org name to the request object
            // for the downstream code to use
            req.username = decoded.username;
            req.orgname = decoded.orgName;

            logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
            return next();
        }
    });
});

app.use("/api/users", users);
app.use("/api/channels", channels);
app.use("/api/peers", peers);
app.use("/api/blocks", blocks);
app.use("/api/transactions", transactions);

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, function() {});
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************', host, port);
server.timeout = 240000;

function getErrorMessage(field) {
    var response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

// Query getPeersForOrg
app.get('/user/peers', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< Org\'s Peer list >>>>>>>>>>>>>>>>>');
    var username = req.username;
    var orgName = req.orgname;
    logger.debug('End point : /user/peers');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);

    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }
    if (!orgName) {
        res.json(getErrorMessage('\'orgName\''));
        return;
    }

    let response = await query.getPeersForOrg(orgName, username);
    res.json(response);
});

// Query getOrgChannelList
app.get('/channels', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< Org\'s Channel List >>>>>>>>>>>>>>>>>');
    var username = req.username;
    var orgName = req.orgname;
    logger.debug('End point : /channels');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);

    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }
    if (!orgName) {
        res.json(getErrorMessage('\'orgName\''));
        return;
    }

    let response = await query.getOrgChannelList(orgName, username);
    console.log(response)
    res.json(response);
});


// Query getChannelListByPeer
app.get('/:peer/channels', async(req, res) => {
    var username = req.username;
    var orgName = req.orgname;
    var peer = req.params.peer
    logger.debug('End point : /user/peers');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    logger.debug('peer name  : ' + peer);

    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }
    if (!orgName) {
        res.json(getErrorMessage('\'orgName\''));
        return;
    }
    if (!peer) {
        res.json(getErrorMessage('\'peer\''));
        return;
    }

    let response = await query.getChannelList(peer, orgName, username);
    res.json(response);
});

// Query getChannelListSameOrg
app.get('/:peer/other_channels', async(req, res) => {
    logger.info('<<<<<<<<<<<<<<<<< Peer\'s didn\'t join channels >>>>>>>>>>>>>>>>>');
    var username = req.username;
    var orgName = req.orgname;
    var peer = req.params.peer

    logger.debug('End point : /:peer/other_channels');
    logger.debug('User name : ' + username);
    logger.debug('Org name  : ' + orgName);
    logger.debug('peer name  : ' + peer);

    if (!username) {
        res.json(getErrorMessage('\'username\''));
        return;
    }

    if (!orgName) {
        res.json(getErrorMessage('\'orgName\''));
        return;
    }

    if (!peer) {
        res.json(getErrorMessage('\'peer\''));
        return;
    }

    let response = await query.getChannelListSameOrg(peer, orgName, username);

    res.json(response);
});