// Lottey functionality
// Enter the lottery (paying amount of ether)
// Pick a random winner (verifiably random)
// Winner to be selected every X minutes -> completely automated
// Offchain Oracle -> randomness (Chainlink VRF) & automated execution (Chainlink Keeper)
// Payout to the winner

// Style Guide: https://docs.soliditylang.org/en/v0.8.13/style-guide.html#order-of-layout
// Code documentation: https://docs.soliditylang.org/en/v0.8.11/natspec-format.html#natspec

// SPDX-License-Identifier: MIT

// 1: Pragma statements
pragma solidity ^0.8.7;

// 2: Import statements
// 3: Interfaces (none in this case)
// 4: Libraries (none in this case)

// 5: Errors
error Lottery__NotEnoughEthEntered();

// 6: Contracts

contract Lottery {
  // 6.a: Type declarations
  // 6.b: State variables
  uint256 private immutable i_entranceFee;

  // 6.c: Events
  // 6.d: Modifiers
  // 6.e: Functions

  // 6.e.1: Constructor
  constructor(uint256 entranceFee) {
    i_entranceFee = entranceFee;
  }

  // 6.e.2: Receive
  // 6.e.3: Fallback
  // 6.e.4: External
  // 6.e.5: Public
  function enterLottery() public payable {
    if (msg.value < i_entranceFee) {
      revert Lottery__NotEnoughEthEntered();
    }
  }

  // 6.e.6: Internal
  // 6.e.7: Private
  // 6.e.8: View / Pure
  function getEntranceFe() public view returns (uint256) {
    return i_entranceFee;
  }
}
