'use strict';
var path = require('path');
var hfc = require('fabric-client');

hfc.setConfigSetting('network-connection-profile-path', path.join(__dirname, "../../fabric/connection-profiles", 'network-config.yaml'));
hfc.setConfigSetting('Org1-connection-profile-path', path.join(__dirname, "../../fabric/connection-profiles", 'org1.yaml'));
hfc.setConfigSetting('Org2-connection-profile-path', path.join(__dirname, "../../fabric/connection-profiles", 'org2.yaml'));
hfc.setConfigSetting('admins', [{
    "username": "admin",
    "secret": "adminpw"
}]);
hfc.setConfigSetting('CC_SRC_PATH', '../../fabric');