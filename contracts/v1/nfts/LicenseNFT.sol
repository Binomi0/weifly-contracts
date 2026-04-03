// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title LicenseNFT - NFT de licencias de vuelo N1-N4
/// @notice Contrato ERC-721 simplificado y seguro para licencias de piloto
contract LicenseNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    mapping(uint256 => LicenseInfo) private _licenses;

    struct LicenseInfo {
        string licenseType; // N1, N2, N3, N4
        uint256 level; // Nivel 1-4
        address pilot; // Piloto licenciado
        uint256 flightHours; // Horas de vuelo acumuladas
        bool isVerified; // Verificado por autoridad
        uint256 mintTime; // Timestamp
    }

    event LicenseMinted(
        uint256 indexed tokenId,
        string licenseType,
        address indexed pilot,
        uint256 quantity
    );

    event LicenseBurned(uint256 indexed tokenId, string reason);

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(msg.sender) {}

    // Override conflicting functions
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _increaseBalance(
        address account,
        uint128 amount
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, amount);
    }

    function tokenURI(
        uint256 tokenId
    )
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /// @notice Mint de licencia para piloto
    /// @param pilot Dirección del piloto
    /// @param licenseType Tipo de licencia (N1, N2, N3, N4)
    /// @param metadata URI del NFT
    /// @return tokenId ID asignado
    function mintLicense(
        address pilot,
        string memory licenseType,
        string memory metadata
    ) external onlyOwner returns (uint256) {
        require(pilot != address(0), "Address invalid");
        require(bytes(licenseType).length > 0, "Type required");
        require(bytes(metadata).length > 0, "Metadata required");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(pilot, tokenId);
        _setTokenURI(tokenId, metadata);

        _licenses[tokenId] = LicenseInfo({
            licenseType: licenseType,
            level: parseLicenseLevel(licenseType),
            pilot: pilot,
            flightHours: 0,
            isVerified: true,
            mintTime: block.timestamp
        });

        emit LicenseMinted(tokenId, licenseType, pilot, 1);
        return tokenId;
    }

    /// @notice Burn de licencia
    /// @param tokenId ID de la licencia
    /// @param reason Razón para burn
    function burnLicense(
        uint256 tokenId,
        string memory reason
    ) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "License not found");

        delete _licenses[tokenId];
        _burn(tokenId);

        emit LicenseBurned(tokenId, reason);
    }

    /// @notice Obtener información de licencia
    /// @param tokenId ID de la licencia
    /// @return LicenseInfo struct
    function getLicenseInfo(
        uint256 tokenId
    ) external view returns (LicenseInfo memory) {
        require(ownerOf(tokenId) != address(0), "License not found");
        return _licenses[tokenId];
    }

    function getAllLicenses() external view returns (uint256[] memory) {
        uint256 total = totalSupply();
        uint256[] memory licenses = new uint256[](total);
        for (uint256 i = 0; i < total; i++) {
            licenses[i] = tokenByIndex(i);
        }
        return licenses;
    }

    /// @notice Parser de tipo de licencia a nivel
    function parseLicenseLevel(
        string memory licenseType
    ) public pure returns (uint256) {
        if (keccak256(bytes(licenseType)) == keccak256("LAPL")) return 1;
        if (keccak256(bytes(licenseType)) == keccak256("PPL")) return 2;
        if (keccak256(bytes(licenseType)) == keccak256("CPL")) return 3;
        if (keccak256(bytes(licenseType)) == keccak256("ATPL")) return 4;
        return 0; // Invalido
    }

    /// @notice Helper function to convert tokenId to hex string
    function uint256ToHex(
        uint256 number
    ) internal pure returns (string memory) {
        return string.concat("0x", Strings.toHexString(number));
    }

    /// @notice Base URI dinámico para evitar exposición de metadata
    /// @return URI base
    function _baseURI() internal pure override returns (string memory) {
        // Retorna URI base seguro sin exponer datos sensibles
        return "https://ipfs.weifly.ai/nft/";
    }

    /// @notice Override de _tokenURI para usar _baseURI dinámico
    function _tokenURI(uint256 tokenId) internal pure returns (string memory) {
        // La metadata completa viene en el setTokenURI
        string memory base = _baseURI();
        return string.concat(base, uint256ToHex(tokenId));
    }

    /// @notice Override de royaltyInfo
    function royaltyInfo(
        uint256,
        uint256
    ) external pure returns (address, uint256) {
        return (address(0), 0); // No royalties para mint inicial
    }

    receive() external payable {}

    fallback() external payable {}

    modifier notMinted(uint256 tokenId) {
        try this.ownerOf(tokenId) returns (address) {
            revert("Already minted");
        } catch {
            _;
        }
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
}
