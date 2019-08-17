# Prerequirement

node v8.16

# Install

```
$ git clone https://scapital.backlog.com/git/STABLE_COIN/stable-coin.git
$ cd stable-coin
$ npm install -g truffle
$ npm install
```

# Deploy each network

## localhost network

### 1. Lunch ganache

https://www.trufflesuite.com/ganache

### 2. Migrate

#### Create empty file

Create following empty files at root directory.

.secret
.infurakey

#### migrate

```
$ truffle migrate
```

## Test network & Main network

### Prepare 

#### Create infura account

https://infura.io/dashboard

#### Create config files

Create following files under project root.

1. .secret (Mnemonic. You can create Mnemonic by tool for each network (ex. metamask))
2. .infurakey (Access key for infura for each network. You can get infura site after created account.)

### Ropsten Deploy

```
$ truffle deploy --reset --network ropsten
```

### Mainnet Deploy

```
$ truffle deploy --reset --network live
```

# Operation check

```
$ truffle console
truffle> StableTokenTimelock.deployed().then(i=>timelock=i)
truffle> StableToken.deployed().then(i=>instance=i)
truffle> let balance = await instance.balanceOf(timelock.address).then(b=>balance=b)
truffle> balance.toString()
```

## Transfer to address

```
truffle> let receiver = '0x8EA1d27E3ddC5Df291926615372Cff6F0105636E'
truffle> await timelock.transfer(receiver, '1000000000000000000')
truffle> let balance = await instance.balanceOf(receiver)
truffle> balance.toString()
```

## Relase

```
truffle> await timelock.release()
```

# Test

```
$ truffle test
```