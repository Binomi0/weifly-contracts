// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../core/AirlineUser.sol";

contract BaseAccount is IAccount, AirlineUser {
    uint256 public count;
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function validateUserOp(
        UserOperation memory userOp,
        bytes32 userOpHash,
        uint256
    ) external view returns (uint256 validationData) {
        address recovered = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(userOpHash),
            userOp.signature
        );

        return owner == recovered ? 0 : 1;
    }

    function execute() external {
        count++;
    }
}
