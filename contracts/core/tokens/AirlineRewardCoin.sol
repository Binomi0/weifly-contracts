// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@thirdweb-dev/contracts/base/ERC20Base.sol';

contract AirlineRewardCoin is ERC20Base {
  constructor(
    address _defaultAdmin,
    string memory _name,
    string memory _symbol
  ) ERC20Base(_defaultAdmin, _name, _symbol) {
    // 1 thousand millions + 18 decimals
    mintTo(address(msg.sender), 1_000_000_000_000_000_000_000_000_000);
  }
}
