// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../core/interface/IPilotCareer.sol";

/// @title LicenseNFT - NFT de licencias de vuelo N1-N4
/// @notice Contrato ERC-721 simplificado y seguro para licencias de piloto
contract LicenseNFT is ERC721, ERC721URIStorage, Ownable {
    uint8 _tokenIdCounter = 1;

    IERC20 public airlineCoin;
    IPilotCareer public pilotCareer;
    uint256 public claimFee = 10 * 10**18;

    mapping(address => mapping(LicenseType => bool)) public hasClaimedLicense;
    mapping(uint256 => LicenseType) public tokenLicenseType;

    enum LicenseType {
        LAPL,
        PPL,
        CPL,
        ATPL
    }


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
        tokenLicenseType[tokenId] = licenseType;

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
        tokenLicenseType[tokenId] = licenseType;

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

    /// @notice Permite configurar los contratos externos
    /// @param _airlineCoin Dirección del token AIRL
    /// @param _pilotCareer Dirección del contrato PilotCareer
    function setDependencies(address _airlineCoin, address _pilotCareer) external onlyOwner {
        airlineCoin = IERC20(_airlineCoin);
        pilotCareer = IPilotCareer(_pilotCareer);
    }

    /// @notice Permite actualizar el precio en AIRL para claimear una licencia
    /// @param _fee Nuevo precio en wei
    function setClaimFee(uint256 _fee) external onlyOwner {
        claimFee = _fee;
    }

    /// @notice Retorna las horas de vuelo necesarias para una licencia
    /// @param licenseType Tipo de licencia
    /// @return limit Horas de vuelo requeridas
    function getRequiredHours(LicenseType licenseType) public pure returns (uint16 limit) {
        if (licenseType == LicenseType.LAPL) return 1;
        if (licenseType == LicenseType.PPL) return 100;
        if (licenseType == LicenseType.CPL) return 500;
        if (licenseType == LicenseType.ATPL) return 1000;
        revert("Invalid license type");
    }

    /// @notice Permite a un piloto claimear su licencia cumpliendo horas y pagando AIRL
    /// @param licenseType El tipo de licencia (0=LAPL, 1=PPL, 2=CPL, 3=ATPL)
    /// @param metadata URI de la metadata (opcional si se usa _baseURI)
    function claimLicense(LicenseType licenseType, string memory metadata) external {
        require(address(airlineCoin) != address(0) && address(pilotCareer) != address(0), "Dependencies not set");
        require(!hasClaimedLicense[msg.sender][licenseType], "License already claimed");
        require(bytes(metadata).length > 0, "Metadata required");

        uint256 hoursLogged = pilotCareer.getTotalFlightTime(msg.sender);
        uint256 reqHours = getRequiredHours(licenseType);
        require(hoursLogged >= reqHours, "Not enough flight hours");

        require(airlineCoin.transferFrom(msg.sender, owner(), claimFee), "Fee transfer failed");

        hasClaimedLicense[msg.sender][licenseType] = true;

        uint256 tokenId = _tokenIdCounter++;
        tokenLicenseType[tokenId] = licenseType;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, metadata);
    }

    /// @notice Parser de tipo de licencia a nivel
    /// @param licenseType Tipo de licencia (LAPL, PPL, CPL, ATPL)
    /// @return nivel Nivel de licencia (1-4)
    function parseLicenseLevel(
        string memory licenseType
    ) public pure returns (uint256) {
        bytes32 hash = keccak256(abi.encodePacked(licenseType));

        if (hash == keccak256(abi.encodePacked("LAPL"))) return 1;
        if (hash == keccak256(abi.encodePacked("PPL"))) return 2;
        if (hash == keccak256(abi.encodePacked("CPL"))) return 3;
        if (hash == keccak256(abi.encodePacked("ATPL"))) return 4;

        revert("Invalid license type"); // Mejor que return 0
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
