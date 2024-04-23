// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import '@thirdweb-dev/contracts/base/ERC1155Drop.sol';

contract AircraftNFT is ERC1155Drop {
  address public erc1155LicenseAddress;

  // Admin required license
  mapping(uint256 => uint256) public requiredLicense;

  constructor(
    address _defaultAdmin,
    string memory _name,
    string memory _symbol,
    address _royaltyRecipient,
    uint128 _royaltyBps,
    address _primarySaleRecipient,
    address _licenseAddress
  ) ERC1155Drop(_defaultAdmin, _name, _symbol, _royaltyRecipient, _royaltyBps, _primarySaleRecipient) {
    erc1155LicenseAddress = _licenseAddress;
    requiredLicense[0] = 0;
    requiredLicense[1] = 1;
    requiredLicense[2] = 2;
    requiredLicense[3] = 3;
  }

  function setRequiredLicense(uint256 licenseIndex, uint256 licenseId) public onlyOwner {
    requiredLicense[licenseIndex] = licenseId;
  }

  function _beforeClaim(
    uint256 _tokenId,
    address _receiver,
    uint256 _quantity,
    address _currency,
    uint256 _pricePerToken,
    AllowlistProof calldata _allowlistProof,
    bytes memory _data
  ) internal view virtual override {
    if (_tokenId >= nextTokenIdToLazyMint) {
      revert('Not enough minted tokens');
    }
    require(_data.length > 0, 'Input data is empty');
    require(_allowlistProof.currency == _currency, 'Wrong currency');
    require(_allowlistProof.quantityLimitPerWallet == _quantity, 'Maximum exceeded');
    require(_allowlistProof.pricePerToken == _pricePerToken, 'Wrong price per token');

    ERC1155Drop erc1155Contract = ERC1155Drop(erc1155LicenseAddress);
    uint256 balance = erc1155Contract.balanceOf(_receiver, requiredLicense[_tokenId]);
    require(balance > 0, 'Do not have required license');
  }
}
