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

_Contrato desarrollado para el ecosistema Weifly_
