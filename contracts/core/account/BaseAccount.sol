// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/interfaces/IAccount.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../AirlineUser.sol";

contract BaseAccount is IAccount, AirlineUser, Ownable {
    uint256 public count;

    constructor(address _owner) Ownable(_owner) {
        count = 0;
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

        return owner() == recovered ? 0 : 1;
    }

    function execute() external {
        count++;
    }
}
