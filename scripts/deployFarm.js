const { BigNumber } = require('ethers')
const hre = require('hardhat')

async function main() {
	let user1 = '0x662546Dcc9f158a9ABb4d1c3B369B07bC67969D6'
	let user2 = '0x3A40066D1dC27d14C721e4135cF02DCb20C9AFE0'
	let user3 = '0x011EBb673b8e7e042C42121CCA062FB7b27BdCFE'
	
	const accounts = await hre.ethers.getSigners()
	const devAddress = accounts[1].address
	const opeAddress = accounts[2].address

	const Token = await hre.ethers.getContractFactory('KingKongToken')
	const kkt = await Token.deploy()
	await kkt.deployed()
	console.log('KKT deployed to:', kkt.address)
	
	await kkt.mint(accounts[0].address, m(200000))
	console.log('dev KKT balance:', d(await kkt.balanceOf(accounts[0].address)))
	console.log('KKT totalSupply:', d(await kkt.totalSupply()))

	await kkt.transfer(user1, m(50000), {gasLimit:BigNumber.from('8000000')})
	await kkt.transfer(user2, m(50000), {gasLimit:BigNumber.from('8000000')})
	await kkt.transfer(user3, m(50000), {gasLimit:BigNumber.from('8000000')})
	console.log('kkt transfer done')
	
	const MasterChef = await hre.ethers.getContractFactory('MasterChef')
	const chef = await MasterChef.deploy(kkt.address, devAddress, opeAddress, m(30), BigNumber.from(0))
	await chef.deployed()
	console.log('MasterChef deployed to:', chef.address)
	
	await kkt.transferOwnership(chef.address, {gasLimit:BigNumber.from('8000000')})
	console.log('KKT ownership transfer to MasterChef')
	
	await delay(10)
	console.log('MasterChef owner is:', await chef.owner())
	console.log('MasterChef dev is:', await chef.devaddr())
	console.log('MasterChef ope is:', await chef.opeaddr())

	console.log('done')
}

async function delay(sec) {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, sec * 1000);
    })
}

function m(num) {
    return BigNumber.from('1000000000000000000').mul(num)
}

function d(bn) {
    return bn.div('1000000000').toNumber() / 1000000000
}


main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error)
		process.exit(1)
	})