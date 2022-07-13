const { ethers } = require("hardhat");

const networkConfig = {
  4: {
    name: "rinkeby",
    vrfCoordinator: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    subscriptionId: "5959",
    callbackGasLimit: "500000", // 500,000 gas
    secondsInterval: "30",
  },
  137: {
    name: "polygon",
    ethUsdPriceFeed: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    subscriptionId: "5959", // need to be created
    callbackGasLimit: "500000", // 500,000 gas
    secondsInterval: "30",
  },
  31337: {
    name: "hardhat",
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    callbackGasLimit: "500000", // 500,000 gas
    secondsInterval: "30",
  },
};

const developmentChains = ["hardhat", "localhost"];

// fixed constants for MockVrfCoordinator
const MOCK_BASE_FEE = ethers.utils.parseEther("0.25"); // 0.25 LINK per request (premium)
const MOCK_GAS_PRICE_LINK = 1e9; // 1 GWEI per LINK
const MOCK_VRF_SUB_FUND_AMOUNT = "2"; // 2 LINK

module.exports = {
  networkConfig,
  developmentChains,
  MOCK_BASE_FEE,
  MOCK_GAS_PRICE_LINK,
  MOCK_VRF_SUB_FUND_AMOUNT,
};
