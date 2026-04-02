// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "../interface/IRecoverable.sol";

/**
 * @title Recoverable
 * @dev Adds a recovery mechanism to Ownable contracts.
 *      The owner can set a recovery address, which can later restore a new owner.
 */
abstract contract Recoverable is IRecoverable, Ownable2Step, ReentrancyGuard {
    address public recoveryAddress;
    bool public isRecoveryEnabled;

    // Events
    event RecoveryAddressSet(address indexed oldRecovery, address indexed newRecovery);
    event OwnerRecovered(address indexed oldOwner, address indexed newOwner);
    event RecoveryDisabled();

    constructor() Ownable2Step() {
        isRecoveryEnabled = false;
        recoveryAddress = address(0);
    }

    /**
     * @dev Owner sets a recovery address that can restore ownership in case of loss.
     * @param _recoveryAddress The address authorized to recover ownership
     * @param _signature Owner's signature to authorize this action
     * @param _messageHash Hash of the message that was signed
     */
    function setRecoveryAddress(
        address _recoveryAddress,
        bytes memory _signature,
        bytes32 _messageHash
    ) external onlyOwner nonReentrant {
        require(_recoveryAddress != address(0), "Invalid recovery address");
        require(_recoveryAddress != owner(), "Cannot set owner as recovery");

        // Verify signature matches the owner
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(_messageHash);
        address recovered = ECDSA.recover(ethSignedHash, _signature);
        require(recovered == owner(), "Invalid signature");

        address oldRecovery = recoveryAddress;
        recoveryAddress = _recoveryAddress;
        isRecoveryEnabled = true;

        emit RecoveryAddressSet(oldRecovery, _recoveryAddress);
    }

    /**
     * @dev Recovery address can restore a new owner (e.g., after losing access).
     * @param _newOwner The new owner address
     * @param _signature Recovery address's signature to authorize this action
     * @param _messageHash Hash of the message that was signed
     */
    function recoverOwner(
        address _newOwner,
        bytes memory _signature,
        bytes32 _messageHash
    ) external nonReentrant {
        require(isRecoveryEnabled, "Recovery not enabled");
        require(recoveryAddress != address(0), "No recovery address set");
        require(_newOwner != address(0), "Invalid new owner address");

        // Verify signature matches the recovery address
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(_messageHash);
        address recovered = ECDSA.recover(ethSignedHash, _signature);
        require(recovered == recoveryAddress, "Invalid signature");

        address oldOwner = owner();
        _transferOwnership(_newOwner);

        // Optional: disable recovery after use to prevent future unauthorized recoveries
        // isRecoveryEnabled = false;
        // recoveryAddress = address(0);

        emit OwnerRecovered(oldOwner, _newOwner);
    }

    /**
     * @dev Owner can disable the recovery mechanism.
     */
    function disableRecovery() external onlyOwner nonReentrant {
        require(isRecoveryEnabled, "Recovery already disabled");
        isRecoveryEnabled = false;
        recoveryAddress = address(0);
        emit RecoveryDisabled();
    }

    /**
     * @dev Owner can remove the recovery address without disabling the mechanism.
     */
    function removeRecoveryAddress() external onlyOwner nonReentrant {
        require(recoveryAddress != address(0), "No recovery address set");
        address oldRecovery = recoveryAddress;
        recoveryAddress = address(0);
        emit RecoveryAddressSet(oldRecovery, address(0));
    }
}
