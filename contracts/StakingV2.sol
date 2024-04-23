pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract StakingContract is Context {
    struct Stake {
        uint256 amount;
        uint256 duration; // Duración en días
        uint256 startTime;
        uint256 endTime;
        bool started;
    }

    mapping(address => Stake) public stakes;

    IERC20 public token;
    address public owner;
    uint256 public constant MONTH_IN_SECONDS = 2592000; // 30 días
    uint256 public constant QUARTER_IN_SECONDS = 7776000; // 90 días
    uint256 public constant HALF_YEAR_IN_SECONDS = 15552000; // 180 días

    event Staked(
        address indexed user,
        uint256 amount,
        uint256 duration,
        uint256 endTime
    );
    event Unstaked(address indexed user, uint256 amount, uint256 reward);

    constructor(address _token) {
        token = IERC20(_token);
        owner = _msgSender();
    }

    modifier onlyOwner() {
        require(_msgSender() == owner, "Only owner can call this function");
        _;
    }

    function stake(uint256 _amount, uint256 _duration) external {
        require(_amount > 0, "Amount must be greater than zero");
        require(
            _duration == 30 || _duration == 90 || _duration == 180,
            "Invalid duration"
        );
        require(
            stakes[_msgSender()].started == false,
            "There is already a staking open"
        );

        uint256 endTime = block.timestamp + _duration * 1 days;
        token.transferFrom(_msgSender(), address(this), _amount);

        stakes[_msgSender()] = Stake(
            _amount,
            _duration,
            block.timestamp,
            endTime,
            true
        );

        emit Staked(_msgSender(), _amount, _duration, endTime);
    }

    function unstake() external {
        Stake storage userStake = stakes[_msgSender()];
        require(userStake.amount > 0, "No stake found");

        uint256 reward = calculateReward(userStake);

        delete stakes[_msgSender()];

        token.transfer(_msgSender(), userStake.amount + reward);

        emit Unstaked(_msgSender(), userStake.amount, reward);
    }

    function calculateReward(
        Stake memory _stake
    ) internal view returns (uint256) {
        uint256 duration = block.timestamp - _stake.startTime;
        uint256 reward = 0;

        if (_stake.duration == 30 && duration >= MONTH_IN_SECONDS) {
            reward = (_stake.amount * 10) / 100; // 10% reward for 1 month
        } else if (_stake.duration == 90 && duration >= QUARTER_IN_SECONDS) {
            reward = (_stake.amount * 30) / 100; // 30% reward for 3 months
        } else if (_stake.duration == 180 && duration >= HALF_YEAR_IN_SECONDS) {
            reward = (_stake.amount * 50) / 100; // 50% reward for 6 months
        }

        return reward;
    }

    function withdrawTokens(address _to, uint256 _amount) external onlyOwner {
        token.transfer(_to, _amount);
    }
}
