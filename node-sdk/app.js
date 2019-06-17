'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const util = require('util');
const app = module.exports = express();
const expressJWT = require('express-jwt');
const jwt = require('jsonwebtoken');
const bearerToken = require('express-bearer-token');
const cors = require('cors');
const hfc = require('fabric-client');
const socket = require('socket.io');
const log4js = require('log4js');
const logger = log4js.getLogger('app');

require('./config.js');


const preRes = require('./utils/common/pre-response');

const users = require('./controllers/user');
const channels = require('./controllers/channel');
const organizations = require('./controllers/organization');
const peers = require('./controllers/peer');
const blocks = require('./controllers/block');
const transactions = require('./controllers/transaction');
const chaincodes = require('./controllers/chaincode');

const channelService = require('./services/channel');

const host = process.env.HOST || hfc.getConfigSetting('host');
const port = process.env.PORT || hfc.getConfigSetting('port');

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
const server = http.createServer(app)

const io = socket(server);

// next line is the money
app.set('socketio', io);

server.listen(port, () => {
    logger.info('****************** SERVER STARTED ************************');
    logger.info('***************  http://%s:%s  ******************', host, port);
    server.timeout = 240000;

    channelService.wsConfig(io);
    io.sockets.on('connection', (socket) => {

        console.log("connection")

        socket.on('disconnect', (data) => {
            console.log("User disconnected")
        });

        socket.on('listen-blocks', (data) => {
            let channel = data.channel;
            console.log("Listen to " + channel)

            socket.join('channel-blocks-' + channel, () => {
                io.in('channel-blocks-' + channel).clients((error, client) => {
                    if (error) {
                        console.log("JOIN FAILED: ", error)
                    }
                });
            });
        });

        socket.on('stop-listen', (data) => {
            let channel = data.channel;

            socket.leave('channel-blocks-' + channel, () => {
                console.log("Stop listen to " + channel + "!")
            });

        });
    })
});


app.use("/api/users", users);
app.use("/api/channels", channels);
app.use("/api/organizations", organizations);
app.use("/api/peers", peers);
app.use("/api/blocks", blocks);
app.use("/api/transactions", transactions);
app.use("/api/chaincodes", chaincodes);