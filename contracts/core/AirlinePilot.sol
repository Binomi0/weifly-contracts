// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./PilotCareer.sol";
import "./interface/IAirlinePilot.sol";

/**
 * @title AirlinePilot
 * @dev The main NFT contract for WeiFly pilots.
 * Implements IAirlinePilot but delegates career tracking to PilotCareer.
 */
contract AirlinePilot is ERC721, AccessControl, IAirlinePilot {
    bytes32 public constant AIRLINE_ADMIN_ROLE = keccak256("AIRLINE_ADMIN_ROLE");
    bytes32 public constant AIRLINE_MANAGER_ROLE = keccak256("AIRLINE_MANAGER_ROLE");

    PilotCareer public career;
    uint256 private nextLicenseId;
    uint256 private nextRequestId;

    struct AirlineRequest {
        address pilot;
        address airline;
        bool approved;
        uint256 createdAt;
    }

    mapping(uint256 => AirlineRequest) private requests;
    mapping(address => mapping(address => uint256)) private activeRequestCounter;

    constructor(address _careerAddress) ERC721("WeiFly License", "LSC") {
        require(_careerAddress != address(0), "Invalid career address");
        career = PilotCareer(_careerAddress);
        nextLicenseId = 1;
        nextRequestId = 1;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // ---------- IAirlinePilot Implementation ----------

    /**
     * @dev Register a pilot in the career system.
     */
    function registerPilot(address pilot, uint256 flightHours, address airline) external override onlyRole(AIRLINE_ADMIN_ROLE) {
        career.initPilot(pilot, airline);
        if (flightHours > 0) {
            career.recordFlight(pilot, flightHours);
        }
        emit PilotRegistered(pilot, flightHours);
    }

    /**
     * @dev Request access to an airline.
     */
    function requestAirlineAccess(address pilot, address airline) external override {
        (, , , , , bool isRegistered) = career.pilots(pilot);
        require(isRegistered, "Pilot not registered");
        require(activeRequestCounter[pilot][airline] == 0, "Request already exists");

        uint256 requestId = nextRequestId++;
        requests[requestId] = AirlineRequest({
            pilot: pilot,
            airline: airline,
            approved: false,
            createdAt: block.timestamp
        });

        activeRequestCounter[pilot][airline] = requestId;
        emit RequestCreated(pilot, airline, requestId);
    }

    /**
     * @dev Approve an airline access request.
     */
    function approveRequest(uint256 requestId) external override onlyRole(AIRLINE_MANAGER_ROLE) {
        AirlineRequest storage req = requests[requestId];
        require(req.pilot != address(0), "Invalid request");
        require(!req.approved, "Already approved");

        req.approved = true;
        activeRequestCounter[req.pilot][req.airline] = 0;

        emit RequestApproved(requestId, msg.sender);
    }

    /**
     * @dev Mint a license NFT.
     */
    function mintLicense(
        address pilot, 
        uint8 licenseLevel, 
        string memory /*tokenName*/, 
        string memory /*tokenSymbol*/
    ) external override onlyRole(AIRLINE_ADMIN_ROLE) {
        (, , , , , bool isRegistered) = career.pilots(pilot);
        require(isRegistered, "Pilot not registered");
        require(career.getPilotLevel(pilot) >= licenseLevel, "Insufficient career level");

        uint256 token = nextLicenseId++;
        _safeMint(pilot, token);

        emit LicenseGranted(pilot, token, licenseLevel);
    }

    /**
     * @dev Record a flight in the career system.
     */
    function recordFlight(address pilot, uint256 flightHours) external override onlyRole(AIRLINE_ADMIN_ROLE) {
        career.recordFlight(pilot, flightHours);
        emit FlightRecorded(pilot, flightHours);
    }

    // ---------- View Functions ----------

    function canAccessAirline(address pilot, address airline) external view override returns (bool) {
        (, , , , address currentAirline, bool isRegistered) = career.pilots(pilot);
        return isRegistered && currentAirline == airline;
    }

    function getPendingRequest(address pilot, address airline) external view override returns (bool) {
        return activeRequestCounter[pilot][airline] != 0;
    }

    function getNextLicenseId() external view override returns (uint256) {
        return nextLicenseId;
    }

    function getTotalLicensesIssued() external view override returns (uint256) {
        return nextLicenseId - 1;
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return interfaceId == type(IAirlinePilot).interfaceId || super.supportsInterface(interfaceId);
    }
}
