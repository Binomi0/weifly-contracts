// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.12;

import "./Account.sol";
import "./RecoverableAccount.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

contract AccountFactory {
    function createAccount(address _owner) external returns (address) {
        bytes32 salt = bytes32(uint256(uint160(_owner)));
        bytes memory bytecode = abi.encodePacked(
            type(Account).creationCode,
            abi.encode(_owner)
        );

        address addr = Create2.computeAddress(salt, keccak256(bytecode));

        if (addr.code.length > 0) {
            return addr;
        }

        return Create2.deploy(0, salt, bytecode);
    }

    function createRecoverableAccount(
        address _owner
    ) external returns (address) {
        bytes32 salt = bytes32(uint256(uint160(_owner)));
        bytes memory bytecode = abi.encodePacked(
            type(RecoverableAccount).creationCode,
            abi.encode(_owner)
        );

        address addr = Create2.computeAddress(salt, keccak256(bytecode));

        if (addr.code.length > 0) {
            return addr;
        }

        return Create2.deploy(0, salt, bytecode);
    }
}