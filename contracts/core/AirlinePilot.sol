// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Airline.sol"; // Import roles principales
import "./PilotCareer.sol"; // Import roles principales

contract AirlinePilot is ERC721, AccessControl {

    // ---------- Roles ----------
    bytes32 public constant AIRLINE_ADMIN_ROLE = keccak256("AIRLINE_ADMIN_ROLE");
    bytes32 public constant AIRLINE_MANAGER_ROLE = keccak256("AIRLINE_MANAGER_ROLE");

    // ---------- Flight Hours ----------
    uint256 private constant LICENSE_HOURS_1 = 1;
    uint256 private constant LICENSE_HOURS_2 = 100;
    uint256 private constant LICENSE_HOURS_3 = 500;
    uint256 private constant LICENSE_HOURS_4 = 1000;

    // ---------- Pilot Storage (5 slots) ----------
    PilotCareer career;
    struct Pilot {
        bool registered;
        address airline;
    }

    mapping(address => Pilot) private pilots;

    // ---------- License Storage (4 slots) ----------
    struct License {
        address pilot;
        uint256 flightHoursRequired;
        uint8 licenseLevel;
        string tokenName;
        string tokenSymbol;
    }

    mapping(uint256 => License) private licenses;

    // ---------- Request Queue (5 slots per request) ----------
    struct AirlineRequest {
        address pilot;
        address airline;
        address reviewer;
        bool approved;
        uint8 status; // 0=pending, 1=approved
        uint256 createdAt;
        uint8 approvalLevel;
    }

    mapping(uint256 => AirlineRequest) private requests;

    // Track active requests per pilot-airline pair
    mapping(address => mapping(address => uint256)) private activeRequestCounter;

    // ---------- Counters ----------
    uint256 private nextLicenseId;
    uint256 private nextRequestId;

    // ---------- Events (1 per action) ----------
    event PilotRegistered(address indexed pilot, uint256 flightHours);
    event LicenseGranted(address indexed pilot, uint256 token, uint256 licenseLevel);
    event FlightRecorded(address indexed pilot, uint256 flightHours);
    event RequestCreated(address indexed pilot, address indexed airline, uint256 requestId);
    event RequestApproved(address indexed requestId, address indexed reviewer);

    // ---------- Constructor ----------
    constructor() ERC721("WeiFly License", "LSC") {
        nextLicenseId = 1;
        nextRequestId = 1;
    }

    // ---------- Modifiers ----------
    modifier onlyAirlineAdmin() {
        require(hasRole(AIRLINE_ADMIN_ROLE, msg.sender), "Not admin");
        _;
    }

    modifier onlyAirlineManager() {
        require(hasRole(AIRLINE_MANAGER_ROLE, msg.sender), "Not manager");
        _;
    }

    modifier onlyPilot() {
        require(pilots[msg.sender].registered, "Not a pilot");
        _;
    }

    /**
    * @dev See {IERC165-supportsInterface}.
    */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    // ---------- Core Functions ----------

    /**
     * @dev Registrar un piloto
     */
    function registerPilot(address pilot, uint256 flightHours, address airline) external onlyPilot {
        // require(flightHours <= 10000, "Hours too high");
        require(flightHours > 0, "Hours must be positive");
        require(pilots[pilot].registered == false, "Already registered");
        require(flightHours >= LICENSE_HOURS_1, "Insufficient flight hours for registration");

        pilots[pilot].registered = true;
        pilots[pilot].airline = airline;
        career = PilotCareer(pilot);

        emit PilotRegistered(pilot, flightHours);
    }

    /**
     * @dev Solicitar acceso a una aerolínea
     */
    function requestAirlineAccess(address pilot, address airline) external onlyPilot {
        require(pilots[pilot].registered, "Pilot not registered");
        require(pilots[pilot].airline == address(0), "Already applied to this airline");
        require(activeRequestCounter[pilot][airline] == 0, "Request already exists");

        uint256 requestId = nextRequestId++;
        AirlineRequest storage req = requests[requestId];
        req.pilot = pilot;
        req.airline = airline;
        req.approved = false;
        req.status = 0;
        req.reviewer = address(0);
        req.createdAt = block.timestamp;
        req.approvalLevel = 1;

        activeRequestCounter[pilot][airline] = requestId;

        emit RequestCreated(pilot, airline, requestId);
    }

    /**
     * @dev Aceptar solicitud de piloto
     */
    function approveRequest(uint256 requestId) external onlyAirlineManager {
        require(requestId > 0, "Invalid request ID");
        require(requests[requestId].status == 0, "Request not pending");
        require(requests[requestId].airline != address(0), "Invalid request");

        AirlineRequest storage req = requests[requestId];
        require(req.pilot != address(0), "Invalid request");
        require(req.approved == false, "Request already approved");
        require(activeRequestCounter[req.pilot][req.airline] == requestId, "Request not active");

        requests[requestId].status = 1;
        requests[requestId].reviewedBy = msg.sender;
        requests[requestId].approved = true;
        requests[requestId].approvalLevel = 1;

        activeRequestCounter[req.pilot][req.airline] = 0; // Remove from active

        emit RequestApproved(requestId, msg.sender);
    }

    /**
     * @dev Emitir NFT de licencia
     */
    function mintLicense(address pilot, uint8 licenseLevel, string memory tokenName, string memory tokenSymbol) external onlyAirlineAdmin {
        require(pilots[pilot].registered, "Pilot not registered");
        require(licenseLevel >= 1 && licenseLevel <= 4, "Invalid license level");
        require(pilots[pilot].totalFlightHours >= LICENSE_HOURS_4, "Insufficient flight hours");

        uint256 token = _safeMint(pilot, nextLicenseId);
        _grantRole(DEFAULT_ADMIN_ROLE, pilot);

        License storage lic = licenses[nextLicenseId];
        lic.pilot = pilot;
        lic.licenseLevel = licenseLevel;
        lic.tokenName = tokenName;
        lic.tokenSymbol = tokenSymbol;
        lic.flightHoursRequired = LICENSE_HOURS_4;

        emit LicenseGranted(pilot, token, licenseLevel);
        nextLicenseId++;
    }

    /**
     * @dev Registrar vuelo
     */
    function recordFlight(address pilot, uint256 flightHours) external onlyAirlineAdmin {
        require(flightHours > 0, "Flight hours must be positive");
        require(flightHours <= 10000, "Hours too high");
        require(pilots[pilot].registered, "Pilot not registered");

        pilots[pilot].totalFlightHours = pilots[pilot].totalFlightHours + flightHours;

        emit FlightRecorded(pilot, flightHours);
    }

    // ---------- Utility Functions ----------

    /**
     * @dev Verificar si un piloto puede acceder a una aerolínea
     */
    function canAccessAirline(address pilot, address airline) external view returns (bool) {
        require(pilots[pilot].registered, "Pilot not registered");
        require(pilots[pilot].airline == airline, "Not applied to this airline");

        return true;
    }

    /**
     * @dev Obtener información de solicitud pendiente
     */
    function getPendingRequest(address pilot, address airline) external view returns (bool) {
        return activeRequestCounter[pilot][airline] != 0;
    }

    // ---------- Storage Getters ----------

    function getNextLicenseId() external view returns (uint256) {
        return nextLicenseId;
    }

    function getTotalLicensesIssued() external view returns (uint256) {
        return nextLicenseId;
    }
}
