// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@thirdweb-dev/contracts/base/ERC1155Drop.sol";
import "../interface/IAirlineCoin.sol";
import "../interface/IAirlineRewardCoin.sol";
import "../libs/HexUtils.sol";

/**
 * @title AircraftNFT
 * @notice ERC1155 NFT representing aircraft with gas and license features.
 */
contract AircraftNFT is ERC1155Drop {
    using HexUtils for bytes32;

    /* ---- Custom Errors (cheaper than revert strings) ---- */
    error DirectPayment();
    error AlreadyMinted();
    error NotMinted();
    error InvalidAmount();
    error InsufficientGas();
    error NotOwner();
    error TokenNotMinted();
    error EmptyData();
    error WrongCurrency();
    error MaxExceeded();
    error WrongPrice();
    error MissingLicense();

    /* ---- State ---- */
    address private erc1155LicenseAddress;
    IAirlineCoin private airlineCoin;
    IAirlineRewardCoin private airlineGasCoin;

    mapping(address => mapping(uint256 => uint256)) public gasBalance;
    mapping(uint256 => bool) private _mintedTokens;
    mapping(uint256 => uint256) public requiredLicense;

    /* ---- Events ---- */
    event GasSent(
        address indexed to,
        uint256 indexed aircraftId,
        uint256 amount
    );
    event GasBurned(
        address indexed holder,
        uint256 indexed aircraftId,
        uint256 amount
    );

    /* ---- Constructor ---- */
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

    /* ---- Receive ---- */
    receive() external payable {
        revert DirectPayment();
    }

    /* ---- Helpers ---- */
    function _exists(uint256 _tokenId) internal view returns (bool) {
        return _mintedTokens[_tokenId];
    }

    /* ---- Coin Setters ---- */
    function setAirlineCoin(address _addr) external onlyOwner {
        airlineCoin = IAirlineCoin(_addr);
    }

    function setAirlineGasCoin(address _addr) external onlyOwner {
        airlineGasCoin = IAirlineRewardCoin(_addr);
    }

    /* ---- License Management ---- */
    function setRequiredLicense(
        uint256 licenseIndex,
        uint256 licenseId
    ) external onlyOwner {
        requiredLicense[licenseIndex] = licenseId;
    }

    /* ---- Aircraft Data ---- */
    struct AircraftData {
        string name;
        string description;
        string imageURI;
        string model;
        string licenseType;
        uint256 price;
    }

    mapping(uint256 => AircraftData) private _aircrafts;

    event AircraftMinted(
        uint256 indexed tokenId,
        string name,
        string description,
        uint256 price
    );

    function mintAircraft(
        uint256 _tokenId,
        string memory _name,
        string memory _description,
        string memory _imageURI,
        string memory _model,
        string memory _licenseType,
        uint256 _price
    ) external onlyOwner returns (string memory metadataURI) {
        if (_exists(_tokenId)) revert AlreadyMinted();

        _aircrafts[_tokenId] = AircraftData({
            name: _name,
            description: _description,
            imageURI: _imageURI,
            model: _model,
            licenseType: _licenseType,
            price: _price
        });

        _mintedTokens[_tokenId] = true;
        emit AircraftMinted(_tokenId, _name, _description, _price);

        metadataURI = _buildURI(_tokenId);
    }

    /* ---- Setters (Admin) ---- */
    function setAircraftData(
        uint256 _tokenId,
        AircraftData memory _data
    ) external onlyOwner {
        if (!_exists(_tokenId)) revert NotMinted();
        _aircrafts[_tokenId] = _data;
    }

    /* ---- Metadata (Token URI) ---- */
    function tokenURI(
        uint256 _tokenId
    ) public view virtual returns (string memory) {
        if (!_exists(_tokenId)) revert NotMinted();
        return _buildURI(_tokenId);
    }

    /* ---- Gas Transfers ---- */
    function sendGas(
        address _holder,
        uint256 _amount,
        uint256 _aircraftId
    ) external onlyOwner {
        if (_amount == 0) revert InvalidAmount();
        if (airlineGasCoin.balanceOf(address(this)) < _amount)
            revert InsufficientGas();
        if (this.balanceOf(_holder, _aircraftId) == 0) revert NotOwner();

        gasBalance[_holder][_aircraftId] += _amount;
        emit GasSent(_holder, _aircraftId, _amount);
    }

    function burnGas(
        address _holder,
        uint256 _aircraftId,
        uint256 _amount
    ) external onlyOwner {
        if (gasBalance[_holder][_aircraftId] < _amount)
            revert InsufficientGas();
        if (airlineGasCoin.balanceOf(address(this)) < _amount)
            revert InsufficientGas();

        gasBalance[_holder][_aircraftId] -= _amount;
        airlineGasCoin.burn(_amount);
        emit GasBurned(_holder, _aircraftId, _amount);
    }

    /* ---- Claim Override ---- */
    function _beforeClaim(
        uint256 _tokenId,
        address _receiver,
        uint256 _quantity,
        address _currency,
        uint256 _pricePerToken,
        AllowlistProof calldata _allowlistProof,
        bytes memory _data
    ) internal view virtual override {
        if (_tokenId >= nextTokenIdToLazyMint) revert TokenNotMinted();
        if (_data.length == 0) revert EmptyData();
        if (_allowlistProof.currency != _currency) revert WrongCurrency();
        if (_allowlistProof.quantityLimitPerWallet != _quantity)
            revert MaxExceeded();
        if (_allowlistProof.pricePerToken != _pricePerToken)
            revert WrongPrice();

        ERC1155Drop licenseContract = ERC1155Drop(erc1155LicenseAddress);
        uint256 requiredId = requiredLicense[_tokenId];
        if (licenseContract.balanceOf(_receiver, requiredId) == 0)
            revert MissingLicense();
    }

    /* ---- Internal Helpers ---- */
    function _buildURI(
        uint256 _tokenId
    ) internal view returns (string memory) {
        AircraftData storage aircraft = _aircrafts[_tokenId];
        bytes32 hash = keccak256(
            abi.encodePacked(
                _tokenId,
                aircraft.name,
                aircraft.description,
                aircraft.imageURI,
                aircraft.model,
                aircraft.licenseType,
                aircraft.price
            )
        );
        return string.concat("ipfs://", hash.toHexString());
    }
}
