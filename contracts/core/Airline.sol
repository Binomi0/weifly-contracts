// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interface/IAirline.sol";

/**
 * @title Airline
 * @dev Manages airline enrollment and status control for WeiFly pilots.
 *      Securely handles pilot registration, level management, and status changes.
 */
abstract contract Airline is IAirline, Ownable {
    bool public isOpen = true;
    uint256 public totalPilotsCount;
    mapping(address => uint8) public pilots;
    uint8 public constant MAX_PILOT_LEVEL = 4;

    event NewAirlineMember(address indexed _pilot, uint8 _level);
    event ExitAirlineMember(address indexed _pilot);
    event AirlineStatusChanged(bool isOpen);
    event PilotLevelUpdated(address indexed pilot, uint8 oldLevel, uint8 newLevel);

    constructor() Ownable(msg.sender) {}

    function joinAirline(uint8 _level) external {
        require(isOpen, "Airline is closed");
        require(_level > 0 && _level <= MAX_PILOT_LEVEL, "Invalid level");
        require(pilots[msg.sender] == 0, "Already enrolled");

        pilots[msg.sender] = _level;
        totalPilotsCount++;

        emit NewAirlineMember(msg.sender, _level);
    }

    function leaveAirline() external {
        require(pilots[msg.sender] > 0, "Not enrolled");
        require(totalPilotsCount > 0, "Invariant broken");

        delete pilots[msg.sender];
        totalPilotsCount--;

        emit ExitAirlineMember(msg.sender);
    }

    function closeAirline() external onlyOwner {
        require(isOpen, "Airline is already closed");
        isOpen = false;
        emit AirlineStatusChanged(false);
    }

    function openAirline() external onlyOwner {
        require(!isOpen, "Airline is already open");
        isOpen = true;
        emit AirlineStatusChanged(true);
    }

    function totalPilots() public view returns (uint256) {
        return totalPilotsCount;
    }

    function getPilotLevel(address _pilot) public view returns (uint8) {
        return pilots[_pilot];
    }

    /**
     * @dev Updates a pilot's license level. Can only increase levels.
     * @param _pilot Address of the pilot to update
     * @param _newLevel New license level (must be greater than current)
     */
    function updatePilotLevel(address _pilot, uint8 _newLevel) external onlyOwner {
        require(_pilot != address(0), "Invalid address");
        uint8 current = pilots[_pilot];
        require(current > 0, "Not a pilot");
        require(_newLevel > current && _newLevel <= MAX_PILOT_LEVEL, "Invalid level upgrade");
        pilots[_pilot] = _newLevel;
        emit PilotLevelUpdated(_pilot, current, _newLevel);
    }
}
