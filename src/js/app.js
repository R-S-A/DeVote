var web3Provider = null;
var contracts = {};

/* our instance variables */

var candidates = {};
var numCandidates;


function init() {
    return initWeb3();
}

function initWeb3() {
    // Is there is an injected web3 instance?
    if (typeof web3 !== 'undefined') {
        web3Provider = web3.currentProvider;
    } else {
        // If no injected web3 instance is detected, fallback to the TestRPC
        web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(web3Provider);
    return initContract();
}

function initContract(){
    $.getJSON('Vote.json', function(data) {
        // Get the necessary contract artifact file and instantiate it with truffle-contract
        var VoteArtifact = data;
        contracts.Vote = TruffleContract(VoteArtifact);

        // Set the provider for our contract
        contracts.Vote.setProvider(web3Provider);

        // Use our contract to retrieve and mark the adopted pets
        return getCandidates();
    });
    return bindEvents();
}

function bindEvents() {
    console.log("Here's where we bind the events");
}

//updates the lists of candidates by calling for number of candidates and making n calls for each candidate
function getCandidates() {
    var voteInstance;

    candidates = {};
    contracts.Vote.deployed().then(
        function(instance) {
            voteInstance = instance;
            voteInstance.getNumCandidates.call().then(
                function(result){
                    numCandidates = result['c'][0];
                    for(var i=0;i<numCandidates;i++){
                        (function(foo){
                            voteInstance.getCandidate.call(foo).then(
                                function(hexName){
                                    var name = web3.toAscii(hexName);
                                    candidates[name] = 0;
                                    if(foo == numCandidates-1){
                                        console.log(candidates);
                                        getVoteCounts();
                                    }
                                }
                            )}(i));
                    }
                });
        }).catch(function(err) {
        console.log(err.message);
    });
}


function getVoteCounts(){
    var voteInstance;
    contracts.Vote.deployed().then(
        function(instance) {
            voteInstance = instance;
            for(var name in candidates) {
                if (candidates.hasOwnProperty(name)) {
                    (function(bar){
                        voteInstance.getVotesForCandidate.call(bar).then(
                            function(result) {
                                candidates[bar] = result['c'][0];
                                console.log(bar + " : " + candidates[bar]);
                            }
                        )
                    }(name));
                }           
            }
            return candidates;
        }).catch(function(err) {
        console.log(err.message);
    });
}

function canVote(voterID){
    var voteInstance;
    contracts.Vote.deployed().then(
        function(instance) {
            voteInstance = instance;
            voteInstance.eligible.call(voterID).then(function(result){
                console.log(result); 
            });
        }).catch(function(err) {
        console.log(err.message);
    });
}


function sendVote(myName, name) {
    //event.preventDefault();

    var voteInstance;

    web3.eth.getAccounts(function(error, accounts) {
        if (error) {
            console.log(error);
        }

        var account = accounts[0];

        contracts.Vote.deployed().then(function(instance) {
            voteInstance = instance;
            console.log("Sending vote");
            // Execute adopt as a transaction by sending account
            voteInstance.sendVote(myName, name, {from: account}).then(
                function(sendResult){
                    console.log(sendResult);
                }
            );
        }).catch(function(err) {
            console.log(err.message);
        });
    });
}

function getSten(){
    var voteInstance;
    contracts.Vote.deployed().then(
        function(instance) {
            voteInstance = instance;
            voteInstance.getVotesForCandidate.call("Sten").then(
                function(result) {
                    console.log(result);
                }
            )
        }           
    );
}

$(function() {
    $(window).load(function() {
        init();
    });
});