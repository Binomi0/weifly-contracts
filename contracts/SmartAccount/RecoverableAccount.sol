// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../core/Recoverable.sol";
import "hardhat/console.sol";

contract RecoverableAccount is IAccount, Recoverable {
    uint256 public count;

    constructor(address _owner) Recoverable(_owner) {}

    function validateUserOp(
        UserOperation memory userOp,
        bytes32 userOpHash,
        uint256
    ) external view returns (uint256 validationData) {
        address recovered = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(userOpHash),
            userOp.signature
        );

        if (locked == 1) {
            return admins[0] == recovered ? 0 : 1;
        }

        address _recover = admins[1];
        require(_recover != address(0), "Recover account must be set");

        return admins[0] == recovered ? 0 : _recover == recovered ? 0 : 1;
    }

    function execute() external {
        count++;
    }
}
