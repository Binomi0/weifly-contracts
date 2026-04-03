// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@thirdweb-dev/contracts/base/ERC1155Drop.sol";
import "../tokens/AirlineCoin.sol";
import "../tokens/AirlineRewardCoin.sol";

/**
 * @title AircraftNFT
 * @notice ERC1155 NFT que representa aeronaves, con funcionalidades de gas y licencias.
 */
contract AircraftNFT is ERC1155Drop {
    /* -------------------------------------------------------------------------- */
    /*                               STATE VARIABLES                                */
    /* -------------------------------------------------------------------------- */

    address private erc1155LicenseAddress;
    AirlineCoin private airlineCoin;
    AirlineRewardCoin private airlineGasCoin;

    // Internal accounting of gas balances per aircraft per holder
    mapping(address => mapping(uint256 => uint256)) public gasBalance;

    // Tracks which tokenIds have already been minted
    mapping(uint256 => bool) private _mintedTokens;

    // Required license tokenId per aircraft tokenId
    mapping(uint256 => uint256) public requiredLicense;

    /* -------------------------------------------------------------------------- */
    /*                                EVENTS & ERRORS                               */
    /* -------------------------------------------------------------------------- */

    event GasSent(address indexed to, uint256 indexed aircraftId, uint256 amount);
    event GasBurned(address indexed holder, uint256 indexed aircraftId, uint256 amount);

    /* -------------------------------------------------------------------------- */
    /*                                CONSTRUCTOR                                  */
    /* -------------------------------------------------------------------------- */

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
        // Default mapping (can be overridden by owner later)
        requiredLicense[0] = 0;
        requiredLicense[1] = 1;
        requiredLicense[2] = 2;
        requiredLicense[3] = 3;
    }

    /* -------------------------------------------------------------------------- */
    /*                                 RECEIVE                                    */
    /* -------------------------------------------------------------------------- */

    receive() external payable {
        revert("Direct payments not accepted");
    }

    /* -------------------------------------------------------------------------- */
    /*                                  MODIFIERS                                   */
    /* -------------------------------------------------------------------------- */

    /// @dev Internal helper to confirm existence of a tokenId
    function _exists(uint256 _tokenId) internal view returns (bool) {
        return _mintedTokens[_tokenId];
    }

    /* -------------------------------------------------------------------------- */
    /*                          AIRLINE COIN & GAS COIN SETTERS                    */
    /* -------------------------------------------------------------------------- */

    function setAirlineCoin(address _addr) external onlyOwner {
        airlineCoin = AirlineCoin(_addr);
    }

    function setAirlineGasCoin(address _addr) external onlyOwner {
        airlineGasCoin = AirlineRewardCoin(_addr);
    }

    /* -------------------------------------------------------------------------- */
    /*                           REQ. LICENSE MANAGEMENT                           */
    /* -------------------------------------------------------------------------- */

    function setRequiredLicense(uint256 licenseIndex, uint256 licenseId) external onlyOwner {
        requiredLicense[licenseIndex] = licenseId;
    }

    /* -------------------------------------------------------------------------- */
    /*                                 AIRCRAFT DATA                               */
    /* -------------------------------------------------------------------------- */

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

    /**
     * @notice Mints a new aircraft NFT
     * @dev Only owner can mint. Generates a deterministic IPFS URI based on metadata.
     */
    function mintAircraft(
        uint256 _tokenId,
        string memory _name,
        string memory _description,
        string memory _imageURI,
        string memory _model,
        string memory _licenseType,
        uint256 _price
    )
        external
        onlyOwner
        returns (string memory metadataURI)
    {
        require(!_exists(_tokenId), "Aircraft already minted");

        // Store metadata
        _aircrafts[_tokenId] = AircraftData({
            name: _name,
            description: _description,
            imageURI: _imageURI,
            model: _model,
            licenseType: _licenseType,
            price: _price
        });

        // Mark as minted
        _mintedTokens[_tokenId] = true;

        emit AircraftMinted(_tokenId, _name, _description, _price);

        // Generate deterministic URI
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

        metadataURI = string.concat("ipfs://", bytes32ToHexString(hash));
    }

    /* -------------------------------------------------------------------------- */
    /*                                 SETTERS (ADMIN)                            */
    /* -------------------------------------------------------------------------- */

    function setAircraftData(uint256 _tokenId, AircraftData memory _data) external onlyOwner {
        require(!_exists(_tokenId), "Aircraft already minted");
        _aircrafts[_tokenId] = _data;
    }

    /* -------------------------------------------------------------------------- */
    /*                           METADATA (TOKEN URI)                              */
    /* -------------------------------------------------------------------------- */

    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "ERC1155Metadata: URI query for nonexistent token");

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

        return string.concat("ipfs://", bytes32ToHexString(hash));
    }

    /* -------------------------------------------------------------------------- */
    /*                                 GAS TRANSFERS                               */
    /* -------------------------------------------------------------------------- */

    /**
     * @notice Transfer gas to a holder's aircraft
     * @dev Owner-only operation. Requires the holder to own the aircraft.
     */
    function sendGas(
        address _holder,
        uint256 _amount,
        uint256 _aircraftId
    ) external onlyOwner {
        require(_amount > 0, "Invalid amount");
        require(
            airlineGasCoin.balanceOf(address(this)) >= _amount,
            "Insufficient contract gas balance"
        );
        require(
            balanceOf(_holder, _aircraftId) > 0,
            "Holder does not own this aircraft"
        );

        gasBalance[_holder][_aircraftId] += _amount;
        emit GasSent(_holder, _aircraftId, _amount);
    }

    /**
     * @notice Burn gas from a holder's aircraft
     * @dev Owner-only operation. Requires sufficient internal accounting balance.
     */
    function burnGas(
        address _holder,
        uint256 _aircraftId,
        uint256 _amount
    ) external onlyOwner {
        require(
            gasBalance[_holder][_aircraftId] >= _amount,
            "Amount exceeds balance"
        );
        require(
            airlineGasCoin.balanceOf(address(this)) >= _amount,
            "Insufficient gas balance in contract"
        );

        gasBalance[_holder][_aircraftId] -= _amount;
        airlineGasCoin.burn(_amount);   // Assumes contract has minter/burner role
        emit GasBurned(_holder, _aircraftId, _amount);
    }

    /* -------------------------------------------------------------------------- */
    /*                               CLAIM OVERRIDE                                */
    /* -------------------------------------------------------------------------- */

    /**
     * @dev Override to enforce license checks and other conditions during lazy mint.
     */
    function _beforeClaim(
        uint256 _tokenId,
        address _receiver,
        uint256 _quantity,
        address _currency,
        uint256 _pricePerToken,
        AllowlistProof calldata _allowlistProof,
        bytes memory _data
    ) internal view virtual override {
        // Ensure the token has been lazy‑minted
        require(_tokenId < nextTokenIdToLazyMint(), "Token not minted yet");

        // Data must be non‑empty (custom validation)
        require(_data.length > 0, "Input data is empty");

        // Verify allowlist conditions
        require(_allowlistProof.currency == _currency, "Wrong currency");
        require(
            _allowlistProof.quantityLimitPerWallet == _quantity,
            "Maximum exceeded"
        );
        require(
            _allowlistProof.pricePerToken == _pricePerToken,
            "Wrong price per token"
        );

        // Verify the receiver owns the required license for this aircraft
        ERC1155Drop licenseContract = ERC1155Drop(erc1155LicenseAddress);
        uint256 requiredId = requiredLicense[_tokenId];
        require(
            licenseContract.balanceOf(_receiver, requiredId) > 0,
            "Receiver lacks required license"
        );
    }

    /* -------------------------------------------------------------------------- */
    /*                            HELPER: BYTES32 TO HEX                         */
    /* -------------------------------------------------------------------------- */

    /**
     * @dev Converts a bytes32 to a hex string (without 0x).
     */
    function bytes32ToHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint i = 0; i < 32; i++) {
            str[i * 2] = alphabet[uint8(data[i] >> 4)];
            str[1 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
