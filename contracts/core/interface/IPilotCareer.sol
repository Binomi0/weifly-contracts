// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IPilotCareer {
    function getTotalFlightTime(address _pilot) external view returns (uint256);
}
