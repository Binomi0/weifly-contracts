// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PilotCareer
 * @dev Manages the career progression of WeiFly pilots.
 * Stores flight hours, licenses, ratings, and achievements to offload the main NFT contract.
 */
contract PilotCareer is AccessControl, ReentrancyGuard {
    bytes32 public constant PILOT_CONTROLLER_ROLE = keccak256("PILOT_CONTROLLER_ROLE");

    struct License {
        string identifier;
        uint256 issueDate;
        uint256 expiryDate;
        bool isActive;
    }

    struct CareerStats {
        uint256 totalFlightHours;
        uint256 totalFlightsCount;
        uint256 lastFlightAt;
        uint8 level; // 1 to 4
        address currentAirline;
        bool isRegistered;
    }

    mapping(address => CareerStats) public pilots;
    mapping(address => mapping(string => License)) public licenses;
    mapping(address => string[]) private pilotLicenseNames;

    // Rank thresholds (in hours)
    uint256 public constant LEVEL_2_HOURS = 100;
    uint256 public constant LEVEL_3_HOURS = 500;
    uint256 public constant LEVEL_4_HOURS = 1000;

    event CareerInitiated(address indexed pilot, address indexed airline);
    event FlightRecorded(address indexed pilot, uint256 hoursAdded, uint256 newTotal);
    event LicenseIssued(address indexed pilot, string licenseId, uint256 expiry);
    event LevelUpgraded(address indexed pilot, uint8 newLevel);

    constructor(address defaultAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
    }

    /**
     * @dev Initializes a pilot's career.
     */
    function initPilot(address _pilot, address _airline) external onlyRole(PILOT_CONTROLLER_ROLE) {
        require(!pilots[_pilot].isRegistered, "Pilot already registered");
        
        pilots[_pilot].isRegistered = true;
        pilots[_pilot].currentAirline = _airline;
        pilots[_pilot].level = 1;
        
        emit CareerInitiated(_pilot, _airline);
    }

    /**
     * @dev Records a new flight and updates hours.
     */
    function recordFlight(address _pilot, uint256 _hours) external onlyRole(PILOT_CONTROLLER_ROLE) {
        require(pilots[_pilot].isRegistered, "Pilot not registered");
        require(_hours > 0, "Hours must be positive");

        CareerStats storage career = pilots[_pilot];
        career.totalFlightHours += _hours;
        career.totalFlightsCount += 1;
        career.lastFlightAt = block.timestamp;

        emit FlightRecorded(_pilot, _hours, career.totalFlightHours);
        
        _checkLevelUpgrade(_pilot);
    }

    /**
     * @dev Grants a new license or updates it.
     */
    function grantLicense(
        address _pilot,
        string memory _id,
        uint256 _validityDays
    ) external onlyRole(PILOT_CONTROLLER_ROLE) {
        require(pilots[_pilot].isRegistered, "Pilot not registered");

        License storage lic = licenses[_pilot][_id];
        if (lic.issueDate == 0) {
            pilotLicenseNames[_pilot].push(_id);
        }

        uint256 expiry = _validityDays == 0 ? 0 : block.timestamp + (_validityDays * 1 days);
        
        lic.identifier = _id;
        lic.issueDate = block.timestamp;
        lic.expiryDate = expiry;
        lic.isActive = true;

        emit LicenseIssued(_pilot, _id, expiry);
    }

    /**
     * @dev Internal function to handle level upgrades based on hours.
     */
    function _checkLevelUpgrade(address _pilot) internal {
        CareerStats storage career = pilots[_pilot];
        uint8 newLevel = career.level;

        if (career.totalFlightHours >= LEVEL_4_HOURS) {
            newLevel = 4;
        } else if (career.totalFlightHours >= LEVEL_3_HOURS) {
            newLevel = 3;
        } else if (career.totalFlightHours >= LEVEL_2_HOURS) {
            newLevel = 2;
        }

        if (newLevel > career.level) {
            career.level = newLevel;
            emit LevelUpgraded(_pilot, newLevel);
        }
    }

    /**
     * @dev External view for rank level.
     */
    function getPilotLevel(address _pilot) external view returns (uint8) {
        return pilots[_pilot].level;
    }

    /**
     * @dev Simple check if pilot is registered.
     */
    function isPilotRegistered(address _pilot) external view returns (bool) {
        return pilots[_pilot].isRegistered;
    }

    /**
     * @dev Get total flight time. Same as mapping call but explicit.
     */
    function getTotalFlightTime(address _pilot) external view returns (uint256) {
        return pilots[_pilot].totalFlightHours;
    }
}
