// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IAirlinePilot {
    event PilotRegistered(address indexed pilot, uint256 flightHours);
    event LicenseGranted(address indexed pilot, uint256 token, uint256 licenseLevel);
    event FlightRecorded(address indexed pilot, uint256 flightHours);
    event RequestCreated(address indexed pilot, address indexed airline, uint256 requestId);
    event RequestApproved(uint256 indexed requestId, address indexed reviewer);

    function registerPilot(address pilot, uint256 flightHours, address airline) external;
    function requestAirlineAccess(address pilot, address airline) external;
    function approveRequest(uint256 requestId) external;
    function mintLicense(address pilot, uint8 licenseLevel, string memory tokenName, string memory tokenSymbol) external;
    function recordFlight(address pilot, uint256 flightHours) external;

    function canAccessAirline(address pilot, address airline) external view returns (bool);
    function getPendingRequest(address pilot, address airline) external view returns (bool);

    function getNextLicenseId() external view returns (uint256);
    function getTotalLicensesIssued() external view returns (uint256);
}
