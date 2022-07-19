import { BigNumber } from 'ethers';
import { ethers, network } from 'hardhat';
import { Lottery, VRFConsumerBaseV2__factory, VRFCoordinatorV2Mock } from '../typechain-types';

// reproduce keepers automation and the recent winner call on a local network

const mockKeepers = async () => {
  const lottery: Lottery = await ethers.getContract('Lottery');
  const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(''));
  const { upkeepNeeded } = await lottery.callStatic.checkUpkeep(checkData);
  if (upkeepNeeded) {
    console.log('Upkeep needed, running upkeep... 🚀');
    const tx = await lottery.performUpkeep(checkData);
    const txReceipt = await tx.wait(1);
    const requestId = txReceipt.events![1].args!.requestId;
    console.log(`Upkeep done! ✅ RequestId: ${requestId}`);
    if (network.config.chainId === 31337) {
      await mockVrf(requestId, lottery);
    }
    console.log('✅ Done Upkeep!');
  } else {
    console.log('Upkeep not needed, skipping...');
  }
};

const mockVrf = async (requestId: BigNumber, lottery: Lottery) => {
  console.log(`Mocking VRF for requestId: ${requestId.toString()}`);
  const vrf: VRFCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock');
  await vrf.fulfillRandomWords(requestId, lottery.address);
  console.log(`✅ Done VRF!`);
  const recentWinner = await lottery.getRecentWinner();
  console.log(`The winner is: ${recentWinner}`);
};

mockKeepers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
