// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IRecoverable {
    function addAdmin(
        bytes32 _newAdminSigned,
        bytes memory _signature,
        address _newAdmin
    ) external;

    function setNewOwner(
        bytes32 _newOwnerSigned,
        bytes memory _signature,
        address _newOwner
    ) external;

    event AddAdmin(address newAdmin);
    event SetNewOwner(address newOwner);
}
