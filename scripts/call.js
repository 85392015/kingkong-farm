const hre = require('hardhat')
const fs = require('fs')
const { BigNumber } = require('ethers')

const kktAAddress = '0xAc8cD27c2e74DfCCD8B01aeEF84aC47d1629C6b0'
const chefAAddress = '0x60c186Fc32f29906655Df54f2bB5E0f11C04a3c9'

async function main() {
    const accounts = await hre.ethers.getSigners()
    const devAddress = accounts[1].address

    let KKTabi = getAbi('./artifacts/contracts/KingKongToken.sol/KingKongToken.json')
    const kkt = new ethers.Contract(kktAAddress, KKTabi, accounts[1])

    let chefabi = getAbi('./artifacts/contracts/MasterChef.sol/MasterChef.json')
    const chef = new ethers.Contract(chefAAddress, chefabi, accounts[0])

    console.log('MasterChef owner is:', await chef.owner())  //okex会报错
	console.log('MasterChef dev is:', await chef.devaddr())  //okex会报错

    //一种token对应一个池子，不能重复开池子，否则会混乱
    let lpTokenAddress = kktAAddress
    await chef.add(m(1), lpTokenAddress, true)
    console.log('add pool')

    let poolLength = await chef.poolLength()
    console.log('poolLength:', poolLength.toNumber())
    if (poolLength == 0) {
        return
    }
    let pid = 0

    let pool = await chef.poolInfo(pid)
    console.log('pool:', pool.lpToken, d(pool.allocPoint), d(pool.accKKTPerShare), d(pool.lastRewardBlock))

    //投入池子
    await kkt.approve(chefAAddress, m(100))
    console.log('kkt.approve')
    await chef.connect(accounts[1]).deposit(pid, m(100), {gasLimit:BigNumber.from('8000000')})
    console.log('dev chef.deposit')
    
    let kktNum = d(await kkt.balanceOf(devAddress))
    console.log('dev KKT充值后余额', kktNum)

    console.log('done')
}


async function afterMoment() {
    const accounts = await hre.ethers.getSigners()
    const devAddress = accounts[1].address

    let KKTabi = getAbi('./artifacts/contracts/KingKongToken.sol/KingKongToken.json')
    const kkt = new ethers.Contract(kktAAddress, KKTabi, accounts[1])

    let chefabi = getAbi('./artifacts/contracts/MasterChef.sol/MasterChef.json')
    const chef = new ethers.Contract(chefAAddress, chefabi, accounts[1])

    let poolLength = await chef.poolLength()
    console.log('poolLength:', poolLength.toNumber())
    if (poolLength == 0) {
        return
    }
    let pid = 0

    let pool = await chef.poolInfo(pid)
    console.log('pool:', pool.lpToken, d(pool.allocPoint), d(pool.accKKTPerShare), d(pool.lastRewardBlock))

    // //挖矿收益
    let kktNum = d(await chef.pendingKKT(pid, devAddress))
    console.log('挖矿收益', kktNum)
    
    //提现
    await chef.withdraw(pid, m(100), {gasLimit:BigNumber.from('8000000')})
    console.log('提现')
    
    kktNum = d(await kkt.balanceOf(devAddress))
    console.log('KKT提现后余额', kktNum)

    console.log('done')
}


function getAbi(jsonPath) {
    let file = fs.readFileSync(jsonPath)
    let abi = JSON.parse(file.toString()).abi
    return abi
}


function m(num) {
    return BigNumber.from('1000000000000000000').mul(num)
}

function d(bn) {
    return bn.div('1000000000').toNumber() / 1000000000
}


afterMoment()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })