const { developmentChains, MOCK_BASE_FEE, MOCK_GAS_PRICE_LINK } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    if (developmentChains.includes(network.name)) {
        log(`Deploying mocks on local network: ${network.name}`)
        // deploy a mock vrf coordinator
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            args: [MOCK_BASE_FEE, MOCK_GAS_PRICE_LINK],
            logs: true,
        })
        log(`Mocks Deployed!`)
        log(`----------------------------------------------------------`)
    }
}

module.exports.tags = ["all", "mocks"]
