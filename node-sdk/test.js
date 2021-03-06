'user strict';
var hfc = require('fabric-client');
var path = require('path');
var fs = require('fs');

require('./config.js');
var channel = require('./services/channel');
var user = require('./services/user');
var peer = require('./services/peer');
var block = require('./services/block');
var organization = require('./services/organization');
var chaincode = require('./services/chaincode');

var updateAnchorPeers = require('./app/update-anchor-peers.js');
var addNewOrg = require('./app/add-new-org.js');



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
    await channel.joinChannel("mychannel", ["peer2.org2.example.com"], "Org2", "Jim");
}

async function start() {
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


    let edsmplc = {
        identities: [{
                role: {
                    name: 'member',
                    mspId: 'Org1MSP'
                }
            },
            {
                role: {
                    name: 'member',
                    mspId: 'Org2MSP'
                }
            }
        ],
        policy: {
            '1-of': [{
                'signed-by': 0
            }, {
                'signed-by': 1
            }]
        }
    }

    let edsmplc1 = {
        identities: [{
                role: {
                    name: 'member',
                    mspId: 'Org1MSP'
                }
            },
            {
                role: {
                    name: 'member',
                    mspId: 'Org2MSP'
                }
            }
        ],
        policy: {
            "2-of": [
                { "signed-by": 0 },
                { "signed-by": 1 },
            ]
        }
    }

    // await channel.createChannel("mychannel", "../../fabric/channel-artifacts/channel.tx", "Org1");
    // await user.getRegisteredUser("Tom", "Org1", true);
    // await user.getRegisteredUser("Jim", "Org2", true);
    // await channel.joinChannel("mychannel", ["peer0.org1.example.com", "peer1.org1.example.com"], "Org1", "Tom");
    // await channel.joinChannel("mychannel", ["peer0.org2.example.com", "peer1.org2.example.com"], "Org2", "Jim");
    // await updateAnchorPeers.updateAnchorPeers("mychannel", "../../fabric/channel-artifacts/Org1MSPanchors.tx", "Tom", "Org1");
    // await updateAnchorPeers.updateAnchorPeers("mychannel", "../../fabric/channel-artifacts/Org2MSPanchors.tx", "Jim", "Org2");
    // await chaincode.installChaincode(["peer0.org1.example.com", "peer1.org1.example.com"], "mycc", "github.com/example_cc/go", "1.0", "golang", "Org1", "Tom");
    // await chaincode.installChaincode(["peer0.org2.example.com", "peer1.org2.example.com"], "mycc", "github.com/example_cc/go", "1.0", "golang", "Org2", "Jim");
    // await chaincode.instantiateChaincode(["peer0.org1.example.com"], "mychannel", "mycc", "1.0", "golang", "init", ["a", "100", "b", "200"], edsmplc, "Org1", "Tom");

    // let plan = await chaincode.test("mycc", "mychannel", "Org1", "Tom");
    // console.log(plan.groups['G0'])

    // await chaincode.installChaincode(["peer0.org1.example.com", "peer1.org1.example.com"], "mycc", "github.com/example_cc/go", "2.0", "golang", "Org1", "Tom");
    // await chaincode.installChaincode(["peer0.org2.example.com", "peer1.org2.example.com"], "mycc", "github.com/example_cc/go", "2.0", "golang", "Org2", "Jim");
    // await chaincode.upgradeChaincode(["peer0.org1.example.com"], "mychannel", "mycc", "2.0", "golang", "init", ["a", "100", "b", "200"], edsmplc1, "Org1", "Tom");

    let plan = await chaincode.getChaincodeEndorsementPlan("peer0.org1.example.com", "mychannel", "mycc", "Org2", "Jim");
    console.log(plan)

    // let invokeResponse = await chaincode.invokeChaincode(["peer1.org1.example.com"], "mycc", "move", ["a", "b", "10"], "mychannel", "Org1", "Tom");
    // console.log("invokeResponse", invokeResponse)
    // let queryResponse = await chaincode.query(["peer1.org1.example.com"], 'mycc', 'query', ['a'], 'mychannel', 'Org2', 'Jim');
    // console.log("queryResponse", queryResponse)

    // let queryResponse = await chaincode.query(["peer1.org1.example.com"], 'mycc1', 'query', ['a'], 'mychannel', 'Org1', 'Tom');
    // console.log("queryResponse", queryResponse)
    // let invokeResponse = await chaincode.invokeChaincode(null, "mycc1", "move", ["a", "b", "10"], "mychannel", "Org1", "Tom");
    // console.log("invokeResponse", invokeResponse)








    // await peer.getChannelList("peer0.org1.example.com", "Org1", "Tom");

    // await channel.createChannel("anotherchannel", "../../fabric/channel-artifacts/anotherchannel.tx", "Org1");
    // await channel.joinChannel("anotherchannel", ["peer0.org1.example.com", "peer1.org1.example.com"], "Org1", "Tom");
    // await channel.joinChannel("anotherchannel", ["peer0.org2.example.com", "peer1.org2.example.com"], "Org2", "Jim");



    // let a = await channel.getChannelDiscoveryResults('mychannel', 'Org1', 'Tom');
    // console.log(a.result.peers_by_org.Org2MSP.peers);
    // await peer.getChannelListSameOrg('peer0.org1.example.com', 'Org1', 'Tom');

    /**
     * Join New Peer of an existing Org into channel
     */
    // await joinNewPeer();

    /**
     * Update channel config
     *  (i) Modify channel Batchsize
     */
    // await updateChannelConfig.modifyChannelBatchConfig('mychannel', {
    //     "absoluteMaxBytes": 102760448,
    //     "maxMessageCount": 10,
    //     "preferredMaxBytes": 102760448
    // }, {
    // 	"timeout": "1.5s"
    // }, 'Org1', 'Tom');


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
    // await user.getRegisteredUser("Alex", "Org3", true);
    // await channel.joinChannel("mychannel", ["peer0.org3.example.com", "peer1.org3.example.com"], "Org3", "Alex");



    // await chaincode.queryInfo("peer0.org1.example.com", "mychannel", "Org1", "Tom");
    // await block.queryBlockByHash("peer0.org1.example.com", "6cf9cdea21efb0903f3447a583c245bf8d34816facab55343a908bb6cdebb6ad", "mychannel", "Org1", "Tom");
    // await channel.getPeers("mychannel", "Org1", "Tom");
    // await peer.getChannelList('peer0.org1.example.com', 'Org1', 'Tom');
    // await organization.getPeersForOrg("Org1", 'Tom');
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

    // for (let i = 0; i < 22; i++) {
    //     chaincode.invokeChaincode(["peer0.org1.example.com", "peer0.org2.example.com"], "mycc", "move", ["a", "b", "10"], "mychannel", "Org1", "Tom");
    // }


    // await chaincode.instantiateChaincode(["peer0.org1.example.com"], "mychannel", "mycc", "1.0", "golang", "init", ["a", "100", "b", "200"], "Org1", "Tom", edsmplc);

    // await chaincode.test("mychannel", "Org1", "Tom");

    // await chaincode.installChaincode(["peer0.org1.example.com"], "javacc", "/src/github.com/java-fabric-chaincode-template", "1.0", "java", "Org1", "Tom");
    // await chaincode.instantiateChaincode(["peer0.org1.example.com"], "mychannel", "newcc", "1.0", "golang", "init", ["a", "b", "10"], "Org1", "Tom", edsmplc)

    // await chaincode.invokeChaincode(["peer0.org1.example.com"], "javacc", "listAccount", ["11"], "mychannel", "Org1", "Tom");
    // await query.queryChaincode(["peer0.org1.example.com"], 'javacc', 'listAccount', ['10'], 'mychannel', 'Org1', 'Tom');
}

start();