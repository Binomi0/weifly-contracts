// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @title HexUtils
/// @notice Gas-efficient library for hex string conversion
library HexUtils {
    /// @dev Converts a bytes32 to a hex string (without 0x prefix).
    function toHexString(bytes32 data) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(64);
        for (uint i = 0; i < 32; i++) {
            str[i * 2] = alphabet[uint8(data[i] >> 4)];
            str[1 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
        }
        return string(str);
    }
}
