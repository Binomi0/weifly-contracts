// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@thirdweb-dev/contracts/base/Staking20Base.sol";

contract StakingAirline is Staking20Base {
    /// @dev Protect against multiple calls
    uint256 private constant minRewardWithDraw = 1e20;

    constructor(
        uint80 _timeUnit,
        address _defaultAdmin,
        uint256 _rewardRatioNumerator,
        uint256 _rewardRatioDenominator,
        address _stakingToken,
        address _rewardToken,
        address _nativeTokenWrapper
    )
        Staking20Base(
            _timeUnit,
            _defaultAdmin,
            _rewardRatioNumerator,
            _rewardRatioDenominator,
            _stakingToken,
            _rewardToken,
            _nativeTokenWrapper
        )
    {}

    event LogRewards(uint256 rewards);

    /**
     *  @dev    Mint ERC20 rewards to the staker. Override for custom logic.
     *
     *  @param _staker    Address for which to calculated rewards.
     *  @param _rewards   Amount of tokens to be given out as reward.
     *
     */
    function _mintRewards(
        address _staker,
        uint256 _rewards
    ) internal virtual override {
        require(_rewards >= minRewardWithDraw, "Min reward withdraw is 100");
        super._mintRewards(_staker, _rewards);
    }

    function _depositRewardTokens(uint256 _amount) internal virtual override {
        super._depositRewardTokens(_amount);
    }

    /**
     *  @notice    Stake ERC20 Tokens.
     *
     *  @dev       See {_stake}. Override that to implement custom logic.
     *
     *  @param _amount    Amount to stake.
     */
    function _stake(uint256 _amount) internal virtual override {
        require(_amount >= 1e18, "Min stake amount is 1");

        super._stake(_amount);
    }

    /**
     *  @notice    Withdraw staked ERC20 tokens.
     *
     *  @dev       See {_withdraw}. Override that to implement custom logic.
     *
     *  @param _amount    Amount to withdraw.
     */
    function _withdraw(uint256 _amount) internal virtual override {
        super._withdraw(_amount);
    }

    /**
     *  @notice    Claim accumulated rewards.
     *
     *  @dev       See {_claimRewards}. Override that to implement custom logic.
     *             See {_calculateRewards} for reward-calculation logic.
     */
    function _claimRewards() internal virtual override {
        uint256 _rewardTokenBalance = this.getRewardTokenBalance();
        require(_rewardTokenBalance >= minRewardWithDraw, "Not enough tokens");

        super._claimRewards();
    }
}
