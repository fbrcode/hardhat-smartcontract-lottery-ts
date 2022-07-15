import fs from 'fs';
import path from 'path';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { networkConfig } from '../helper-hardhat-config';
import { Console } from 'console';

const updateFrontend: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, network } = hre;
  const { log } = deployments;

  log(`Updating frontend contract for network: ${network.name}`);

  // if hardhat, use localhost generated files
  const chosenNetwork = network.name === 'hardhat' ? 'localhost' : network.name;

  // check if the source deployment folder exists
  const sourceDeploymentFolder = `${networkConfig.globalSettings.sourceDeploymentFolder}/${chosenNetwork}`;
  if (!fs.existsSync(sourceDeploymentFolder)) {
    console.log(`❌ Deployment folder does not exist: ${sourceDeploymentFolder}. Aborting...`);
    return;
  }

  // check if there is any json contract file in the deployment folder
  const contractFiles = fs
    .readdirSync(sourceDeploymentFolder)
    .filter((file) => path.extname(file).toLowerCase() === '.json');
  if (contractFiles.length === 0) {
    console.log(`❌ No contract files found in deployment folder: ${sourceDeploymentFolder}. Aborting...`);
    return;
  }

  // create the target folder if it does not exist
  const targetFrontendFolder = networkConfig.globalSettings.targetFrontendFolder;
  if (!fs.existsSync(targetFrontendFolder)) {
    console.log(`❌ Target folder does not exist: ${targetFrontendFolder}. Aborting...`);
    return;
  }

  // create target network folder if it does not exist
  const targetFrontendFolderNetwork = `${targetFrontendFolder}/${chosenNetwork}`;
  fs.existsSync(targetFrontendFolderNetwork) || fs.mkdirSync(targetFrontendFolderNetwork);

  // console.log(`Source contract deployment folder: ${sourceDeploymentFolder}`);
  // console.log(`Target frontend folder: ${targetFrontendFolderNetwork}`);

  // copy the contract files to the target folder
  contractFiles.forEach((file) => {
    const sourceFile = `${sourceDeploymentFolder}/${file}`;
    const targetFile = `${targetFrontendFolderNetwork}/${file}`;
    fs.copyFileSync(sourceFile, targetFile);
    console.log(` ✅ Copied ${sourceFile} to ${targetFile}`);
  });

  log(`Frontend Updated!`);
  log(`----------------------------------------------------------`);
};

export default updateFrontend;
updateFrontend.tags = ['all', 'frontend'];
