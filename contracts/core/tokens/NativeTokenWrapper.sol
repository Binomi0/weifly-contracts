// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";

contract NativeTokenWrapper is ERC20Base {
    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol
    ) ERC20Base(_defaultAdmin, _name, _symbol) {}
}
