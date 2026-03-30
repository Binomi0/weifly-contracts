// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@thirdweb-dev/contracts/base/ERC1155Drop.sol";
import "../tokens/AirlineCoin.sol";
import "../tokens/AirlineRewardCoin.sol";

contract AircraftNFT is ERC1155Drop {
    address private erc1155LicenseAddress;
    AirlineCoin private airlineCoin;
    AirlineRewardCoin private airlineGasCoin;
    mapping(address => mapping(uint256 => uint256)) public gasBalance;
    mapping(uint256 => bool) private _mintedTokens;

    // Add internal function to check existence
    function _exists(uint256 _tokenId) internal view returns (bool) {
        return _mintedTokens[_tokenId];
    }

    // Admin required license
    mapping(uint256 => uint256) public requiredLicense;

    event GasSent(address _address, uint256 _aircraftId, uint256 _amount);
    event GasBurned(address _address, uint256 _aircraftId, uint256 _amount);

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
        revert("Direct payments not accepted");
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
        gasBalance[_address][_aircraftId] =
            gasBalance[msg.sender][_aircraftId] +
            _amount;

        emit GasSent(_address, _amount, _aircraftId);
    }

    function burnGas(
        address _address,
        uint256 _aircraftId,
        uint256 _amount
    ) public onlyOwner {
        require(
            gasBalance[_address][_aircraftId] >= _amount,
            "Amount exceeds balance"
        );
        require(
            airlineGasCoin.balanceOf(address(this)) >= _amount,
            "Insuffient gas balance"
        );

        // Subtract from internal accounting balance
        gasBalance[_address][_aircraftId] =
            gasBalance[_address][_aircraftId] -
            _amount;
        // Burn token from airlineGasCoin
        airlineGasCoin.burn(_amount);

        emit GasBurned(_address, _aircraftId, _amount);
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
        require(!_exists(_tokenId), "Aircraft already minted");

        _aircrafts[_tokenId] = AircraftData({
            name: _name,
            description: _description,
            imageURI: _imageURI,
            model: _model,
            licenseType: _licenseType,
            price: _price
        });

        emit AircraftMinted(_tokenId, _name, _description, _price);

        // Generate a unique URI per NFT with specific data
        bytes32 hash = keccak256(
            abi.encodePacked(
                _tokenId,
                _name,
                _description,
                _imageURI,
                _model,
                _licenseType,
                _price
            )
        );

        // Convert to hex string (0x prefixed)
        return string.concat("ipfs://", toHexString(hash));
    }

    // Helper function to convert bytes32 to hex string
    function toHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint i = 0; i < 32; i++) {
            str[i * 2] = alphabet[uint8(data[i] >> 4)];
            str[1 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }

    function setAircraftData(
        uint256 _tokenId,
        AircraftData memory _data
    ) external onlyOwner {
        require(!_exists(_tokenId), "Aircraft already minted");
        _aircrafts[_tokenId] = _data;
    }

    function tokenURI(
        uint256 _tokenId
    ) public view virtual returns (string memory) {
        require(
            _exists(_tokenId),
            "ERC1155Metadata: URI query for nonexistent token"
        );

        AircraftData storage aircraft = _aircrafts[_tokenId];

        // Generate unique URI per NFT with specific data for each aircraft
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

        return string.concat("ipfs://", bytes32ToHexString(hash));
    }

    // Add this helper function to convert bytes32 to hex string
    function bytes32ToHexString(
        bytes32 data
    ) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint i = 0; i < 32; i++) {
            str[i * 2] = alphabet[uint8(data[i] >> 4)];
            str[1 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
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
