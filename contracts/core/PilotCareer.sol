// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract PilotCareer {
  mapping(address => uint256) flightTime;
  mapping(address => uint256) licenseLevel;
  address private admin;

  event AddedFlightHours(address pilot, uint256 newFlightTime);

  // ---------- Modifiers ----------
  modifier onlyAdmin() {
      require(msg.sender == admin, "Not an admin");
      _;
  }

  constructor ()  {
    admin = msg.sender;
  }

  function initPilot (address pilot) external onlyAdmin {
    flightTime[pilot] = 0;
    licenseLevel[pilot] = 0;
  }

  function addHours(uint256 newFlightTime) external  onlyAdmin {
    require(newFlightTime > 15*1000, "Flight too short");
    require(newFlightTime < 24*60*60*1000, "Flight too long");


    uint256 current = flightTime[msg.sender];
    flightTime[msg.sender] = current + newFlightTime;

    emit AddedFlightHours(msg.sender, newFlightTime);
  }

  function getTotalFlightTime(address pilot) external view returns (uint256) {
    return flightTime[pilot];
  }


}
