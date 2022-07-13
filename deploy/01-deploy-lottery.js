const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
  MOCK_VRF_SUB_FUND_AMOUNT,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
require("dotenv").config();

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  let vrfCoordinatorV2Address, subscriptionId;

  log(`Deploying lottery on network: ${network.name}`);
  if (developmentChains.includes(network.name)) {
    try {
      const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
      vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
      // extract subscription id from the mocked contract
      const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
      const transactionReceipt = await transactionResponse.wait(1);
      subscriptionId = transactionReceipt.events[0].args.subId;
      // in a real contract / network, we need to fund the subscription
      // you would need the link token on a real network
      await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, MOCK_VRF_SUB_FUND_AMOUNT);
    } catch (error) {
      log(error);
    }
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinator;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  // check if the vrf coordinator is deployed already before deploying the lottery
  if (!vrfCoordinatorV2Address) {
    log(
      `No VRF coordinator address found for chain: ${chainId}. \nFor local chains the mock needs to be executed before deploying the lottery contract.`
    );
    return;
  }
  log(`VRF coordinator address: ${vrfCoordinatorV2Address}`);

  const entranceFee = networkConfig[chainId].entranceFee;
  const gasLane = networkConfig[chainId].gasLane;
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
  const keepersUpdateIntervalSeconds = networkConfig[chainId].keepersUpdateIntervalSeconds;

  const args = [
    vrfCoordinatorV2Address,
    entranceFee,
    gasLane,
    subscriptionId,
    callbackGasLimit,
    keepersUpdateIntervalSeconds,
  ];
  const lottery = await deploy("Lottery", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });
  log(`Lottery deployed at ${lottery.address}`);

  if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    log(`Verifying contract "${lottery.address}" with args [${args}]...`);
    await verify(lottery.address, args);
  }
  log(`Lottery Deployed!`);
  log(`----------------------------------------------------------`);
};

module.exports.tags = ["all", "lottery"];
