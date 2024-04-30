// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "../interfaces/IAirline.sol";

contract Airline is IAirline {
    address public owner;
    bool public isOpen = true;
    mapping(address => uint8) public pilots;

    constructor(address _owner) {
        owner = _owner;
    }

    function joinAirline(address _pilot, uint8 _level) public {
        require(isOpen == true, "Airline is closed");
        pilots[_pilot] = _level;
    }

    /**
     *
     * @param signature owner signed address
     * @param senderHash sender address hash
     */
    function closeAirline(bytes memory signature, bytes32 senderHash) external {
        address recovered = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(senderHash),
            signature
        );

        require(owner == recovered, "Only owner can close Airline");
        require(isOpen == true, "Airline is already closed");
        isOpen = false;
    }

    /**
     *
     * @param signature owner signed address
     * @param senderHash sender address hash
     */
    function openAirline(bytes memory signature, bytes32 senderHash) external {
        address recovered = ECDSA.recover(
            ECDSA.toEthSignedMessageHash(senderHash),
            signature
        );

        require(owner == recovered, "Only owner can close Airline");
        require(isOpen == false, "Airline is already open");
        isOpen = true;
    }
}
