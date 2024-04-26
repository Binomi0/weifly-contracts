// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@thirdweb-dev/contracts/base/Staking20Base.sol";
import "hardhat/console.sol";

contract StakingAirline is Staking20Base {
    uint256 private rewardTokenBalance;
    uint256 private minRewardWithDraw = 1e20;
    uint256 private minRewardBlock;

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
        minRewardBlock = block.number;
    }

    event LogRewards(uint256 rewards, uint256 minRewardWithDraw);

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
        // require(block.number > minRewardBlock);

        // rewardTokenBalance -= _rewards;
        // CurrencyTransferLib.transferCurrencyWithWrapper(
        //     rewardToken,
        //     address(this),
        //     _staker,
        //     _rewards,
        //     nativeTokenWrapper
        // );

        super._mintRewards(_staker, _rewards);
    }

    // function _depositRewardTokens(uint256 _amount) internal virtual override {
    //   require(msg.sender == owner(), 'Not authorized');

    //   address _rewardToken = rewardToken == CurrencyTransferLib.NATIVE_TOKEN ? nativeTokenWrapper : rewardToken;

    //   uint256 balanceBefore = IERC20(_rewardToken).balanceOf(address(this));
    //   CurrencyTransferLib.transferCurrencyWithWrapper(
    //     rewardToken,
    //     msg.sender,
    //     address(this),
    //     _amount,
    //     nativeTokenWrapper
    //   );
    //   uint256 actualAmount = IERC20(_rewardToken).balanceOf(address(this)) - balanceBefore;

    //   rewardTokenBalance += actualAmount;
    // }

    // function _withdrawRewardTokens(uint256 _amount) internal virtual override {
    //   require(msg.sender == owner(), 'Not authorized');

    //   // to prevent locking of direct-transferred tokens
    //   rewardTokenBalance = _amount > rewardTokenBalance ? 0 : rewardTokenBalance - _amount;

    //   CurrencyTransferLib.transferCurrencyWithWrapper(
    //     rewardToken,
    //     address(this),
    //     msg.sender,
    //     _amount,
    //     nativeTokenWrapper
    //   );

    //   // The withdrawal shouldn't reduce staking token balance. `>=` accounts for any accidental transfers.
    //   address _stakingToken = stakingToken == CurrencyTransferLib.NATIVE_TOKEN ? nativeTokenWrapper : stakingToken;
    //   require(IERC20(_stakingToken).balanceOf(address(this)) >= stakingTokenBalance, 'Staking token balance reduced.');
    // }

    /**
     *  @notice    Stake ERC20 Tokens.
     *
     *  @dev       See {_stake}. Override that to implement custom logic.
     *
     *  @param _amount    Amount to stake.
     */
    //   function stake(uint256 _amount) external  virtual payable override nonReentrant {
    //     require(block.number > minRewardBlock);
    //     require(_amount > 1e18);

    //     minRewardBlock = block.number;
    //     _stake(_amount);
    //   }

    /**
     *  @notice    Withdraw staked ERC20 tokens.
     *
     *  @dev       See {_withdraw}. Override that to implement custom logic.
     *
     *  @param _amount    Amount to withdraw.
     */
    //   function withdraw(uint256 _amount) external virtual override nonReentrant {
    //     require(block.number > minRewardBlock);
    //     require(_amount > 1e18);

    //     minRewardBlock = block.number;
    //     _withdraw(_amount);
    //   }

    /**
     *  @notice    Claim accumulated rewards.
     *
     *  @dev       See {_claimRewards}. Override that to implement custom logic.
     *             See {_calculateRewards} for reward-calculation logic.
     */
    //   function claimRewards() external virtual override nonReentrant {
    //     require(block.number > minRewardBlock);
    //     require(rewardTokenBalance > 1e21);

    //     _claimRewards();
    //   }

    /**
     *  @dev    Mint ERC20 rewards to the staker. Override for custom logic.
     *
     *  @param _staker    Address for which to calculated rewards.
     *  @param _rewards   Amount of tokens to be given out as reward.
     *
     */
    // function _mintRewards(address _staker, uint256 _rewards) internal override {
    //     TokenERC20 tokenContract = TokenERC20(rewardToken);
    //     tokenContract.mintTo(_staker, _rewards);
    // }
}
