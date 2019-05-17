var sha = require('js-sha256');
var asn = require('asn1.js');

var calculateBlockHash = function (header) {

    let headerAsn = asn.define('headerAsn', function () {
        this.seq().obj(
            this.key('Number').int(),
            this.key('PreviousHash').octstr(),
            this.key('DataHash').octstr()
        );
    });

    let output = headerAsn.encode({
        Number: parseInt(header.number),
        PreviousHash: Buffer.from(header.previous_hash, 'hex'),
        DataHash: Buffer.from(header.data_hash, 'hex')
    }, 'der');
    let hash = sha.sha256(output);
    return hash;
};

exports.calculateBlockHash = calculateBlockHash;