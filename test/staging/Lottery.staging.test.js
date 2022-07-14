/** Steps to test in staging (testnet):
 * 1. Get our Subscription ID from the Chainlink VRF --> https://vrf.chain.link/rinkeby/5959 (wallet: 0x3c0F7398ae33e10c688F9a045283D8108f98ec40)
 * 1b. Update the Subscription ID in the helper-hardhat.js file for rinkeby
 * 2. Deploy our contract using the Subscription ID --> rinkeby deploy cmd: yarn hardhat deploy --network rinkeby
 * 2c. Check the deployment transaction and verification --> https://rinkeby.etherscan.io/tx/0xea6dd2f936e21216719a28faf56596fe5c9db89b86142c9be66011a306e8487f / https://rinkeby.etherscan.io/address/0x08079D26743d5ef2C12033a5992A890A01d2dF0d#code
 * 2c. Grab the contract address --> rinkeby lottery contract address: 0x08079D26743d5ef2C12033a5992A890A01d2dF0d  (VRF coordinator address: 0x6168499c0cFfCaCD319c818142124B7A15E857ab)
 * 3. Register the contract with the Chainlink VRF and its Subscription ID
 * 4. Register the contract with the Chainlink Keepers
 * 5. Run staging tests:
 */

const { getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name)
  ? describe.skip
  : describe("Lottery Staging Tests", () => {
      let lottery, lotteryEntranceFee, deployer;

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        if (!deployer) throw new Error("❌ No deployer account found 🥺");
        lottery = await ethers.getContract("Lottery", deployer);
        lotteryEntranceFee = await lottery.getEntranceFee();
      });

      describe("fulfillRandomWords", () => {
        it("works with live chainlink keepers and chainlink VRF, we get a random winner", async () => {
          // we only have to enter the lottery and the process will kick off
          const startingTimestamp = await lottery.getLastTimestamp();
          const accounts = await ethers.getSigners();
          console.log(`\t 🔍 Using signer account address: ${accounts[0].address}`);
          console.log(`\t 🔍 Target lottery contract address: ${lottery.address}`);
          console.log(`\t 🔍 Lottery entrance fee (ETH): ${ethers.utils.formatEther(lotteryEntranceFee)}`);
          // setup the listener before entering the lottery (just in case the blockchain moves really fast)...
          console.log("\t Initiate event listener... 👂");
          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              console.log("\t 🏆 'WinnerPicked' event emitted!");
              try {
                // add the assertions here
                const recentWinner = await lottery.getRecentWinner();
                const lotteryState = await lottery.getLotteryState();
                const winnerEndingBalance = await accounts[0].getBalance(); // single connected account
                const lastTimestamp = await lottery.getLastTimestamp();
                await expect(lottery.getPlayer(0)).to.be.reverted;
                assert.equal(recentWinner.toString(), accounts[0].address);
                assert.equal(lotteryState, 0);
                assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(lotteryEntranceFee).toString());
                assert(lastTimestamp.gt(startingTimestamp));
                resolve();
              } catch (error) {
                console.log(error);
                reject(error);
              }
            });
            // ... then entering the lottery
            console.log("\t Entering the lottery... 🎉");
            const tx = await lottery.enterLottery({ value: lotteryEntranceFee });
            await tx.wait(1);
            console.log("\t 🚀 Entered the lottery! Now waiting for event call ⏳ ...");

            const winnerStartingBalance = await accounts[0].getBalance(); // single connected account
            // wait for the event to be emitted to finish the code execution with resolve or reject callbacks (might be timeout reject)
          });
        });
      });
    });
