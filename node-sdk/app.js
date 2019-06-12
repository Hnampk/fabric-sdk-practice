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
var hfc = require('fabric-client');

require('./config.js');


const preRes = require('./utils/common/pre-response');

const users = require('./controllers/user');
const channels = require('./controllers/channel');
const organizations = require('./controllers/organization');
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

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, function() {});
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************', host, port);
server.timeout = 240000;

app.use("/api/users", users);
app.use("/api/channels", channels);
app.use("/api/organizations", organizations);
app.use("/api/peers", peers);
app.use("/api/blocks", blocks);
app.use("/api/transactions", transactions);