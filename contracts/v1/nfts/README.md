# AircraftNFT - Resumen del Contrato

## Descripción General

`AircraftNFT` es un contrato inteligente que implementa el estándar **ERC1155** para representar aeronaves como NFTs. Hereda de `ERC1155Drop` de ThirdWeb y añade funcionalidades especializadas de gestión de gas y licencias.

## Características Principales

### 1. **Gestión de Licencias**

- Cada aeronave requiere una licencia específica (NFT ERC1155)
- El contrato verifica automáticamente que el receptor posea la licencia requerida antes de permitir el reclamo del NFT
- Mapeo configurable: `requiredLicense[_tokenId]` define qué licencia necesita cada aeronave

### 2. **Sistema de Gas Interno**

- **Balance por aeronave**: Cada aeronave tiene un balance de gas independiente por holder
- **Token de gas**: Utiliza `AirlineRewardCoin` para gestionar el balance de gas
- **Operaciones de gas**:
  - `sendGas()`: Transfiere gas a una aeronave (solo owner)
  - `burnGas()`: Quema gas del balance interno (solo owner)
- Eventos: `GasSent` y `GasBurned` para auditoría

### 3. **Minting de Aeronaves**

- Función `mintAircraft()` permite mintear nuevas aeronaves (solo owner)
- Datos almacenados:
  - `name`: Nombre de la aeronave
  - `description`: Descripción
  - `imageURI`: URI de la imagen
  - `model`: Modelo
  - `licenseType`: Tipo de licencia
  - `price`: Precio
- Generación de URIs determinísticas basadas en hash keccak256

### 4. **Metadatos**

- Implementación personalizada de `tokenURI()` que devuelve URIs de IPFS
- URI generada mediante hash de los datos de la aeronave

### 5. **Lazy Minting**

- Sobrescribe `_beforeClaim()` para validar:
  - Token minteado previamente
  - Datos no vacíos
  - Condiciones de allowlist
  - **Verificación de licencia requerida**

## Estructuras de Datos

### AircraftData

```solidity
struct AircraftData {
    string name;
    string description;
    string imageURI;
    string model;
    string licenseType;
    uint256 price;
}
```

## Variables de Estado

| Variable                | Tipo              | Descripción                                 |
| ----------------------- | ----------------- | ------------------------------------------- |
| `erc1155LicenseAddress` | address           | Dirección del contrato de licencias ERC1155 |
| `airlineCoin`           | AirlineCoin       | Token de la aerolínea                       |
| `airlineGasCoin`        | AirlineRewardCoin | Token de gas/recompensas                    |
| `gasBalance`            | mapping           | Balance de gas por holder y aeronave        |
| `_mintedTokens`         | mapping           | Bandera de tokens ya minteados              |
| `requiredLicense`       | mapping           | Licencia requerida por tokenId              |

## Eventos

| Evento           | Parámetros                        | Descripción                    |
| ---------------- | --------------------------------- | ------------------------------ |
| `GasSent`        | holder, aircraftId, amount        | Gas transferido a una aeronave |
| `GasBurned`      | holder, aircraftId, amount        | Gas quemado de una aeronave    |
| `AircraftMinted` | tokenId, name, description, price | Aeronave minteada              |

## Funciones Administrativas (soloOwner)

| Función                | Descripción                            |
| ---------------------- | -------------------------------------- |
| `setAirlineCoin()`     | Configura el token de la aerolínea     |
| `setAirlineGasCoin()`  | Configura el token de gas              |
| `setRequiredLicense()` | Define licencia requerida por aeronave |
| `setAircraftData()`    | Establece datos de una aeronave        |
| `sendGas()`            | Transfiere gas a una aeronave          |
| `burnGas()`            | Quema gas del balance interno          |

## Construcción

El constructor recibe:

- `_defaultAdmin`: Administrador por defecto
- `_name`: Nombre del drop
- `_symbol`: Símbolo
- `_royaltyRecipient`: Receptor de regalías
- `_royaltyBps`: Porcentaje de regalías (basis points)
- `_primarySaleRecipient`: Receptor de ventas primarias
- `_licenseAddress`: Contrato de licencias ERC1155

## Seguridad

- `receive()` rechaza pagos directos (reverte)
- Verificación de licencias en `_beforeClaim()`
- Validación de balances antes de operaciones de gas
- Control de acceso mediante `onlyOwner`

## Dependencias

- `@thirdweb-dev/contracts/base/ERC1155Drop.sol`
- `../tokens/AirlineCoin.sol`
- `../tokens/AirlineRewardCoin.sol`

## Uso Típico

1. **Deploy**: Configurar contrato con tokens y dirección de licencias
2. **Mint**: Crear aeronaves con `mintAircraft()`
3. **Allowlist**: Configurar lista de permitidos para lazy minting
4. **Claim**: Usuarios reclaman aeronaves (verificando licencias)
5. **Gas Management**: Owner gestiona balances de gas para operaciones

---

# LicenseNFT - Resumen del Contrato

## Descripción General

