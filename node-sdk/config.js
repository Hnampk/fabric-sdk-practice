'use strict';
var path = require('path');
var hfc = require('fabric-client');

hfc.setConfigSetting('network-connection-profile-path', path.join(__dirname, "../fabric/connection-profiles", 'network-config.yaml'));
hfc.setConfigSetting('Org1-connection-profile-path', path.join(__dirname, "../fabric/connection-profiles", 'org1.yaml'));
hfc.setConfigSetting('Org2-connection-profile-path', path.join(__dirname, "../fabric/connection-profiles", 'org2.yaml'));
hfc.setConfigSetting('Org3-connection-profile-path', path.join(__dirname, "../fabric/connection-profiles", 'org3.yaml'));

hfc.addConfigFile(path.join(__dirname, 'config.json'));