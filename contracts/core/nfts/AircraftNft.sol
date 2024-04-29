// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@thirdweb-dev/contracts/base/ERC1155Drop.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../tokens/AirlineCoin.sol";
import "../tokens/AirlineRewardCoin.sol";

contract AircraftNFT is ERC1155Drop {
    using SafeMath for uint256;

    address private erc1155LicenseAddress;
    AirlineCoin private airlineCoin;
    AirlineRewardCoin private airlineGasCoin;
    mapping(address => mapping(uint256 => uint256)) public gasBalance;

    // Admin required license
    mapping(uint256 => uint256) public requiredLicense;

    constructor(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        address _royaltyRecipient,
        uint128 _royaltyBps,
        address _primarySaleRecipient,
        address _licenseAddress
    )
        ERC1155Drop(
            _defaultAdmin,
            _name,
            _symbol,
            _royaltyRecipient,
            _royaltyBps,
            _primarySaleRecipient
        )
    {
        erc1155LicenseAddress = _licenseAddress;
        requiredLicense[0] = 0;
        requiredLicense[1] = 1;
        requiredLicense[2] = 2;
        requiredLicense[3] = 3;
    }

    receive() external payable {
        require(msg.value < 0);
    }

    function sendGas(
        address _address,
        uint256 _amount,
        uint256 _aircraftId
    ) public onlyOwner {
        require(_amount > 0, "Invalid amount");

        // Check if the contract has enough balance
        require(
            airlineGasCoin.balanceOf(address(this)) >= _amount,
            "Insufficient balance"
        );

        // Ensure the sender owns the specified aircraft
        require(
            this.balanceOf(_address, _aircraftId) > 0,
            "Trying to send gas to a non-owned aircraft"
        );

        // Update the gas balance
        gasBalance[_address][_aircraftId] = gasBalance[msg.sender][_aircraftId]
            .add(_amount);
    }

    function burnGas(
        address _address,
        uint256 _aircraftId,
        uint256 _amount
    ) public onlyOwner {
        require(
            airlineGasCoin.balanceOf(address(this)) >= _amount,
            "Insuffient gas balance"
        );

        // Subtract from internal accounting balance
        gasBalance[_address][_aircraftId] = gasBalance[_address][_aircraftId]
            .sub(_amount);
        // Burn token from airlineGasCoin
        airlineGasCoin.burn(_amount);
    }

    function setAirlineCoin(address _address) public onlyOwner {
        airlineCoin = AirlineCoin(_address);
    }

    function setAirlineGasCoin(address _address) public onlyOwner {
        airlineGasCoin = AirlineRewardCoin(_address);
    }

    function setRequiredLicense(
        uint256 licenseIndex,
        uint256 licenseId
    ) public onlyOwner {
        requiredLicense[licenseIndex] = licenseId;
    }

    function _beforeClaim(
        uint256 _tokenId,
        address _receiver,
        uint256 _quantity,
        address _currency,
        uint256 _pricePerToken,
        AllowlistProof calldata _allowlistProof,
        bytes memory _data
    ) internal view virtual override {
        require(_tokenId < nextTokenIdToLazyMint, "Not enough minted tokens");
        require(_data.length > 0, "Input data is empty");
        require(_allowlistProof.currency == _currency, "Wrong currency");
        require(
            _allowlistProof.quantityLimitPerWallet == _quantity,
            "Maximum exceeded"
        );
        require(
            _allowlistProof.pricePerToken == _pricePerToken,
            "Wrong price per token"
        );

        ERC1155Drop erc1155Contract = ERC1155Drop(erc1155LicenseAddress);
        uint256 balance = erc1155Contract.balanceOf(
            _receiver,
            requiredLicense[_tokenId]
        );
        require(balance > 0, "Do not have required license");
    }
}