`LicenseNFT` es un contrato inteligente que implementa el estándar **ERC721** para representar licencias de vuelo (N1-N4) como NFTs. Hereda de `ERC721`, `ERC721Enumerable`, `ERC721URIStorage` y `Ownable` de OpenZeppelin.

## Características Principales

### 1. **Tipos de Licencias**

- Soporta licencias de piloto: **LAPL** (Nivel 1), **PPL** (Nivel 2), **CPL** (Nivel 3), **ATPL** (Nivel 4)
- Mapeo automático de tipo de licencia a nivel mediante `parseLicenseLevel()`
- Información almacenada por licencia:
  - `licenseType`: Tipo de licencia (LAPL, PPL, CPL, ATPL)
  - `level`: Nivel 1-4
  - `pilot`: Dirección del piloto licenciado
  - `flightHours`: Horas de vuelo acumuladas
  - `isVerified`: Estado de verificación
  - `mintTime`: Timestamp de minting

### 2. **Minting de Licencias**

- Función `mintLicense()` permite mintear licencias (solo owner)
- Parámetros:
  - `pilot`: Dirección del piloto
  - `licenseType`: Tipo de licencia
  - `metadata`: URI de metadatos
- Asigna automáticamente tokenId secuencial
- Emite evento `LicenseMinted`

### 3. **Burn de Licencias**

- Función `burnLicense()` permite quemar licencias (solo owner)
- Parámetros:
  - `tokenId`: ID de la licencia
  - `reason`: Razón del burn
- Emite evento `LicenseBurned`

### 4. **Metadatos**

- Implementación de `ERC721URIStorage` para almacenar URIs de metadatos
- `_baseURI()` dinámico que retorna `https://ipfs.weifly.ai/nft/`
- Evita exposición de datos sensibles en URIs base

### 5. **Información de Licencias**

- `getLicenseInfo()`: Obtiene información completa de una licencia
- `getAllLicenses()`: Retorna array de todos los tokenIds minteados

## Estructuras de Datos

### LicenseInfo

```solidity
struct LicenseInfo {
    string licenseType;   // N1, N2, N3, N4 (LAPL, PPL, CPL, ATPL)
    uint256 level;        // Nivel 1-4
    address pilot;        // Piloto licenciado
    uint256 flightHours;  // Horas de vuelo acumuladas
    bool isVerified;      // Verificado por autoridad
    uint256 mintTime;     // Timestamp
}
```

## Variables de Estado

| Variable          | Tipo    | Descripción                              |
| ----------------- | ------- | ---------------------------------------- |
| `_tokenIdCounter` | uint256 | Contador secuencial de tokenIds          |
| `_licenses`       | mapping | Información de cada licencia por tokenId |

## Eventos

| Evento          | Parámetros                            | Descripción       |
| --------------- | ------------------------------------- | ----------------- |
| `LicenseMinted` | tokenId, licenseType, pilot, quantity | Licencia minteada |
| `LicenseBurned` | tokenId, reason                       | Licencia quemada  |

## Funciones Públicas

| Función               | Descripción                              |
| --------------------- | ---------------------------------------- |
| `mintLicense()`       | Mintea una licencia (solo owner)         |
| `burnLicense()`       | Quema una licencia (solo owner)          |
| `getLicenseInfo()`    | Obtiene info de una licencia             |
| `getAllLicenses()`    | Retorna todos los tokenIds minteados     |
| `parseLicenseLevel()` | Convierte tipo de licencia a nivel       |
| `supportsInterface()` | Override para compatibilidad de interfaz |
| `tokenURI()`          | Retorna URI de metadatos de una licencia |

## Funciones Internas (Overrides)

| Función              | Descripción                             |
| -------------------- | --------------------------------------- |
| `_increaseBalance()` | Override para compatibilidad enumerable |
| `_baseURI()`         | Retorna URI base dinámico seguro        |
| `_tokenURI()`        | Construye URI completo con tokenId      |
| `royaltyInfo()`      | Retorna (0, 0) - sin regalías           |
| `receive()`          | Acepta ETH (vacío)                      |
| `fallback()`         | Acepta ETH con fallback (vacío)         |

## Construcción

El constructor recibe:

- `_name`: Nombre del contrato
- `_symbol`: Símbolo

## Seguridad

- Validación de dirección del piloto (no address(0))
- Validación de tipo de licencia y metadatos no vacíos
- Control de acceso mediante `onlyOwner`
- Override de funciones conflictivas para evitar bugs
- `receive()` acepta ETH pero no lo utiliza (vacío)

## Dependencias

- `@openzeppelin/contracts/token/ERC721/ERC721.sol`
- `@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol`
- `@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol`
- `@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol`
- `@openzeppelin/contracts/access/Ownable.sol`
- `@openzeppelin/contracts/utils/Strings.sol`

## Uso Típico

1. **Deploy**: Configurar contrato con nombre y símbolo
2. **Mint**: Crear licencias con `mintLicense()` para pilotos
3. **Track**: Monitorear horas de vuelo y verificación
4. **Burn**: Revocar licencias con `burnLicense()` si es necesario

---

_Contrato desarrollado para el ecosistema Weifly_
