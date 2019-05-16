'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('SampleWebApp');
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');

require('./app/config.js');

var hfc = require('fabric-client');

var getRegisteredUser = require('./app/get-registered-user.js');
var query = require('./app/query.js');
var createChannel = require('./app/create-channel.js');
var joinChannel = require('./app/join-channel.js');


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
	path: ['/users']
}));
app.use(bearerToken());
app.use(function (req, res, next) {
	logger.debug(' ------>>>>>> new request for %s', req.originalUrl);

	if (req.originalUrl.indexOf('/users') >= 0) {
		return next();
	}

	var token = req.token;
	jwt.verify(token, app.get('secret'), function (err, decoded) {
		if (err) {
			res.json({
				success: false,
				message: 'Failed to authenticate token. Make sure to include the ' +
					'token returned from /users call in the authorization header ' +
					' as a Bearer token'
			});
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
var server = http.createServer(app).listen(port, function () {});
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
// Register and enroll user
app.post('/users', async function (req, res) {
	var username = req.body.username;
	var orgName = req.body.orgName;
	logger.debug('End point : /users');
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
	var token = jwt.sign({
		exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
		username: username,
		orgName: orgName
	}, app.get('secret'));
	let response = await getRegisteredUser.getRegisteredUser(username, orgName, true);
	logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
	if (response && typeof response !== 'string') {
		logger.debug('Successfully registered the username %s for organization %s', username, orgName);
		response.token = token;
		res.json(response);
	} else {
		logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
		res.json({
			success: false,
			message: response
		});
	}
});

// Query getPeersForOrg
app.get('/user/peers', async (req, res) => {
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
app.get('/channels', async (req, res) => {
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
app.get('/:peer/channels', async (req, res) => {
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
app.get('/:peer/other_channels', async (req, res) => {
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

// Create Channel
app.post('/channels', async function (req, res) {
	logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
	logger.debug('End point : /channels');
	var channelName = req.body.channelName;
	var channelConfigPath = req.body.channelConfigPath;
	logger.debug('Channel name : ' + channelName);
	logger.debug('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!channelConfigPath) {
		res.json(getErrorMessage('\'channelConfigPath\''));
		return;
	}

	let message = await createChannel.createChannel(channelName, channelConfigPath, req.orgname);
	res.json(message);
});

// Join Channel
app.post('/channels/:channelName/peers', async function (req, res) {
	logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
	var channelName = req.params.channelName;
	var peers = req.body.peers;
	logger.debug('channelName : ' + channelName);
	logger.debug('peers : ' + peers);
	logger.debug('username :' + req.username);
	logger.debug('orgname:' + req.orgname);

	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}

	let message = await joinChannel.joinChannel(channelName, peers, req.orgname, req.username);
	res.json(message);
});

// Get getChannelDiscoveryResults
app.get('/discover/:channelName', async (req, res) => {
	logger.info('<<<<<<<<<<<<<<<<< DISCOVER CHANNEL >>>>>>>>>>>>>>>>>');

	var channelName = req.params.channelName;
	var peer = req.query.peer;

	logger.debug('channelName : ' + channelName);
	logger.debug('username :' + req.username);
	logger.debug('orgname:' + req.orgname);

	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}

	let message = await query.getChannelDiscoveryResults(channelName, req.orgname, req.username, peer);
	res.json(message);
});

// Query blocks
app.get('/channels/:channelName/blocks', async (req, res) => {
	logger.info('<<<<<<<<<<<<<<<<< QUERY BLOCKS >>>>>>>>>>>>>>>>>');

	var channelName = req.params.channelName;
	var peer = req.query.peer;
	var to = req.query.to;
	var offset = req.query.offset;

	logger.debug('channelName : ' + channelName);
	logger.debug('peer : ' + peer);
	logger.debug('username :' + req.username);
	logger.debug('orgname:' + req.orgname);
	logger.debug('query details: to: %s, offset: %s, peer: %s', to, offset, peer);

	let result = await query.getBlockList(to, offset, peer, channelName, req.orgname, req.username);
	console.log(result)
	res.json(result);
});