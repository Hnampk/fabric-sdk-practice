'use strict';

function getErrorMessage(field) {
    var response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

/**
 * 
 * @param {string} message 
 */
function getFailureResponse(message) {
    var response = {
        success: false,
        message: message
    };
    return response;
}

/**
 * 
 * @param {string} message 
 * @param {JSON} object 
 */
function getSuccessResponse(message, object) {
    let response = {
        success: true,
        message: message
    };

    if (object) {
        response.result = object;
    }

    return response;
}

exports.getErrorMessage = getErrorMessage;
exports.getFailureResponse = getFailureResponse;
exports.getSuccessResponse = getSuccessResponse;