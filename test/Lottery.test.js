const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Lottery Unit Tests", async function () {
      let lottery,
        lotteryContract,
        vrfCoordinatorV2Mock,
        lotteryEntranceFee,
        secondsInterval,
        player;
      const chainId = network.config.chainId;

      beforeEach(async () => {
        accounts = await ethers.getSigners();
        player = accounts[1];
        await deployments.fixture(["all"]);
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        lotteryContract = await ethers.getContract("Lottery");
        lottery = lotteryContract.connect(player);
        lotteryEntranceFee = await lottery.getEntranceFee();
        secondsInterval = await lottery.getSecondsInterval();
      });

      describe("constructor", function () {
        // note: ideally we should have one assert per it()
        it("initializes the lottery correctly", async function () {
          const lotteryState = await lottery.getLotteryState();
          assert.equal(lotteryState.toString(), "0");
          assert.equal(secondsInterval.toString(), networkConfig[chainId].secondsInterval);
        });
      });

      describe("enterLottery", function () {
        it("reverts when you don't pay enough", async function () {
          await expect(lottery.enterLottery()).to.be.revertedWith("Lottery__NotEnoughEthEntered()");
        });

        it("records players when they enter", async function () {
          await lottery.enterLottery({
            value: lotteryEntranceFee,
          });
          const contractPlayer = await lottery.getPlayer(0);
          assert.equal(player.address, contractPlayer);
        });

        it("emits event on enter", async function () {
          await expect(lottery.enterLottery({ value: lotteryEntranceFee })).to.emit(
            lottery,
            "LotteryEnter"
          );
        });

        it("doesn't allow entrance when lottery is calculating", async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          // to run performUpkeep enough time has to pass
          await network.provider.send("evm_increaseTime", [secondsInterval.toNumber() + 1]); // makes the local blockchain shift time ahead
          await network.provider.request({ method: "evm_mine", params: [] }); // mines one extra block
          // we pretend to be a chainlink keeper
          await lottery.performUpkeep([]);
          await expect(lottery.enterLottery({ value: lotteryEntranceFee })).to.be.revertedWith(
            "Lottery__NotOpen()"
          );
        });
      });

      describe("checkUpkeep", function () {
        it("returns false if people haven't sent any ETH", async function () {
          await network.provider.send("evm_increaseTime", [secondsInterval.toNumber() + 1]); // makes the local blockchain shift time ahead
          await network.provider.request({ method: "evm_mine", params: [] }); // mines one extra block
          // callStatic simulates the function call returns
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert(!upkeepNeeded);
        });

        it("returns false if lottery ins't open", async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [secondsInterval.toNumber() + 1]); // makes the local blockchain shift time ahead
          await network.provider.request({ method: "evm_mine", params: [] }); // mines one extra block
          await lottery.performUpkeep([]); // or await lottery.performUpkeep("0x");
          const lotteryState = await lottery.getLotteryState();
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]);
          assert.equal(lotteryState.toString(), "1");
          assert.equal(upkeepNeeded, false);
        });

        it("returns false if enough time hasn't passed", async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [secondsInterval.toNumber() - 1]); // makes the local blockchain shift time ahead
          await network.provider.request({ method: "evm_mine", params: [] }); // mines one extra block
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });

        it("returns true if enough time has passed, has players, eth, and is open", async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [secondsInterval.toNumber() + 1]); // makes the local blockchain shift time ahead
          await network.provider.request({ method: "evm_mine", params: [] }); // mines one extra block
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x");
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", function () {
        it("it can only run if checkUpkeep is true", async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [secondsInterval.toNumber() + 1]); // makes the local blockchain shift time ahead
          await network.provider.request({ method: "evm_mine", params: [] }); // mines one extra block
          const tx = await lottery.performUpkeep([]);
          assert(tx);
        });

        it("reverts if checkUpkeep is false", async function () {
          await expect(lottery.performUpkeep([])).to.be.revertedWith("Lottery__UpkeepNotValid");
        });

        it("updates the lottery state, emits an event, and calls the vrf coordinator", async function () {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [secondsInterval.toNumber() + 1]); // makes the local blockchain shift time ahead
          await network.provider.request({ method: "evm_mine", params: [] }); // mines one extra block
          const txResponse = await lottery.performUpkeep([]);
          const txReceipt = await txResponse.wait(1);
          const requestId = txReceipt.events[1].args.requestId; // [1] means the second event (the first [0] event is emitted by VRF coordinator contract)
          const lotteryState = await lottery.getLotteryState();
          assert(requestId.toNumber() > 0);
          assert(lotteryState.toString() == "1");
        });
      });

      describe("fulfillRandomWords", function () {
        beforeEach(async () => {
          await lottery.enterLottery({ value: lotteryEntranceFee });
          await network.provider.send("evm_increaseTime", [secondsInterval.toNumber() + 1]); // makes the local blockchain shift time ahead
          await network.provider.request({ method: "evm_mine", params: [] }); // mines one extra block
        });

        it("can only be called after performUpkeep", async function () {
          // request id = 0
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)
          ).to.be.revertedWith("nonexistent request");
          // request id = 1
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)
          ).to.be.revertedWith("nonexistent request");
        });

        /* listener event capture not working properly
        // recommendation to split it further (too many tests)
        it("picks a winner, resets the lottery, and sends money", async () => {
          const additionalEntrants = 3;
          const startingAccountIndex = 2; // deployer = 0 // player = 1
          // loop to add the additional entrants
          for (let i = startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++) {
            lottery = lotteryContract.connect(accounts[i]); // new instance of the lottery contract connected to player
            await lottery.enterLottery({ value: lotteryEntranceFee });
          }
          // keep note of the starting timestamp
          // const startingTimestamp = await lottery.getLastTimestamp();

          // call performUpkeep (mock being from chainlink keepers), which kick off fulfillRandomWords
          // fulfillRandomWords (mock being from chainlink vrf)
          // we will have to wait for the fulfillRandomWords to be called (setup a listener for WinnerPicked event [Promise])
          console.log("Init Promise");
          await new Promise(async (resolve, reject) => {
            // this is the listener for the event (when WinnerPicked event is emitted, resolve the promise)
            lottery.once("WinnerPicked", async () => {
              console.log("WinnerPicked event emitted!");
              try {
                // const recentWinner = await lottery.getRecentWinner();
                const lotteryState = await lottery.getLotteryState();
                // const lastTimestamp = await lottery.getLastTimestamp();
                // const numberOfPlayers = await lottery.getNumberOfPlayers();
                // assert.equal(numberOfPlayers.toString(), "0");
                assert.equal(lotteryState, 0);
                // assert(lastTimestamp > startingTimestamp);
                resolve();
              } catch (e) {
                // if any exception is thrown (even if it times out: defined in hardhat.config(.js/.ts))
                reject(e);
              }
            });
            // setting up the listener for the event
            // below, we will fire the event, and the listener will pick it up, and resolve the promise
            const tx = await lottery.performUpkeep("0x");
            const txReceipt = await tx.wait(1);
            // console.log("performUpkeep txReceipt request id: ", txReceipt.events[1].args.requestId);
            // console.log(JSON.stringify(lottery, null, 2));
            await vrfCoordinatorV2Mock.fulfillRandomWords(
              txReceipt.events[1].args.requestId, // [1] means the second event (the first [0] event is emitted by VRF coordinator contract)
              lottery.address
            );
          });
        });*/
      });
    });