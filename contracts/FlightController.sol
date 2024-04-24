// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.13;

import "./AirlineCoin.sol";
import "./AircraftNft.sol";

contract FlightController {
    uint256 public prize;
    address public adminAddress;
    address public aircraftAddress;
    AirlineCoin public airlineCoin;
    mapping(address => FlightDetails) public flightDetails;
    bool private _notEntered = true;

    struct FlightDetails {
        uint256 id; // flight id
        uint256 distance; // Distance covered by the flight
        uint256 aircraftId; // Unique identifier for the aircraft
        uint256 multiplier; // Multiplier for calculating rewards
        uint256 startTime;
    }

    modifier nonReentrant() {
        require(_notEntered, "ReentrancyGuard: reentrant call");
        _notEntered = false;
        _;
        _notEntered = true;
    }

    modifier onlyAdmin() {
        require(address(msg.sender) == adminAddress);
        _;
    }

    event FlightStarted(address pilot, uint flightId);
    event FlightCompleted(address pilot, uint flightId, uint256 amount);

    constructor(
        address _defaultAdmin,
        address _aircraftAddress,
        AirlineCoin _airlineCoin
    ) {
        adminAddress = _defaultAdmin;
        aircraftAddress = _aircraftAddress;
        airlineCoin = _airlineCoin;
    }

    function _calculateRewards(address _pilot) private view returns (uint256) {
        return
            (flightDetails[_pilot].distance / 10) *
            flightDetails[_pilot].multiplier;
    }

    function startFlight(
        uint _flightId,
        uint _distance,
        uint _aircraftId,
        uint _multiplier
    ) public nonReentrant {
        require(
            flightDetails[msg.sender].startTime == 0 ||
                block.timestamp >=
                flightDetails[msg.sender].startTime + 30 minutes,
            "Flight already in progress or minimum lock time not met"
        );

        ERC1155Drop erc1155Contract = ERC1155Drop(aircraftAddress);
        uint256 balance = erc1155Contract.balanceOf(msg.sender, _aircraftId);
        require(balance > 0, "Do not have required aircraft");

        flightDetails[msg.sender] = FlightDetails({
            id: _flightId,
            distance: _distance,
            aircraftId: _aircraftId,
            multiplier: _multiplier,
            startTime: block.timestamp
        });

        emit FlightStarted(msg.sender, _flightId);
    }

    function completeFlight(
        address _pilot,
        uint _flightId
    ) public onlyAdmin nonReentrant returns (uint256) {
        require(
            block.timestamp >= flightDetails[_pilot].startTime + 30 minutes,
            "Flight still in min locked time"
        );
        require(
            keccak256(abi.encodePacked(flightDetails[_pilot].id)) ==
                keccak256(abi.encodePacked(_flightId)),
            "This flight is not active."
        );

        uint256 _rewards = _calculateRewards(_pilot);

        flightDetails[_pilot] = FlightDetails({
            id: 0,
            distance: 0,
            aircraftId: 0,
            multiplier: 0,
            startTime: 0
        });

        emit FlightCompleted(_pilot, _flightId, _rewards);

        return _rewards;
    }
}
