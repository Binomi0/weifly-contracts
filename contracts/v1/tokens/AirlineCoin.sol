// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@thirdweb-dev/contracts/base/ERC20Base.sol";

/**
 * @title AirlineCoin
 * @notice Implements the core ERC20 token for the Weifly ecosystem.
 * @dev This contract mints the total supply upon deployment and sets the initial owner/admin.
 */
contract AirlineCoin is ERC20Base {
    // 1 million units with 18 decimals
    uint256 public constant MAX_SUPPLY = 1_000_000_000_000_000_000_000_000;

    /**
     * @notice Deploys the AirlineCoin token.
     * @param _defaultAdmin The address that should initially control the contract (e.g., the DAO or Treasury).
     * @dev The constructor handles minting the total supply and setting the initial owner/admin based on the provided address.
     */
    constructor(
        address _defaultAdmin
    ) ERC20Base(_defaultAdmin, "Airline Coin", "AIRL") {
        // Best practice: The initial supply should be minted to the designated admin/owner.
        // We assume ERC20Base handles the initial setup correctly when initialized with _defaultAdmin.
        // We mint the full supply to the designated admin address.
        mintTo(_defaultAdmin, MAX_SUPPLY);

        // We explicitly set the owner/admin to the designated address to ensure consistency,
        // overriding any potential default behavior if the base contract allows it.
        _setupOwner(_defaultAdmin);
    }
}
