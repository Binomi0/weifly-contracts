// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@thirdweb-dev/contracts/extension/interface/IStaking20.sol";

/**
 * @title IStakingAirline
 * @notice Custom interface for StakingAirline with pilot-specific events and constants exposure.
 */
interface IStakingAirline is IStaking20 {
    /**
     * @dev Emitted when a pilot stakes tokens.
     * @param pilot Address of the pilot who staked.
     * @param amount Amount of tokens staked.
     */
    event NewPilotStake(address indexed pilot, uint256 amount);

    /**
     * @dev Emitted when a pilot withdraws tokens.
     * @param pilot Address of the pilot who withdrew.
     * @param amount Amount of tokens withdrawn.
     */
    event NewPilotWithdraw(address indexed pilot, uint256 amount);

    /**
     * @notice Get the minimum staking amount.
     * @return The minimum amount of tokens a pilot can stake.
     */
    function getMinStakeAmount() external view returns (uint256);

    /**
     * @notice Get the minimum reward claim amount.
     * @return The minimum amount of rewards a pilot must have to claim.
     */
    function getMinRewardClaim() external view returns (uint256);

    /**
     * @notice Get the maximum staking amount.
     * @return The maximum amount of tokens a pilot can stake.
     */
    function getMaxStakeAmount() external view returns (uint256);
}
