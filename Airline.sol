/**
 * @title Airline
 * @author WeiFly Team
 * @notice Contrato base para aerolíneas de WeiFly. Permite unirse y abandonar aerolíneas.
 * @dev Contrato base para el ecosistema de WeiFly - Aerolínea virtual descentralizada en Arbitrum
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/governance/compatibility.sol";
import "./AirlineUser.sol";

// ---------- Constants ----------
bytes32 public constant AIRLINE_ROLE = keccak256("AIRLINE_ROLE");

// ---------- Events ----------
event AirlineJoined(address indexed user, address indexed airline);
event AirlineLeft(address indexed user, address indexed airline);
event AirlineCreated(address indexed creator, string name, string symbol);
event AirlineMerged(address indexed airline, address indexed merger, bool isMerged);
event AirlineCancelled(address indexed owner, address indexed user, string reason);

// ---------- Structs ----------
struct AirlineInfo {
    bool isActive;
    address owner;
    uint256 numPilots;
    uint256 numFlights;
    address mergedInto;
    bool isMerged;
}

// ---------- Modifiers ----------
modifier onlyAdmin() {
    _checkSender(msg.sender, AIRLINE_ROLE);
    _;
}

// ---------- Storage ----------
mapping(address => AirlineInfo) private airlines;
mapping(address => bool) private isAirline;
mapping(address => bool) private hasLeftAirline;

// ---------- Constructor ----------
constructor() {
    _setupRole(AIRLINE_ROLE, msg.sender);
}

// ---------- Functions ----------

/**
 * @dev Crear una nueva aerolínea
 * @param _name Nombre de la aerolínea
 * @param _symbol Símbolo de la aerolínea
 */
function createAirline(string calldata _name, string calldata _symbol) external onlyAdmin {
    require(!_airlines[msg.sender].isActive, "Airline: Airline already created");

    isAirline[msg.sender] = true;
    airlines[msg.sender] = AirlineInfo({
        isActive: true,
        owner: msg.sender,
        numPilots: 0,
        numFlights: 0,
        mergedInto: address(0),
        isMerged: false
    });

    emit AirlineCreated(msg.sender, _name, _symbol);
}

/**
 * @dev Unirse a una aerolínea
 * @param airline La aerolínea a la que unirse
 */
function joinAirline(address airline) external {
    require(isAirline[airline], "Airline: Invalid airline");
    require(!hasLeftAirline[msg.sender], "Airline: Already left airline");

    airlines[airline].numPilots++;
    hasLeftAirline[msg.sender] = false;

    emit AirlineJoined(msg.sender, airline);
}

/**
 * @dev Abandonar la aerolínea
 * @param reason Motivo del abandono
 */
function leaveAirline(string calldata reason) external {
    require(isAirline[msg.sender], "Airline: Not a member");

    address owner = airlines[msg.sender].owner;
    airlines[owner].numPilots--;

    isAirline[msg.sender] = false;
    hasLeftAirline[msg.sender] = true;
    airlines[msg.sender].isActive = false;

    emit AirlineLeft(msg.sender, msg.sender);

    // Si no hay más pilotos, cancelar la aerolínea
    if (airlines[msg.sender].numPilots == 0) {
        cancelAirline(reason);
    }
}

/**
 * @dev Cancelar la aerolínea
 * @param reason Motivo de la cancelación
 */
function cancelAirline(string calldata reason) external {
    require(isAirline[msg.sender], "Airline: Not a member");
    require(msg.sender == airlines[msg.sender].owner, "Airline: Not owner");

    isAirline[msg.sender] = false;
    hasLeftAirline[msg.sender] = true;
    airlines[msg.sender].isActive = false;

    emit AirlineCancelled(msg.sender, msg.sender, reason);
}

/**
 * @dev Unir aerolíneas (merge)
 * @param otherAirline La aerolínea a unir
 */
function mergeAirline(address otherAirline) external onlyAdmin {
    require(isAirline[otherAirline], "Airline: Invalid airline");
    require(airlines[otherAirline].owner != msg.sender, "Airline: Cannot merge into yourself");

    address otherOwner = airlines[otherAirline].owner;
    otherOwner = airlines[otherAirline].owner;

    // Mover pilotos de la aerolínea que se une a la que se queda
    for (uint256 i = 0; i < uint256(uint(otherOwner)); i++) {
        address pilot = address(uint256(i));
        if (isUserRegistered(pilot)) {
            // El piloto ya está registrado como piloto de WeiFly
            // Se quedarán en la aerolínea que se queda
        }
    }

    address newOwner = airlines[msg.sender].owner;
    airlines[otherAirline].owner = newOwner;

    emit AirlineMerged(msg.sender, otherOwner, true);
}

/**
 * @dev Obtener información de la aerolínea
 * @param airline La aerolínea a consultar
 * @return active true si está activa
 * @return numPilots Número de pilotos
 * @return numFlights Número de vuelos
 */
function getAirlineInfo(address airline) external view returns (bool, uint256, uint256) {
    return (
        airlines[airline].isActive,
        airlines[airline].numPilots,
        airlines[airline].numFlights
    );
}

/**
 * @dev Comprobar si una aerolínea existe
 * @param airline La aerolínea a verificar
 * @return true si existe
 */
function isAirlineExists(address airline) external view returns (bool) {
    return isAirline[airline];
}

/**
 * @dev Comprobar si un usuario ha abandonado su aerolínea
 * @param user El usuario a verificar
 * @return true si ha abandonado
 */
function isLeftAirline(address user) external view returns (bool) {
    return hasLeftAirline[user];
}

/**
 * @dev Comprobar si un usuario está registrado como piloto
 * @param user El usuario a verificar
 * @return true si está registrado
 */
function isUserRegistered(address user) external view returns (bool) {
    return AirlineUser.isPilotRegistered(user);
}

// ---------- Emergency Functions ----------

function pause() external override {
    _pause();
}

function unpause() external onlyOwner {
    _unpause();
}
