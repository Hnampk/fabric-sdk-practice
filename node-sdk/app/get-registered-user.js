'use strict';
var hfc = require('fabric-client');

var helper = require('./helper.js');
var logger = helper.getLogger('Get-registered-user');

/**
 * Lấy thông tin user theo username. Nếu chưa tồn tại thì thực hiện đăng ký cho user
 * @param {string} username 
 * @param {string} orgName 
 * @param {boolean} isJson kiểu dữ liệu mong muốn nhận được
 */
async function getRegisteredUser(username, orgName, isJson) {
    /**
     * TODO:
     *  (1) Thiết lập client của Org
     *  (2) Kiểm tra thông tin user. Nếu chưa tồn tại, thực hiện tiếp các bước (3)(4) sau
     *  ---
     *  (3) Thiết lập user object dưới vai trò Admin
     *  (4) Dùng CA của Org thực hiện đăng ký cho user bằng user Admin
     *  ---
     *  (5) Response lại thông tin user 
     */


    try {

        // (1) Thiết lập client của Org
        let client = await helper.getClientForOrg(orgName);
        logger.debug('Successfully initialized the credential stores');

        // (2) Kiểm tra thông tin user. Nếu chưa tồn tại, thực hiện tiếp các bước (3)(4) sau
        let user = await client.getUserContext(username, true);
        if (user && user.isEnrolled()) {
            logger.info('Successfully loaded member from persistence');
        } else {
            logger.info('User %s was not enrolled, so we will need an admin user object to register', username);

            // (3) Thiết lập user object dưới vai trò Admin
            let admins = hfc.getConfigSetting('admins'); // được set ở file config.js
            let adminUserObj = await client.setUserContext({
                username: admins[0].username,
                password: admins[0].secret
            });

            // (4) Dùng CA của Org thực hiện đăng ký cho user bằng user Admin
            let caClient = client.getCertificateAuthority();
            let secret = await caClient.register({
                enrollmentID: username,
                affiliation: orgName.toLowerCase() + '.department1'
            }, adminUserObj);

            logger.debug('Successfully got the secret for user %s', username);
            user = await client.setUserContext({
                username: username,
                password: secret
            });
            logger.debug('Successfully enrolled username %s  and setUserContext on the client object', username);

            // (5) Response lại thông tin user 
            if (user && user.isEnrolled()) {
                if (isJson && isJson === true) {
                    let response = {
                        success: true,
                        secret: user._enrollmentSecret,
                        message: username + ' enrolled Successfully'
                    };
                    return response;
                } else {

                }
            } else {
                throw new Error('User was not enrolled ')
            }
        }
    } catch (err) {
        logger.error('Failed to get registered user: %s with error: %s', username, err.toString());
        return 'failed ' + error.toString();
    }
}

exports.getRegisteredUser = getRegisteredUser;