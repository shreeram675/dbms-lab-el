// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DocumentRegistry {
    struct Document {
        string docId;
        string hash;
        address owner;
        uint256 timestamp;
    }

    mapping(string => Document) private documents; // docId -> Document
    event HashStored(string indexed docId, string hash, address indexed owner, uint256 timestamp);

    function storeHash(string memory _docId, string memory _hash) public {
        require(bytes(documents[_docId].hash).length == 0, "Document ID already exists");
        
        documents[_docId] = Document({
            docId: _docId,
            hash: _hash,
            owner: msg.sender,
            timestamp: block.timestamp
        });

        emit HashStored(_docId, _hash, msg.sender, block.timestamp);
    }

    function verifyHash(string memory _docId, string memory _hash) public view returns (bool) {
        if (bytes(documents[_docId].hash).length == 0) {
            return false;
        }
        return keccak256(bytes(documents[_docId].hash)) == keccak256(bytes(_hash));
    }

    function getDocument(string memory _docId) public view returns (string memory, string memory, address, uint256) {
        require(bytes(documents[_docId].hash).length != 0, "Document not found");
        Document memory doc = documents[_docId];
        return (doc.docId, doc.hash, doc.owner, doc.timestamp);
    }
}
