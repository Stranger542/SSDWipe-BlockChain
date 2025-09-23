// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SSDWipeStorage
 * @dev Stores the essential details of an SSD wipe event, allowing for
 * the data to be retrieved to regenerate a certificate.
 * The certificate_id from the source JSON is used as the primary key.
 */
contract SSDWipeStorage is Ownable {

    // A struct to hold all necessary data points from the JSON file.
    struct WipeCertificateData {
        // Device Info
        string deviceType;
        string model;
        string serialNumber;
        uint64 capacityBytes;

        // Wipe Process Info
        string wipeMethod;
        string startTime;
        string endTime;
        uint32 durationSeconds;
        string verificationStatus;

        // Audit Info
        string operator;
        string host;
        string certificateId;

        // Metadata
        uint256 blockTimestamp; // The time this record was added to the blockchain
        address minter;         // The address that submitted this record
    }

    // A mapping from the unique certificate ID (e.g., "uuid-1234-5678")
    // to the stored certificate data.
    mapping(string => WipeCertificateData) public certificates;

    // An event that is emitted when a new certificate is stored.
    event CertificateStored(
        string indexed certificateId,
        string serialNumber,
        address indexed minter
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Stores a new wipe certificate's data on the blockchain.
     * @dev The caller must be the contract owner.
     * @param _data The complete set of certificate data to store.
     */
    function storeCertificate(WipeCertificateData calldata _data) public onlyOwner {
        // Ensure that this certificate ID has not already been used.
        require(
            bytes(certificates[_data.certificateId].certificateId).length == 0,
            "Certificate ID already exists"
        );

        // Store the provided data along with blockchain metadata
        certificates[_data.certificateId] = WipeCertificateData({
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
            blockTimestamp: block.timestamp,
            minter: msg.sender
        });

        emit CertificateStored(
            _data.certificateId,
            _data.serialNumber,
            msg.sender
        );
    }

    /**
     * @notice Retrieves the data for a given certificate ID.
     * @param _certificateId The unique ID of the certificate to retrieve.
     * @return The stored WipeCertificateData struct.
     */
    function getCertificateData(string calldata _certificateId)
        public
        view
        returns (WipeCertificateData memory)
    {
        return certificates[_certificateId];
    }
}
