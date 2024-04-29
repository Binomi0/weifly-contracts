// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

interface IRecoverable {
    function addAdmin(
        bytes32 _newAdminSigned,
        bytes memory _signature,
        address _newAdmin
    ) external;

    function resetOwner(
        bytes32 _newOwnerSigned,
        bytes memory _signature,
        address _newOwner
    ) external;

    event AddAdmin(address newAdmin);
    event ResetOwner(address newOwner);
}
