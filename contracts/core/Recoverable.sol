// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IRecoverable.sol";

contract Recoverable is IRecoverable, ReentrancyGuard {
    address[2] public admins = [address(0), address(0)];
    uint256 public locked = 1;

    // ✅ Events para monitoring y auditoría externa
    event AdminAdded(address indexed oldAdmin, address indexed newAdmin);
    event OwnerRestored(address indexed newOwner);
    event AdminRemoved(address indexed oldAdmin, address indexed newAdmin);
    event StatusChanged(bytes32 indexed newStatus, uint8 _locked);

    constructor(address _owner) {
        admins[0] = _owner;
    }

    /**
     * Current admin can add an address to be the recovery account address
     *
     * @param _recoverSigned arrayify(id(address))
     * @param _signature signMessage(arrayify(id(address)))
     * @param _recover address
     */
    function addAdmin(
        bytes32 _recoverSigned,
        bytes memory _signature,
        address _recover
    ) public nonReentrant {
        address recovered = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(_recoverSigned),
            _signature
        );

        require(admins[0] == recovered, "Only owner account can call this");
        emit AdminRemoved(admins[1], admins[1]); // ✅ Evento para auditoría
        admins[1] = _recover;
        locked = 0;
    }

    /**
     * Current recovery address can restore owner
     *
     * @param _newOwnerSigned arrayify(id(address))
     * @param _signature signMessage(arrayify(id(address)))
     * @param _newOwner address
     */
    function setNewOwner(
        bytes32 _newOwnerSigned,
        bytes memory _signature,
        address _newOwner
    ) public nonReentrant {
        address recovered = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(_newOwnerSigned),
            _signature
        );

        require(admins[1] == recovered, "Only recover account can call this");
        emit OwnerRestored(_newOwner); // ✅ Evento para auditoría
        admins[0] = _newOwner;
    }

    function changeLock(
        bytes32 _newStatus,
        bytes memory _signature,
        uint8 _locked
    ) public nonReentrant {
        address recovered = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(_newStatus),
            _signature
        );

        require(admins[0] == recovered, "Only recover account can call this");
        require(_locked != locked, "Trying to set the same value");

        locked = uint8(_locked);
        emit StatusChanged(_newStatus, _locked); // ✅ Evento mejorado
    }
}
