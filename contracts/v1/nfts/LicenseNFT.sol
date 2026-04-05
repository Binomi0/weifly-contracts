// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title LicenseNFT - NFT de licencias de vuelo N1-N4
/// @notice Contrato ERC-721 simplificado y seguro para licencias de piloto
contract LicenseNFT is ERC721, ERC721URIStorage, Ownable {
    mapping(LicenseType licenseType => uint8) license;
    uint8 _tokenIdCounter = 1;

    enum LicenseType {
        LAPL,
        PPL,
        CPL,
        ATPL
    }

    struct ClaimCondition {
        address currency;
        uint256 maxClaimableSupply;
        string metadata;
        uint256 startTimestamp;
        uint256 quantityLimitPerWallet;
        uint256 pricePerToken;
        uint256 supplyClaimed;
        bytes32 merkleRoot;
    }

    mapping(uint256 => ClaimCondition) public claimConditions;

    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) Ownable(msg.sender) {}

    // Override conflicting functions
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @notice Mint de licencia para piloto
    /// @param pilot Dirección del piloto
    /// @param licenseType Tipo de licencia (N1, N2, N3, N4)
    /// @param metadata URI del NFT
    /// @return tokenId ID asignado
    function mintLicense(
        address pilot,
        LicenseType licenseType,
        string memory metadata
    ) external onlyOwner returns (uint256) {
        require(pilot != address(0), "Address invalid");
        require(bytes(metadata).length > 0, "Metadata required");

        uint256 tokenId = _tokenIdCounter++;
        license[licenseType] = uint8(licenseType);

        _safeMint(pilot, tokenId);
        _setTokenURI(tokenId, metadata);
        return tokenId;
    }

    /// @notice Lazy mint de licencia para piloto
    /// @param pilot Dirección del piloto
    /// @param licenseType Tipo de licencia (N1, N2, N3, N4)
    /// @param metadata URI del NFT
    /// @return tokenId ID asignado
    function lazyMint(
        address pilot,
        LicenseType licenseType,
        string memory metadata
    ) external onlyOwner returns (uint256) {
        require(pilot != address(0), "Address invalid");
        require(bytes(metadata).length > 0, "Metadata required");

        uint256 tokenId = _tokenIdCounter++;
        license[licenseType] = uint8(licenseType);

        _safeMint(pilot, tokenId);
        _setTokenURI(tokenId, metadata);
        return tokenId;
    }

    /// @notice Burn de licencia
    /// @param tokenId ID de la licencia
    function burnLicense(uint256 tokenId) external onlyOwner {
        require(ownerOf(tokenId) != address(0), "License not found");

        _burn(tokenId);
    }

    /// @notice Set claim conditions for a license
    /// @param tokenId ID de la licencia
    /// @param conditions Condiciones de claim
    /// @param overrideSiOverrideSi true para sobrescribir condiciones existentes
    function setClaimConditions(
        uint256 tokenId,
        ClaimCondition memory conditions,
        bool overrideSiOverrideSi
    ) external onlyOwner {
        require(
            claimConditions[tokenId].supplyClaimed == 0 || overrideSiOverrideSi,
            "Claim conditions already set"
        );
        claimConditions[tokenId] = conditions;
    }

    /// @notice Get claim conditions for a license
    /// @param tokenId ID de la licencia
    /// @return conditions Condiciones de claim
    function claimCondition(uint256 tokenId)
        public
        view
        returns (ClaimCondition memory)
    {
        return claimConditions[tokenId];
    }

    /// @notice Parser de tipo de licencia a nivel
    /// @param licenseType Tipo de licencia (LAPL, PPL, CPL, ATPL)
    /// @return nivel Nivel de licencia (1-4)
    function parseLicenseLevel(
        string memory licenseType
    ) public pure returns (uint256) {
        if (
            keccak256(abi.encodePacked(licenseType)) ==
            keccak256(abi.encodePacked("LAPL"))
        ) return 1;
        if (
            keccak256(abi.encodePacked(licenseType)) ==
            keccak256(abi.encodePacked("PPL"))
        ) return 2;
        if (
            keccak256(abi.encodePacked(licenseType)) ==
            keccak256(abi.encodePacked("CPL"))
        ) return 3;
        if (
            keccak256(abi.encodePacked(licenseType)) ==
            keccak256(abi.encodePacked("ATPL"))
        ) return 4;
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
    ) internal override(ERC721) returns (address) {
        return super._update(to, tokenId, auth);
    }

    /// @notice Sobrescribe tokenURI para usar _baseURI dinámico
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
}
