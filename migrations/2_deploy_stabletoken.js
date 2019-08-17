const StableToken = artifacts.require('./StableToken.sol');
const TokenTimelock = artifacts.require('./StableTokenTimelock.sol');


module.exports = function(deployer, network, accounts) {
    const name = 'XUSB';
    const symbol = 'XUSB';
    const decimals = 2;
    const initSupply = web3.utils.toBN(1000000000*(10**decimals));
    const lockupSupply = web3.utils.toBN(700000000*(10**decimals));

    if (network == "ropsten") {
        var beneficiary = '0x3D6718B225034E6eA64bD3bB28C5BdfBc7782D99';
        var release = 1563202800; // Test 2019/07/16 00:00:00
    }
    else if (network == "live") {
        var beneficiary = '0xe01c2e9B138f67E199DDBc0A0CA2cB3787Ca35Ac';
        var release = 1569898800; // Test 2019/10/01 12:00:00
    } else {
        var beneficiary = '0x38a8946704f7744a58d32dda3195FD56aFA61684';
        var release = 32488758153; // Test 2999-07-12 16:02:33
    }

    return deployer.then( async () => {
        let token = await deployer.deploy(StableToken, name, symbol, decimals);
        let timelock = await deployer.deploy(TokenTimelock, token.address, beneficiary, release, lockupSupply);
        await token.mint(timelock.address, initSupply);
    });
}
