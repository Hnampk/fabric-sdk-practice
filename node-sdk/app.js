'user strict';
var hfc = require('fabric-client');
var path = require('path');
var fs = require('fs');

require('./app/config.js');
var createChannel = require('./app/create-channel.js');
var getRegisteredUser = require('./app/get-registered-user.js');
var joinChannel = require('./app/join-channel.js');
var installChaincode = require('./app/install-chaincode.js');
var instantiateChaincode = require('./app/instantiate-chaincode');
var queryChaincode = require('./app/query.js');
var invokeChaincode = require('./app/invoke.js');
var updateAnchorPeers = require('./app/update-anchor-peers.js');
var updateChannelConfig = require('./app/update-channel-config');

// var helper = require('./raw-app/helper.js');
// var createChannel = require('./raw-app/create-channel.js');
// var join = require('./raw-app/join-channel.js');
// var updateAnchorPeers = require('./raw-app/update-anchor-peers.js');
// var install = require('./raw-app/install-chaincode.js');
// var instantiate = require('./raw-app/instantiate-chaincode.js');
// var invoke = require('./raw-app/invoke-transaction.js');
// var query = require('./raw-app/query.js');



/**
 * Join peer mới của Org thành viên vào channel:
 */
async function joinNewPeer() {
    /**
     * TODO:
     *  (1) Generate crypto config cho peer mới:
     *      - Edit file crypto-config.yaml/PeerOrgs/<OrgName>/Template/Count ++
     *      - chạy lệnh để generate: E.g. ../../bin/cryptogen extend --config=./crypto-config.yaml
     *  (2) Tạo file docker compose cho container của peer mới (E.g. docker-compose-new-peer.yaml), chú ý ko trùng ports
     *  (3) Khởi chạy container của peer mới theo file docker compose mới tạo với lệnh "docker-compose up"
     *  (4) Edit file network-profiles/network-config.yaml: Thêm thông tin về peer mới
     *  (5) Sử dụng SDK function join channel
     */
    await joinChannel.joinChannel("mychannel", ["peer2.org2.example.com"], "Org2", "Jim");
}

async function start() {
    // await installChaincode.installChaincode(["peer0.org1.example.com", "peer1.org1.example.com"], "another", "/src/github.com/example_cc/node", "v1", "node", "Org1", "Tom");

    // await createChannel.createChannel("mychannel", "../../fabric/channel-artifacts/channel.tx", "Org1");
    // await getRegisteredUser.getRegisteredUser("Tom", "Org1", true);
    // await getRegisteredUser.getRegisteredUser("Jim", "Org2", true);
    // await joinChannel.joinChannel("mychannel", ["peer0.org1.example.com", "peer1.org1.example.com"], "Org1", "Tom");
    // await joinChannel.joinChannel("mychannel", ["peer0.org2.example.com"], "Org2", "Jim");
    // await updateAnchorPeers.updateAnchorPeers("mychannel", "../../fabric/channel-artifacts/Org1MSPanchors.tx", "Tom", "Org1");
    // await updateAnchorPeers.updateAnchorPeers("mychannel", "../../fabric/channel-artifacts/Org2MSPanchors.tx", "Jim", "Org2");
    // await installChaincode.installChaincode(["peer0.org1.example.com", "peer1.org1.example.com"], "mycc", "github.com/example_cc/go", "v0", "golang", "Org1", "Tom");
    // await installChaincode.installChaincode(["peer0.org2.example.com"], "mycc", "github.com/example_cc/go", "v0", "golang", "Org2", "Jim");
    // await instantiateChaincode.instantiateChaincode(["peer0.org1.example.com", "peer1.org1.example.com"], "mychannel", "mycc", "v0", "golang", "init", ["a", "100", "b", "200"], "Org1", "Tom");
    // await queryChaincode.queryChaincode(["peer0.org1.example.com","peer1.org1.example.com"], 'mycc', 'query', ['a'], 'mychannel', 'Org1', 'Tom');
    // await invokeChaincode.invokeChaincode(["peer0.org1.example.com", "peer0.org2.example.com"], "mycc", "move", ["a", "b", "10"], "mychannel", "Org1", "Tom");

    await joinNewPeer();

    // await updateChannelConfig.modifyBatchSize('mychannel', 'Org1', 'Tom');






    // await createChannel.createChannel("mychannel", "../../fabric/channel-artifacts/channel.tx", "", "Org1");

    // await helper.getRegisteredUser("Tom", "Org1", true);
    // await helper.getRegisteredUser("Jim", "Org2", true);
    // await join.joinChannel("mychannel", ["peer0.org1.example.com", "peer1.org1.example.com"], "Tom", "Org1");
    // await join.joinChannel("mychannel", ["peer0.org2.example.com"], "Jim", "Org2");

    // await install.installChaincode(["peer0.org1.example.com", "peer1.org1.example.com"], "mycc", "github.com/example_cc/go", "v0", "golang", "Tom", "Org1");
    // await install.installChaincode(["peer0.org2.example.com"], "mycc", "github.com/example_cc/go", "v0", "golang", "Jim", "Org2");

    // await instantiate.instantiateChaincode(["peer0.org1.example.com", "peer1.org1.example.com"], "mychannel", "mycc", "v0", "init", "golang", ["a", "100", "b", "200"], "Tom", "Org1");

}

start();