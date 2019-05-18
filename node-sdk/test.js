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
var query = require('./app/query.js');
var invokeChaincode = require('./app/invoke.js');
var updateAnchorPeers = require('./app/update-anchor-peers.js');
var updateChannelConfig = require('./app/update-channel-config');
var addNewOrg = require('./app/add-new-org.js');
var utils = require('./app/utils.js');

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

    /**
     * MAIN FLOW: 
     *  (1) Create channel
     *  (2) Register User
     *  (3) Join Peers into channel
     *  (4) Install chaincode
     *  (5) Instantiate chaincode
     *  (6) Query chaincode
     *  (7) Invoke chaincode
     */
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
    // await query.queryChaincode(["peer0.org1.example.com","peer1.org1.example.com"], 'mycc', 'query', ['a'], 'mychannel', 'Org1', 'Tom');
    // await invokeChaincode.invokeChaincode(["peer0.org1.example.com", "peer0.org2.example.com"], "mycc", "move", ["a", "b", "10"], "mychannel", "Org1", "Tom");

    // await query.getChannelList("peer0.org1.example.com", "Org1", "Tom");
    // await query.getOrgChannelList( "Org1", "Tom");

    // await createChannel.createChannel("anotherchannel", "../../fabric/channel-artifacts/anotherchannel.tx", "Org1");
    // await joinChannel.joinChannel("anotherchannel", ["peer0.org1.example.com", "peer1.org1.example.com"], "Org1", "Tom");
    // await joinChannel.joinChannel("anotherchannel", ["peer0.org2.example.com", "peer1.org2.example.com"], "Org2", "Jim");



    // let a = await query.getChannelDiscoveryResults('mychannel', 'Org1', 'Tom');
    // console.log(a.result.peers_by_org.Org2MSP.peers);
    // await query.getChannelListNotJoined('peer0.org1.example.com', 'Org1', 'Tom');

    /**
     * Join New Peer of an existing Org into channel
     */
    // await joinNewPeer();

    /**
     * Update channel config
     *  (i) Modify channel Batchsize
     */
    // await updateChannelConfig.modifyBatchSize(20, 'mychannel', 'Org1', 'Tom');


    /**
     * Add new Org into network
     *  (1) Chuẩn bị các file cấu hình
     *  (2) Tạo certificate
     *  ---
     *  (3) Update cấu hình channel
     *  ---
     *  (4) Start các container của Org mới
     *  ---
     *  (5) Join các peer vào channel
     *  (6) Cài đặt và upgrade chaincode (Optional)
     */
    // await addNewOrg.addNewOrg('Org3', 'mychannel', 'Org1', 'Tom');
    // await getRegisteredUser.getRegisteredUser("Alex", "Org3", true);
    // await joinChannel.joinChannel("mychannel", ["peer0.org3.example.com", "peer1.org3.example.com"], "Org3", "Alex");



    // await query.queryInfo("peer0.org1.example.com", "mychannel", "Org1", "Tom");
    await query.queryBlockByHash("peer0.org1.example.com", "6cf9cdea21efb0903f3447a583c245bf8d34816facab55343a908bb6cdebb6ad", "mychannel", "Org1", "Tom");
    // await query.getPeers("mychannel", "Org1", "Tom");
    // await query.getChannelList('peer0.org1.example.com', 'Org1', 'Tom');
    // await query.getPeersForOrg("Org1", 'Tom');
    // await query.getOrgs("mychannel", "Org1", "Tom");

    // try {
        // let blockList = await query.getBlockList(-1, 2, "peer0.org1.example.com", "mychannel", "Org1", "Tom");
        // console.log(blockList.blocks)
        // let block = blockList[1];
    //     console.log(block, block.data.data[0].payload)
    // } catch (err) {
    //     console.log("ERROR: ", err);
    // }

    // await query.queryTransaction("peer0.org1.example.com", "mychannel", "Org1", "Tom");

    // for(let i = 0; i < 111; i++){
    //     invokeChaincode.invokeChaincode(["peer0.org1.example.com", "peer0.org2.example.com"], "mycc", "move", ["a", "b", "10"], "mychannel", "Org1", "Tom");
    // }

}

start();