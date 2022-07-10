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
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

// 3: Interfaces (none in this case)
// 4: Libraries (none in this case)

// 5: Errors
error Lottery__NotEnoughEthEntered();

// 6: Contracts

contract Lottery is VRFConsumerBaseV2 {
  // 6.a: Type declarations
  // 6.b: State variables
  uint256 private immutable i_entranceFee;
  address payable[] private s_players;

  // 6.c: Events
  event LotteryEnter(address indexed player);

  // 6.d: Modifiers
  // 6.e: Functions

  // 6.e.1: Constructor
  constructor(address vrfCoordinatorV2, uint256 entranceFee) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_entranceFee = entranceFee;
  }

  // 6.e.2: Receive
  // 6.e.3: Fallback

  // 6.e.4: External

  /// @notice Request a random winner
  /// @dev Request a random winner (verifiably random) and automatically run through Chainlink Keepers
  /// @dev Step 1 : request the random number
  /// @dev Step 2 : once we get it, do something with it
  /// @dev it is a 2 (two) transaction process: intentional to make it trully random
  function requestRandomWinner() external {}

  // 6.e.5: Public

  /// @notice Enter the lottery
  /// @dev Enter the lottery (paying entrance fee amount of ether defined in the constructor)
  function enterLottery() public payable {
    if (msg.value < i_entranceFee) {
      revert Lottery__NotEnoughEthEntered();
    }
    s_players.push(payable(msg.sender));
    // events
    // tip: emit event when updating a dynamic array or mapping
    // reference: https://docs.soliditylang.org/en/v0.8.13/introduction-to-smart-contracts.html#logs
    /** It is possible to store data in a specially indexed data structure that maps all the way up to the block level. 
        This feature called logs is used by Solidity in order to implement events. 
        Contracts cannot access log data after it has been created, 
        but they can be efficiently accessed from outside the blockchain. 
        Since some part of the log data is stored in bloom filters, 
        it is possible to search for this data in an efficient and cryptographically secure way, 
        so network peers that do not download the whole blockchain (so-called “light clients”) can still find these logs. */
    // eth_getLogs :: https://www.quicknode.com/docs/ethereum/eth_getLogs
    // tip for event naming: finction name reversed, i.e. lotteryEnter
    emit LotteryEnter(msg.sender);
  }

  // 6.e.6: Internal

  /// @notice process the random number
  /// @dev Words is a computer science term, but we can think this as random number
  function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {}

  // 6.e.7: Private

  // 6.e.8: View / Pure
  function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
  }

  function getPlayer(uint256 index) public view returns (address) {
    return s_players[index];
  }
}
