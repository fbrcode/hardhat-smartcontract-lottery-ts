// import { ethers } from "hardhat";
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const MOCK_BASE_FEE = '250000000000000000'; // 0.25 is this the premium in LINK?
const MOCK_GAS_PRICE_LINK = 1e9; // link per gas, is this the gas lane? // 0.000000001 LINK per gas

const deployMocks: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  if (chainId == 31337) {
    log(`Deploying mocks on network: ${network.name}`);
    // deploy a mock vrf coordinator
    await deploy('VRFCoordinatorV2Mock', {
      from: deployer,
      args: [MOCK_BASE_FEE, MOCK_GAS_PRICE_LINK],
      log: true,
    });
    log(`Mocks Deployed!`);
    log(`----------------------------------------------------------`);
  }
};

export default deployMocks;
deployMocks.tags = ['all', 'mocks'];
