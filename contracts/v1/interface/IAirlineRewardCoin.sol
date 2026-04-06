// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @title IAirlineRewardCoin
/// @notice Minimal interface for AirlineRewardCoin (gas token) interactions
interface IAirlineRewardCoin {
    function balanceOf(address account) external view returns (uint256);
    function burn(uint256 amount) external;
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);
}
