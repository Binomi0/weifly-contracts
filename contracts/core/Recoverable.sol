// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/IRecoverable.sol";

contract Recoverable is IRecoverable {
    address[2] public admins = [address(0), address(0)];
    uint256 internal locked = 1;

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
    ) public {
        address recovered = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(_recoverSigned),
            _signature
        );

        require(admins[0] == recovered, "Only owner account can call this");
        admins[1] = _recover;
        unLock();
    }

    /**
     * Current recovery address can restore owner
     *
     * @param _newOwnerSigned arrayify(id(address))
     * @param _signature signMessage(arrayify(id(address)))
     * @param _newOwner address
     */
    function resetOwner(
        bytes32 _newOwnerSigned,
        bytes memory _signature,
        address _newOwner
    ) public {
        address recovered = ECDSA.recover(
            MessageHashUtils.toEthSignedMessageHash(_newOwnerSigned),
            _signature
        );

        require(admins[1] == recovered, "Only recover account can call this");
        admins[0] = _newOwner;
    }

    function lock() internal {
        locked = 1;
    }

    function unLock() internal {
        locked = 0;
    }
}
