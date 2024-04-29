// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "@thirdweb-dev/contracts/base/Staking20Base.sol";

contract WeiflyStaking is Staking20Base {
    /// @dev Total amount of reward tokens in the contract.
    uint256 private rewardTokenBalance;

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

    /*//////////////////////////////////////////////////////////////
                        Minting logic
    //////////////////////////////////////////////////////////////*/

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
        require(_rewards <= rewardTokenBalance, "Not enough reward tokens");
        rewardTokenBalance -= _rewards;
        CurrencyTransferLib.transferCurrencyWithWrapper(
            rewardToken,
            address(this),
            _staker,
            _rewards,
            nativeTokenWrapper
        );
    }
}
