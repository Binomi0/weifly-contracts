// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "../AirlineUser.sol";

contract BaseAccount is IAccount, AirlineUser {
    uint256 public count;
    address public owner;

    constructor(address _owner) {
        owner = _owner;
    }

    function validateUserOp(
        PackedUserOperation memory userOp,
        bytes32 userOpHash,
        uint256
    ) external view returns (uint256 validationData) {
        address recovered = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(userOpHash),
            userOp.signature
        );

        return owner == recovered ? 0 : 1;
    }

    function execute() external {
        count++;
    }
}
