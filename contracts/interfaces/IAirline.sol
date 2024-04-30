// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

interface IAirline {
    function joinAirline(address _pilot, uint8 _level) external;

    function closeAirline(bytes memory signature, bytes32 senderHash) external;

    function openAirline(bytes memory signature, bytes32 senderHash) external;
}
