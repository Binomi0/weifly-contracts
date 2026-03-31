// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@thirdweb-dev/contracts/base/Staking20Base.sol";

contract StakingAirline is Staking20Base {
    uint256 private constant MIN_STAKE_AMOUNT = 1e18;
    uint256 private constant MIN_REWARD_CLAIM = 100e18; // 1 token mínimo para claim
    uint256 private constant MAX_STAKE_AMOUNT = 1_000_000e18; // 1M tokens máximo

    event NewPilotStake(address indexed pilot, uint256 amount);
    event NewPilotWithdraw(address indexed pilot, uint256 amount);
    event RewardsClaimed(address indexed pilot, uint256 amount);

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
    {
        require(_rewardRatioNumerator > 0, "Invalid ratio numerator");
        require(_rewardRatioDenominator > 0, "Invalid ratio denominator");
        require(_timeUnit > 0, "Invalid time unit");
    }

    function _mintRewards(address _staker, uint256 _rewards) internal virtual override {
        // No mintear rewards muy pequeñas para evitar spam de eventos
        if (_rewards < MIN_REWARD_CLAIM) {
            return;
        }
        super._mintRewards(_staker, _rewards);
        emit RewardsClaimed(_staker, _rewards);
    }

    function _stake(uint256 _amount) internal virtual override {
        require(_amount >= MIN_STAKE_AMOUNT, "Stake amount below minimum");
        require(_amount <= MAX_STAKE_AMOUNT, "Stake amount exceeds maximum");
        super._stake(_amount);
        emit NewPilotStake(msg.sender, _amount);
    }

    function _withdraw(uint256 _amount) internal virtual override {
        super._withdraw(_amount);
        emit NewPilotWithdraw(msg.sender, _amount);
    }

    function _claimRewards() internal virtual override {
        uint256 rewards = _calculateRewards(msg.sender);
        require(rewards >= MIN_REWARD_CLAIM, "Rewards below minimum claim amount");

        super._claimRewards();
    }
}
