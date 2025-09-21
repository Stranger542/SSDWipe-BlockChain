// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./OperatorRegistry.sol";

contract SSDWipeCertificate is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;

    OperatorRegistry public immutable operatorRegistry;
    mapping(string => bool) private _serialNumberUsed;
    mapping(string => uint256) public tokenIdBySerial;

    struct WipeDetails {
        string ssdSerialNumber;
        string ssdModel;
        string wipeMethod;
        uint256 timestamp;
        address operator;
        bytes32 verificationHash;
        bytes32 localCertificateHash; // --- NEW ---
    }

    mapping(uint256 => WipeDetails) public wipeDetailsLog;

    event CertificateMinted(uint256 indexed tokenId, address indexed operator, string ssdSerialNumber);
    event CertificateRevoked(uint256 indexed tokenId, address indexed owner);

    constructor(
        address _registryAddress,
        address initialOwner
    ) ERC721("SSDWipeCertificate", "SWC") Ownable(initialOwner) {
        require(_registryAddress != address(0), "Registry address cannot be zero");
        operatorRegistry = OperatorRegistry(_registryAddress);
    }

    function mintCertificate(
        address recipient,
        string calldata ssdSerialNumber,
        string calldata ssdModel,
        string calldata wipeMethod,
        uint256 timestamp,
        string calldata _tokenURI,
        bytes32 localCertificateHash // --- NEW ---
    ) public returns (uint256) {
        require(operatorRegistry.isOperator(msg.sender), "Caller is not an authorized operator");
        require(!_serialNumberUsed[ssdSerialNumber], "SSD serial number already certified");

        uint256 newTokenId = _tokenIdCounter;
        _tokenIdCounter++;

        bytes32 verificationHash = keccak256(abi.encodePacked(ssdSerialNumber, ssdModel, wipeMethod, timestamp, msg.sender));
        
        _mint(recipient, newTokenId);
        _setTokenURI(newTokenId, _tokenURI);

        wipeDetailsLog[newTokenId] = WipeDetails({
            ssdSerialNumber: ssdSerialNumber,
            ssdModel: ssdModel,
            wipeMethod: wipeMethod,
            timestamp: timestamp,
            operator: msg.sender,
            verificationHash: verificationHash,
            localCertificateHash: localCertificateHash // --- NEW ---
        });

        _serialNumberUsed[ssdSerialNumber] = true;
        tokenIdBySerial[ssdSerialNumber] = newTokenId;

        emit CertificateMinted(newTokenId, msg.sender, ssdSerialNumber);
        return newTokenId;
    }

    function revokeCertificate(uint256 tokenId) public onlyOwner {
        require(ownerOf(tokenId) != address(0), "Certificate with this ID does not exist");
        WipeDetails memory details = wipeDetailsLog[tokenId];
        if (bytes(details.ssdSerialNumber).length > 0) {
            _serialNumberUsed[details.ssdSerialNumber] = false;
            delete tokenIdBySerial[details.ssdSerialNumber];
        }
        _burn(tokenId);
        emit CertificateRevoked(tokenId, msg.sender);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}