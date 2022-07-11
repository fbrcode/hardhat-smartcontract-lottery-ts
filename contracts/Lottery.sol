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
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/KeeperCompatibleInterface.sol";

// 3: Interfaces (none in this case)
// 4: Libraries (none in this case)

// 5: Errors
error Lottery__NotEnoughEthEntered();
error Lottery__TransferFailed();
error Lottery__NotOpen();

// 6: Contracts

contract Lottery is VRFConsumerBaseV2, KeeperCompatibleInterface {
  // 6.a: Type declarations
  enum LotteryState {
    OPEN,
    CALCULATING
  } // Behind the scenes, we are doing: uint256 where 0 = OPEN, 1 = CALCULATING

  // 6.b: State variables
  uint256 private immutable i_entranceFee;
  address payable[] private s_players;
  VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
  bytes32 private immutable i_gasLane;
  uint64 private immutable i_subscriptionId;
  uint32 private immutable i_callbackGasLimit;
  uint16 private constant REQUEST_CONFIRMATIONS = 3;
  uint32 private constant NUMBER_WORDS = 1;

  // Lottery variables
  address private s_recentWinner; // The last winner of the lottery
  LotteryState private s_lotteryState; // 0 = OPEN, 1 = CALCULATING
  uint256 private s_lastTimestamp; // timestamp of the last lottery draw
  uint256 private immutable i_secondsInterval; // how many seconds between each lottery draw

  // 6.c: Events
  event LotteryEnter(address indexed player);
  event RequestedLotteryWinner(uint256 indexed requestId);
  event WinnerPicked(address indexed winner);

  // 6.d: Modifiers
  // 6.e: Functions

  // 6.e.1: Constructor
  constructor(
    address vrfCoordinatorV2,
    uint256 entranceFee,
    bytes32 gasLane,
    uint64 subscriptionId,
    uint32 callbackGasLimit,
    uint256 secondsInterval
  ) VRFConsumerBaseV2(vrfCoordinatorV2) {
    i_entranceFee = entranceFee;
    i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
    i_gasLane = gasLane;
    i_subscriptionId = subscriptionId;
    i_callbackGasLimit = callbackGasLimit;
    s_lotteryState = LotteryState.OPEN; // Initial state is OPEN
    s_lastTimestamp = block.timestamp; // Initialize the last timestamp to the current block timestamp
    i_secondsInterval = secondsInterval; // Initialize the seconds interval to the given value
  }

  // 6.e.2: Receive
  // 6.e.3: Fallback

  // 6.e.4: External

  /// @notice Request a random winner
  /// @dev Request a random winner (verifiably random) and automatically run through Chainlink Keepers
  /// @dev https://docs.chain.link/docs/chainlink-keepers/introduction/
  /// @dev Step 1 : request the random number
  /// @dev Step 2 : once we get it, do something with it
  /// @dev it is a 2 (two) transaction process: intentional to make it trully random
  function requestRandomWinner() external {
    if (s_lotteryState != LotteryState.OPEN) {
      revert Lottery__NotOpen();
    }
    s_lotteryState = LotteryState.CALCULATING;
    uint256 requestId = i_vrfCoordinator.requestRandomWords(
      i_gasLane, // The gas lane key hash value, which is the maximum gas price you are willing to pay for a request in wei. It functions as an ID of the off-chain VRF job that runs in response to requests.
      i_subscriptionId, // subscription ID that this contract uses for funding requests.
      REQUEST_CONFIRMATIONS, // how many confirmations the Chainlink node should wait before responding. The longer the node waits, the more secure the random value is. It must be greater than the minimumRequestBlockConfirmations limit on the coordinator contract.
      i_callbackGasLimit, // limit for how much gas to use for the callback request to your contract's fulfillRandomWords() function. It must be less than the maxGasLimit limit on the coordinator contract.
      NUMBER_WORDS // many random values to request. If you can use several random values in a single callback, you can reduce the amount of gas that you spend per random value.
    );
    emit RequestedLotteryWinner(requestId);
  }

  /// @notice Verify if time enoug has passed to select another winner
  /// @dev Function that Chainlink Keeper nodes call
  /// They look for the `upKeepNeeded` to return true
  /// The following should be true in order to return true:
  /// 1. Our time interval should have passed
  /// 2. The lottery should have at least one player, and have some ETH
  /// 3. Our subscription is funded with LINK
  /// 4. The lottery should be in an "open" state
  /// Note: block.timestamp = returns the current timestamp of the blockchain
  function checkUpkeep(
    bytes calldata /* checkData */ // espeficy any kind of data or even other functions
  )
    external
    view
    override
    returns (
      bool upkeepNeeded,
      bytes memory /* performData */
    )
  {
    bool isOpen = LotteryState.OPEN == s_lotteryState;
    bool hasEnoughTimePassed = (block.timestamp - s_lastTimestamp) > i_secondsInterval;
    bool hasEnoughPlayers = s_players.length > 0;
    bool hasEnoughEth = address(this).balance > i_entranceFee;
    upkeepNeeded = isOpen && hasEnoughTimePassed && hasEnoughPlayers && hasEnoughEth;
    // automatically returns since the variable is declared on function scope
  }

  function performUpkeep(
    bytes calldata /* performData */
  ) external override {}

  // 6.e.5: Public

  /// @notice Enter the lottery
  /// @dev Enter the lottery (paying entrance fee amount of ether defined in the constructor)
  function enterLottery() public payable {
    if (msg.value < i_entranceFee) {
      revert Lottery__NotEnoughEthEntered();
    }
    if (s_lotteryState != LotteryState.OPEN) {
      revert Lottery__NotOpen();
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
  /// @dev use the modulo operation (%) to calculate the winner among the players array
  /// param requestId Identifies the request made to the coordinator to get the random number (not used in this case).
  /// @param randomWords The random number array wich in this case is fixed to 1 word (number).
  function fulfillRandomWords(
    uint256, /*requestId*/
    uint256[] memory randomWords
  ) internal override {
    uint256 indexOdWinner = randomWords[0] % s_players.length;
    address payable recentWinner = s_players[indexOdWinner];
    s_recentWinner = recentWinner;
    s_lotteryState = LotteryState.OPEN;
    s_players = new address payable[](0); // reset the players array
    // send all contract balance to the winner
    (bool success, ) = recentWinner.call{value: address(this).balance}("");
    if (!success) {
      revert Lottery__TransferFailed();
    }
    emit WinnerPicked(recentWinner);
  }

  // 6.e.7: Private

  // 6.e.8: View / Pure
  function getEntranceFee() public view returns (uint256) {
    return i_entranceFee;
  }

  function getPlayer(uint256 index) public view returns (address) {
    return s_players[index];
  }

  function getRecentWinner() public view returns (address) {
    return s_recentWinner;
  }
}
