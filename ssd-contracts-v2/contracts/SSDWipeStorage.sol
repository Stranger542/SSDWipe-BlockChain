// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract SSDWipeStorage is Ownable {

    struct WipeCertificateData {
        string deviceType;
        string model;
        string serialNumber;
        uint64 capacityBytes;
        string wipeMethod;
        string startTime;
        string endTime;
        uint32 durationSeconds;
        string verificationStatus;
        string operator;
        string host;
        string certificateId;
        // --- NEW FIELD ---
        string digitalSignature; // To store the signature from the JSON file
        uint256 blockTimestamp;
        address minter;
    }

    mapping(string => WipeCertificateData) public certificates;

    event CertificateStored(
        string indexed serialNumber,
        string certificateId,
        address indexed minter
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    function storeCertificate(WipeCertificateData calldata _data) public onlyOwner {
        require(
            bytes(certificates[_data.serialNumber].serialNumber).length == 0,
            "Certificate for this serial number already exists"
        );

        certificates[_data.serialNumber] = WipeCertificateData({
            deviceType: _data.deviceType,
            model: _data.model,
            serialNumber: _data.serialNumber,
            capacityBytes: _data.capacityBytes,
            wipeMethod: _data.wipeMethod,
            startTime: _data.startTime,
            endTime: _data.endTime,
            durationSeconds: _data.durationSeconds,
            verificationStatus: _data.verificationStatus,
            operator: _data.operator,
            host: _data.host,
            certificateId: _data.certificateId,
            // --- NEW FIELD ASSIGNMENT ---
            digitalSignature: _data.digitalSignature,
            blockTimestamp: block.timestamp,
            minter: msg.sender
        });

        emit CertificateStored(
            _data.serialNumber,
            _data.certificateId,
            msg.sender
        );
    }

    function getCertificateData(string calldata _serialNumber)
        public
        view
        returns (WipeCertificateData memory)
    {
        return certificates[_serialNumber];
    }
}