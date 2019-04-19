'use strict';
const path = require('path');
const fs = require('fs');
const util = require('util');
const hfc = require('fabric-client');
const log4js = require('log4js');
const logger = log4js.getLogger('Helper');
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

    // (1) Tạo client dựa trên file network config, được set trong file config.js
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

/**
 * Set thông tin admin Orderer cho client 
 */
async function getOrdererAdmin(client) {
    const keyPath = path.join(__dirname, '../../fabric/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp/keystore');
    const keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
    const certPath = path.join(__dirname, '../../fabric/crypto-config/ordererOrganizations/example.com/users/Admin@example.com/msp/signcerts');
    const certPEM = readAllFiles(certPath)[0];
    logger.debug('getOrdererAdmin');

    client.setAdminSigningIdentity(keyPEM.toString(), certPEM.toString(), "OrdererMSP");

    // return Promise.resolve(client.createUser({
    //     username: 'ordererAdmin',
    //     mspid: 'OrdererMSP',
    //     cryptoContent: {
    //         privateKeyPEM: keyPEM.toString(),
    //         signedCertPEM: certPEM.toString()
    //     }
    // }));
}

async function getAdmin(client, userOrg) {
    let lowerOrgName = userOrg.toLowerCase();
    const keyPath = path.join(__dirname, util.format('../../fabric/crypto-config/peerOrganizations/%s.example.com/users/Admin@%s.example.com/msp/keystore', lowerOrgName, lowerOrgName));
    const keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
    const certPath = path.join(__dirname, util.format('../../fabric/crypto-config/peerOrganizations/%s.example.com/users/Admin@%s.example.com/msp/signcerts', lowerOrgName, lowerOrgName));
    const certPEM = readAllFiles(certPath)[0];

    client.setAdminSigningIdentity(keyPEM.toString(), certPEM.toString(), userOrg + "MSP");

    // console.log(keyPEM.toString(), certPEM.toString());

    // const cryptoSuite = hfc.newCryptoSuite();
    // if (userOrg) {
    //     cryptoSuite.setCryptoKeyStore(hfc.newCryptoKeyStore({
    //         path: "./fabric-client-kv-" + lowerOrgName
    //     }));
    //     client.setCryptoSuite(cryptoSuite);
    // }

    // return Promise.resolve(client.createUser({
    //     username: 'peer' + userOrg + 'Admin',
    //     mspid: userOrg + "MSP",
    //     cryptoContent: {
    //         privateKeyPEM: keyPEM.toString(),
    //         signedCertPEM: certPEM.toString()
    //     }
    // }));
}

var getLogger = function (moduleName) {
    var logger = log4js.getLogger(moduleName);
    logger.setLevel('DEBUG');
    return logger;
};

function readAllFiles(dir) {
    const files = fs.readdirSync(dir);
    const certs = [];
    files.forEach((file_name) => {
        const file_path = path.join(dir, file_name);
        logger.debug(' looking at file ::' + file_path);
        const data = fs.readFileSync(file_path);
        certs.push(data);
    });
    return certs;
}

exports.getClientForOrg = getClientForOrg;
exports.getLogger = getLogger;
exports.getOrdererAdmin = getOrdererAdmin;
exports.getAdmin = getAdmin;