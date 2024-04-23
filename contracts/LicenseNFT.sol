// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@thirdweb-dev/contracts/base/ERC1155Drop.sol';

contract LicenseNFT is ERC1155Drop {
  constructor(
    address _defaultAdmin,
    string memory _name,
    string memory _symbol,
    address _royaltyRecipient,
    uint128 _royaltyBps,
    address _primarySaleRecipient
  ) ERC1155Drop(_defaultAdmin, _name, _symbol, _royaltyRecipient, _royaltyBps, _primarySaleRecipient) {}

  function _beforeClaim(
    uint256 _tokenId,
    address _receiver,
    uint256 _quantity,
    address _currency,
    uint256 _pricePerToken,
    AllowlistProof calldata _allowlistProof,
    bytes memory _data
  ) internal view virtual override {
    require(_allowlistProof.currency == _currency, 'Wrong currency');
    require(_allowlistProof.quantityLimitPerWallet == _quantity, 'Maximum exceeded');
    require(_allowlistProof.pricePerToken == _pricePerToken, 'Wrong price per token');
    require(_data.length > 0, 'Input data is empty');

    if (_tokenId > 0) {
      uint256 requiredTokenId = abi.decode(_data, (uint256));
      require(requiredTokenId == _tokenId - 1, 'Invalid token Id');

      uint256 balance = this.balanceOf(_receiver, requiredTokenId);
      require(balance > 0, 'Do not have required license');
    }
  }
}
