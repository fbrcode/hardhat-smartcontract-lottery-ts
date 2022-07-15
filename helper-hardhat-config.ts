import { ethers } from 'hardhat';

type NetworkConfig = {
  name: string;
  entranceFee: string;
  vrfCoordinator: string;
  gasLane: string;
  subscriptionId: string;
  callbackGasLimit: string;
  keepersUpdateIntervalSeconds: string;
  blockConfirmations: number;
};

type NetworkConfigGroup = {
  [key: number]: NetworkConfig;
  globalSettings: {
    sourceDeploymentFolder: string;
    targetFrontendFolder: string;
  };
};

export const networkConfig: NetworkConfigGroup = {
  globalSettings: {
    sourceDeploymentFolder: './deployments',
    targetFrontendFolder: '../nextjs-smartcontract-lottery-ts/constants',
  },
  31337: {
    name: 'hardhat',
    entranceFee: ethers.utils.parseEther('0.01').toString(),
    vrfCoordinator: '',
    gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
    subscriptionId: '',
    callbackGasLimit: '500000', // 500,000 gas
    keepersUpdateIntervalSeconds: '30',
    blockConfirmations: 1,
  },
  4: {
    name: 'rinkeby',
    entranceFee: ethers.utils.parseEther('0.01').toString(),
    vrfCoordinator: '0x6168499c0cFfCaCD319c818142124B7A15E857ab',
    gasLane: '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc',
    subscriptionId: '5959',
    callbackGasLimit: '500000', // 500,000 gas
    keepersUpdateIntervalSeconds: '30',
    blockConfirmations: 6,
  },
  137: {
    name: 'polygon',
    entranceFee: ethers.utils.parseEther('0.01').toString(),
    vrfCoordinator: '',
    gasLane: '0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f',
    subscriptionId: 'xxxx', // need to be created
    callbackGasLimit: '500000', // 500,000 gas
    keepersUpdateIntervalSeconds: '30',
    blockConfirmations: 6,
  },
};
