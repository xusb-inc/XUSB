const { BN, expectRevert, time } = require('openzeppelin-test-helpers');

const { expect } = require('chai');

const StableToken = artifacts.require('./StableToken.sol');
const TokenTimelock = artifacts.require('./StableTokenTimelock.sol');

contract('StableTokenTimelock', accounts => {
    // it('...should put 100ST in the first account.', async () => {
    //     //コントラクトのインスタンスを取得
    //     const StableTokenInstance = await StableToken.deployed();

    //     //account[0]のトークンの残高を取得
    //     let balance = await StableTokenInstance.balanceOf(accounts[0]);
    //     //桁数が大きいのでether単位(10^18)に変換
    //     balance = web3.utils.fromWei(balance, 'ether');

    //     //残高数と数字100を比較
    //     //同じであれば合格
    //     assert.equal(balance, 100, 'First account do not have 100 ST.');
    // });

    context('with StableTokenTimelock', function () {

        const name = 'XUSB';
        const symbol = 'XUSB';
        const decimals = 2;

        const initSupply = new BN(100);
        const lockupSupply = new BN(70);
        const supplyer = accounts[1];
        const beneficiary = accounts[2];
        const receiver = accounts[3];
        const other = accounts[4];

        beforeEach(async function () {
            // this.token = await StableToken.new(name, symbol, decimals, initSupply, { from: supplyer });
            this.token = await StableToken.new(name, symbol, decimals, { from: supplyer });
        });

        it('rejects a release time in the past', async function () {
            // const token = await StableToken.new(name, symbol, decimals, initSupply, { from: supplyer });
            const pastReleaseTime = (await time.latest()).sub(time.duration.years(1));
            await expectRevert(
              TokenTimelock.new(this.token.address, beneficiary, pastReleaseTime, lockupSupply),
              'TokenTimelock: release time is before current time'
            );
        });

        context('once deployed', function () {
            beforeEach(async function () {
                this.releaseTime = (await time.latest()).add(time.duration.years(1));
                this.timelock = await TokenTimelock.new(this.token.address, beneficiary, this.releaseTime, lockupSupply);
                await this.token.mint(this.timelock.address, initSupply, { from: supplyer });
            });
      
            it('can get state', async function () {
                expect(await this.timelock.token()).to.equal(this.token.address);
                expect(await this.timelock.beneficiary()).to.equal(beneficiary);
                expect(await this.timelock.releaseTime()).to.be.bignumber.equal(this.releaseTime);
            });
      
            it('can be transfered amount within lockup supply before time limit', async function () {
                const remainingAmount = initSupply.sub(lockupSupply);
                await this.timelock.transfer(receiver, remainingAmount);
                expect(await this.token.balanceOf(this.timelock.address)).to.be.bignumber.equal(lockupSupply);
                expect(await this.token.balanceOf(receiver)).to.be.bignumber.equal(remainingAmount);
            });

            it('cannot be transfered amount over lockup supply before time limit', async function () {
                const remainingAmount = initSupply.sub(lockupSupply);
                const transferAmount = remainingAmount.add(new BN('1'));
                await expectRevert(this.timelock.transfer(receiver, transferAmount), 'StableTokenTimelock: Insufficient funds');
            });

            it('cannot be transfered by Non-owner address before time limit', async function () {
                await expectRevert(this.timelock.transfer(receiver, new BN('1'), { from: other }), 'Returned error: VM Exception while processing transaction: revert Ownable: caller is not the owner -- Reason given: Ownable: caller is not the owner.');
            });

            it('cannot be released before time limit', async function () {
                await expectRevert(this.timelock.release(), 'TokenTimelock: current time is before release time');
            });
    
            it('cannot be released just before time limit', async function () {
                await time.increaseTo(this.releaseTime.sub(time.duration.seconds(3)));
                await expectRevert(this.timelock.release(), 'TokenTimelock: current time is before release time');
            });
    
            it('can be released just after limit', async function () {
                await time.increaseTo(this.releaseTime.add(time.duration.seconds(1)));
                await this.timelock.release();
                expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(initSupply);
            });
    
            it('can be released after time limit', async function () {
                await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
                await this.timelock.release();
                expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(initSupply);
            });
    
            it('cannot be released twice', async function () {
                await time.increaseTo(this.releaseTime.add(time.duration.years(1)));
                await this.timelock.release();
                await expectRevert(this.timelock.release(), 'TokenTimelock: no tokens to release');
                expect(await this.token.balanceOf(beneficiary)).to.be.bignumber.equal(initSupply);
            });
        });
    });
});