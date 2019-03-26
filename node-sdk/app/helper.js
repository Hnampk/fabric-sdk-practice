'use strict';
var hfc = require('fabric-client');
var log4js = require('log4js');
var logger = log4js.getLogger('Helper');
logger.setLevel('DEBUG');

/**
 * Thiết lập client dựa trên file network config
 * @param {string} orgName 
 * @param {string} username 
 */
async function getClientForOrg(orgName, username) {
    /**
     * TODO:
     *  (1) Tạo client dựa trên file network config
     *  (2) Load connection profile của phần client
     *  (3) Tạo store để lưu trữ khóa (KeyValue store)
     *  ---
     *  (4) Nếu gọi kèm username, thực hiện kiểm tra xem user đã đăng ký hay chưa
     *      và gắn vào client
     */

    logger.debug('getClientForOrg - ****** START %s %s', orgName, username)
    let config = '-connection-profile-path';

    // (1) Tạo client dựa trên file network config
    let client = hfc.loadFromConfig(hfc.getConfigSetting("network" + config));

    // (2) Load connection profile của phần client
    client.loadFromConfig(hfc.getConfigSetting(orgName + config));

    // (3) Tạo store để lưu trữ khóa (KeyValue store)
    await client.initCredentialStores();

    // (4) Nếu gọi kèm username, thực hiện kiểm tra xem user đã đăng ký hay chưa
    //     và gắn vào client
    if (username) {
        let user = await client.getUserContext(username, true);
        if (!user) {
            throw new Error('User was not found :', username);
        }
        logger.debug('User %s was found to be registered and enrolled', username);
    }

    logger.debug('getClientForOrg - ****** END %s %s \n\n', orgName, username)

    return client;
}

var getLogger = function (moduleName) {
    var logger = log4js.getLogger(moduleName);
    logger.setLevel('DEBUG');
    return logger;
};

exports.getClientForOrg = getClientForOrg;
exports.getLogger = getLogger;