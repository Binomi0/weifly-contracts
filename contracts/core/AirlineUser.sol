// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "./Airline.sol";

contract AirlineUser {
    uint256 public flightTime = 0;
    address public airlineAddr;

    modifier notInAirlne() {
        require(
            airlineAddr == address(0),
            "Pilots only can be in one Airline at the same time"
        );
        _;
    }

    constructor() {}

    function connectToAirline(
        address payable _airline,
        address _pilot,
        uint8 _level
    ) external notInAirlne {
        Airline airline = Airline(_airline);
        require(airline.isOpen(), "Airline is closed at this time");

        airline.joinAirline(_pilot, _level);
        airlineAddr = _airline;
    }
}
