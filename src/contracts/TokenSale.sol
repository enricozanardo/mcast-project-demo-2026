// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IERC20Mintable} from "./IERC20Mintable.sol";

contract TokenSale is Ownable, ReentrancyGuard {
	IERC20Mintable public immutable token;

	uint256 public tokensPerEth;

	event TokensPurchased(address indexed buyer ,uint256 ethPaid, uint256 tokenMinted);
	event RateUpdagted(uint256 oldRate, uint256 newRate);
	event ETHWithdraw(address indexed to, uint256 amount);

	error ZeroPayment();
	error ZeroRate();
	error WithdrawFailed();

	constructor(address tokenAddress, uint256 initialRate, address initialOwner) Ownable(initialOwner) {
		if (initialRate == 0) revert ZeroRate();
		token = IERC20Mintable(tokenAddress);
		tokensPerEth = initialRate;
	}


	function buyTokens() external payable nonReentrant {
	  _buy();
	}	


	receive() external payable nonReentrant {
          _buy();
	}

        function _buy() private {
	  if(msg.value == 0) revert ZeroPayment();

	  uint256 amount = msg.value * tokensPerEth;
	  token.mint(msg.sender, amount);

	  emit TokensPurchased(msg.sender, msg.value, amount);
	}


	function setRate(uint256 newRate) external onlyOwner {
		if(newRate == 0) revert ZeroRate();
        emit RateUpdagted(tokensPerEth, newRate);
		tokensPerEth = newRate;
	}

	function withdrawETH(address to, uint256 amount) external onlyOwner {
	  (bool ok,) = payable(to).call{value: amount}("");
          if (!ok) revert WithdrawFailed();
		  emit ETHWithdraw(to, amount);
	}

}
