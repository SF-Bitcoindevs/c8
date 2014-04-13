var async = require('async'),
	bitcoin = require('bitcoinjs-lib'),
	Wallet = bitcoin.Wallet,
	crypto = bitcoin.Crypto,
	helloblock = require('helloblock-js')({
		network: 'testnet',
		debug: false
	});

console.log('1. Generate a hd wallet with a seed')
var seed = crypto.SHA256('some crazy random seed!!!');
var wallet = new Wallet(seed, {
	network: 'testnet'
});

console.log('2. Generate an address from the hd wallet: ')
var addr = wallet.generateAddress();

async.series([

	function(next) {
		console.log('3. Withdraw some Bitcoins to the address that we just generated: ', addr, '(so that we have some bitcoins to play with)')
		helloblock.faucet.withdraw(addr, 30000, next);
	},
	function(next) {
		console.log('4. Load up the unspents into wallet')
		helloblock.addresses.getUnspents(addr, function(err, resp, resource) {
			if (err) return next(err);
			resource.forEach(function(utxo) {
				var key = utxo.txHash + ":" + utxo.index
				wallet.outputs[key] = {
					receive: key,
					address: utxo.address,
					value: utxo.value
				}
			})
			next()
		})
	},
	function(next) {
		var randomAddress = 'mkmrA6fjVpneaFyvxbjbZM6w6TASG6zyjQ';
		console.log('5. Now Send some money to a random address:' + randomAddress)
		var rawTxHex = new Buffer(wallet.createTx('mkmrA6fjVpneaFyvxbjbZM6w6TASG6zyjQ', 10000).serialize()).toString('hex');
		helloblock.transactions.propagate(rawTxHex, function(err, resp, resource) {
			if (err) return next(err);
			console.log('6. Success! Now check out the transaction that we just sent from our bitcoin wallet:', 'https://test.helloblock.io/transactions/' + resource.txHash)
		})
		next()
	},

], function(err) {
	if (err) return console.error('uh huh, something went wrong: ', err);
})