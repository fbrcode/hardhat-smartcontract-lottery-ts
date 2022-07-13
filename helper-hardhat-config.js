const { ethers } = require("hardhat");

const networkConfig = {
  default: {
    name: "hardhat",
    keepersUpdateIntervalSeconds: "30",
    blockConfirmations: 1,
  },
  31337: {
    name: "hardhat",
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    callbackGasLimit: "500000", // 500,000 gas
    keepersUpdateIntervalSeconds: "30",
    blockConfirmations: 1,
  },
  4: {
    name: "rinkeby",
    vrfCoordinator: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
    subscriptionId: "5959",
    callbackGasLimit: "500000", // 500,000 gas
    keepersUpdateIntervalSeconds: "30",
    blockConfirmations: 6,
  },
  137: {
    name: "polygon",
    ethUsdPriceFeed: "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
    entranceFee: ethers.utils.parseEther("0.01"),
    gasLane: "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    subscriptionId: "5959", // need to be created
    callbackGasLimit: "500000", // 500,000 gas
    keepersUpdateIntervalSeconds: "30",
    blockConfirmations: 6,
  },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
};
