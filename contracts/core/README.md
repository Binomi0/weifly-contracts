# Weifly Main Contracts

## AirlinePilot

`AirlinePilot.sol` es el contrato principal para la gestión de licencias de pilotos en WeiFly. Implementa la interfaz `IAirlinePilot` y delega el seguimiento de la carrera de pilotos a `PilotCareer`.

### Características Principales

- **Gestión de licencias ERC721**: Emite NFTs de licencias a los pilotos registrados
- **Control de acceso**: Roles de administrador y gerente de aerolínea
- **Registro de pilotos**: Integra con el sistema de carrera de `PilotCareer`
- **Solicitud de acceso a aerolíneas**: Permite a los pilotos solicitar unirse a aerolíneas
- **Registro de vuelos**: Registra horas de vuelo en la carrera del piloto

### Estructura del Contrato

```solidity
contract AirlinePilot is ERC721, AccessControl, IAirlinePilot
```

**Roles de acceso:**

- `AIRLINE_ADMIN_ROLE`: Permite registrar pilotos, aprobar licencias y registrar vuelos
- `AIRLINE_MANAGER_ROLE`: Permite aprobar solicitudes de acceso a aerolíneas
- `DEFAULT_ADMIN_ROLE`: Control de acceso general (OpenZeppelin)

### Eventos Emitidos

| Evento            | Descripción                                              |
| ----------------- | -------------------------------------------------------- |
| `PilotRegistered` | Emitido cuando se registra un nuevo piloto               |
| `LicenseGranted`  | Emitido cuando se otorga una licencia NFT                |
| `FlightRecorded`  | Emitido cuando se registran horas de vuelo               |
| `RequestCreated`  | Emitido cuando un piloto solicita acceso a una aerolínea |
| `RequestApproved` | Emitido cuando se aprueba una solicitud de acceso        |

### Funciones Públicas

#### Funciones de Escritura

**`registerPilot(address pilot, uint256 flightHours, address airline)`**

- Registra un piloto en el sistema de carrera
- Opcionalmente registra horas de vuelo iniciales
- **Role**: `AIRLINE_ADMIN_ROLE`

**`requestAirlineAccess(address pilot, address airline)`**

- Permite a un piloto solicitar acceso a una aerolínea
- Verifica que el piloto esté registrado
- Crea una solicitud pendiente de aprobación
- **Role**: Público (sin restricción de rol)

**`approveRequest(uint256 requestId)`**

- Aprueba una solicitud de acceso a aerolínea
- Marca la solicitud como aprobada y limpia el contador
- **Role**: `AIRLINE_MANAGER_ROLE`

**`mintLicense(address pilot, uint8 licenseLevel, string memory tokenName, string memory tokenSymbol)`**

- Otorga una licencia NFT a un piloto
- Verifica que el piloto esté registrado
- Verifica que el nivel de carrera del piloto sea suficiente
- **Role**: `AIRLINE_ADMIN_ROLE`

**`recordFlight(address pilot, uint256 flightHours)`**

- Registra horas de vuelo para un piloto
- Actualiza el registro de carrera en `PilotCareer`
- **Role**: `AIRLINE_ADMIN_ROLE`

#### Funciones de Lectura (View)

**`canAccessAirline(address pilot, address airline) returns (bool)`**

- Verifica si un piloto puede acceder a una aerolínea específica
- Devuelve `true` si el piloto está registrado y la aerolínea actual coincide

**`getPendingRequest(address pilot, address airline) returns (bool)`**

- Verifica si existe una solicitud pendiente de acceso a aerolínea

**`getNextLicenseId() returns (uint256)`**

- Devuelve el ID de la próxima licencia a emitir

**`getTotalLicensesIssued() returns (uint256)`**

- Devuelve el total de licencias emitidas hasta el momento

### Dependencias

- `@openzeppelin/contracts/token/ERC721/ERC721.sol`
- `@openzeppelin/contracts/access/AccessControl.sol`
- `./PilotCareer.sol`
- `./interface/IAirlinePilot.sol`

### Construcción

El contrato se construye con una dirección de `PilotCareer`:

```solidity
constructor(address _careerAddress) ERC721("WeiFly License", "LSC")
```

### Flujo de Uso Típico

1. **Registro de piloto**: Un administrador registra un piloto con horas de vuelo iniciales
2. **Solicitud de aerolínea**: El piloto solicita acceso a una aerolínea
3. **Aprobación**: Un gerente de aerolínea aprueba la solicitud
4. **Minting de licencia**: El administrador otorga una licencia NFT al piloto
5. **Registro de vuelos**: Se registran las horas de vuelo del piloto

### Eventos

```solidity
event PilotRegistered(address indexed pilot, uint256 flightHours);
event LicenseGranted(address indexed pilot, uint256 token, uint26 licenseLevel);
event FlightRecorded(address indexed pilot, uint256 flightHours);
event RequestCreated(address indexed pilot, address indexed airline, uint256 requestId);
event RequestApproved(uint256 indexed requestId, address indexed reviewer);
```

---

## Otros Contratos del Núcleo

- `Airline.sol`: Contrato principal de la aerolínea
- `FlightController.sol`: Controlador de operaciones de vuelo
- `PilotCareer.sol`: Sistema de carrera de pilotos
- `StakingAirline.sol`: Contrato de staking para aerolíneas
- `AircraftNft.sol`: NFTs de aeronaves
- `LicenseNFT.sol`: NFTs de licencias
- `AirlineCoin.sol`: Token de aerolínea
- `AirlineRewardCoin.sol`: Token de recompensas
