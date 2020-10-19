
class Crypton {
	static async QueryName(name) {
		return fetch("https://"+name+".elastos.name/info.json", { mode: "no-cors" })
  			.then(response => response.json())
			.then (result => {
				return result;
			});
	}

	static async QueryKey(name, key) {
		var addr = "https://"+name+".elastos.name/"+key;

		return fetch(addr, { mode: "no-cors" }).then(result => result.text());



	}

	constructor (abiArray, contractAddress, web3) {
		this._web3 = web3;
		this._contractAddress = contractAddress;
		this._contact = new this._web3.eth.Contract(abiArray, contractAddress);
	}

	async _init_account (force) {
		if (!force && this._account) return this._account;
		var pthis = this;

		if (window.ethereum) {
			return window.ethereum.request({ method: 'eth_requestAccounts' }).then(function(address) {
				if (address.length > 0)
					pthis._account = address[0];
	        });
        }

		return this._web3.eth.getAccounts()
			.then(function(accounts) {
				if (!accounts || accounts.length == 0)
					return "";
				if (!pthis._account || pthis._account != accounts[0]) {
					pthis._account = accounts[0];
				}
				return pthis._account.toLowerCase();
			});
	}

	async _generate_option (amount, abiData) {
		var pthis = this;
		return this._web3.eth.getGasPrice()
			.then(function(gasPrice) {
				var result = { to: pthis._contractAddress, from: pthis._account, gasPrice: '0x'+parseInt(gasPrice).toString(16), gas: '0x'+parseInt(1000000).toString(16), value:'0x0' };

				if (amount && parseFloat(amount) > 0)
					result.value = '0x'+parseInt(pthis._web3.utils.toWei(amount+"", "ether")).toString(16);
				if (abiData)
					result["data"] = abiData;

				return result;
			});
	}

	async getOwnerOfNameToken (name) {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		var tokenId = pthis._web3.utils.hexToNumberString("0x"+sha256(name));
        		return pthis._contact.methods.ownerOf(tokenId).call();
			})
			.catch(function(){
				return "";
			});
	}

	async getTokenNameCount () {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.totalSupply().call();
			})
			.catch(function(){
				return 0;
			});
	}

	async getNameTokens (start, end) {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.totalSupply().call();
			})
			.then(function(count) {
				var result = [];
				var pool = [];

				for (var i=start; i<count && (!end || i<end); i++) {
					(function(){
						var tokenid, owner, name, expiration, price;

						pool.push(pthis._contact.methods.tokenByIndex(i).call()
							.then(function(ret) {
								tokenid = ret;
								return pthis._contact.methods.ownerOf(tokenid).call();
							})
							.then(function(ret) {
								owner = ret;
								return pthis._contact.methods.tokenURI(tokenid).call();
							})
							.then(function(ret) {
								name = ret;
								return pthis._contact.methods.tokenExpiration(tokenid).call();
							})
							.then(function(ret) {
								expiration = ret;
								return pthis._contact.methods.tokenPrice(tokenid).call();
							})
							.then(function(ret) {
								price = ret;
								result.push({
									"tokenId": tokenid,
									"name": name,
									"owner": owner,
									"expiration": expiration,
									"price": pthis._web3.utils.fromWei(price, "ether")
								});
							}));
					})();
				}

				return Promise.all(pool).then(() =>{
					return result;
				});
			})
			.catch(function(){
				return [];
			});
	}

	async getOwnerNameTokens (address) {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.balanceOf(address).call();
			})
			.then(async function(count) {
				var result = [];
				var pool = [];

				for (var i=0; i<count; i++) {
					(function() {
						var tokenid, owner, name, expiration, price;

						pool.push(pthis._contact.methods.tokenOfOwnerByIndex(address, i).call()
							.then(function(ret) {
								tokenid = ret;
								return pthis._contact.methods.tokenURI(tokenid).call();
							})
							.then(function(ret) {
								name = ret;
								return pthis._contact.methods.tokenExpiration(tokenid).call();
							})
							.then(function(ret) {
								expiration = ret;
								return pthis._contact.methods.tokenPrice(tokenid).call();
							})
							.then(function(ret) {
								price = ret;
								result.push({
									"tokenId": tokenid,
									"name": name,
									"owner": owner,
									"expiration": expiration,
									"price": pthis._web3.utils.fromWei(price, "ether")
								});
							}));
					})();
				}
				return Promise.all(pool).then(() =>{
					return result;
				});
			})
			.catch(function(){
				return [];
			});
	}

	async getContractOwner () {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.owner().call();
			})
			.catch(function(){
				return "";
			});
	}

	async getImplementContract () {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.implementation_slot().call();
			})
			.catch(function(){
				return "";
			});
	}

	async getCurrentPrice (level) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				if (level == 1) {
					return pthis._contact.methods.price_level1().call();
				}
				else if (level == 2) {
					return pthis._contact.methods.price_level2().call();
				}
				else if (level == 3) {
					return pthis._contact.methods.price_level3().call();
				}
			})
			.then(function(x) {
				return pthis._web3.utils.fromWei(x, "ether");
			})
			.catch(function(err){
				return -1;
			});
	}

	async getRenewalPrice (level) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				if (level == 1) {
					return pthis._contact.methods.renewal_level1().call();
				}
				else if (level == 2) {
					return pthis._contact.methods.renewal_level2().call();
				}
				else if (level == 3) {
					return pthis._contact.methods.renewal_level3().call();
				}
			})
			.then(function(x) {
				return pthis._web3.utils.fromWei(x, "ether");
			})
			.catch(function(){
				return -1;
			});
	}

	async getNamesCount (level) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				if (level == 1) {
					return pthis._contact.methods.count_level1().call();
				}
				else if (level == 2) {
					return pthis._contact.methods.count_level2().call();
				}
				else if (level == 3) {
					return pthis._contact.methods.count_level3().call();
				}
			})
			.then(function(x) {
				return pthis._web3.utils.fromWei(x, "ether");
			})
			.catch(function(){
				return -1;
			});
	}

	async getExpiration (name) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				var tokenId = pthis._web3.utils.hexToNumberString("0x"+sha256(name));
				return pthis._contact.methods.tokenExpiration(tokenId).call();
			})
			.catch(function(){
				return -1;
			});
	}

	async transfer (to, name) {
		var pthis = this;
		var abiData = this._contact.methods.transfer(pthis._account, to, name).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis._generate_option("0.1", abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async renew (to, name) {
		var pthis = this;
		var abiData = this._contact.methods.renewToken(pthis._account, to, name).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis.getRenewalPrice(name);
			})
			.then(function(price) {
				return pthis._generate_option(price, abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async registerName (name, price) {
		var pthis = this;
		var abiData = this._contact.methods.externalMint(name).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis._generate_option(price, abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async generateName (to, name) {
		var pthis = this;
		var abiData = this._contact.methods.mint(to, name).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis._generate_option(0, abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async approveName (to, name) {
		var pthis = this;
		var tokenId = pthis._web3.utils.hexToNumberString("0x"+sha256(name));
		var abiData = this._contact.methods.approve(to, tokenId).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis._generate_option(0, abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async recycleToken (name) {
		var pthis = this;
		var abiData = this._contact.methods.recycleToken(name).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis._generate_option(0, abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async setBasicInfo (name, btc, eth, ela, did, pubkey) {
		var pthis = this;
		var abiData = this._contact.methods.setBasicInfo(name, btc, eth, ela, did, pubkey).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis._generate_option(0, abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async setKeyword (name, key, value) {
		var pthis = this;
		var abiData = this._contact.methods.setKeyword(window.cryptoName, key, value).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis._generate_option(0, abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async removeKeyword (name, key) {
		var pthis = this;
		var abiData = this._contact.methods.removeKeyword(name, key).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis._generate_option(0, abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async withdraw (value) {
		var pthis = this;
		var abiData = this._contact.methods.withdraw(value).encodeABI();
		return this._init_account()
			.then(function() {
				return pthis._generate_option(0, abiData);
			})
			.then(function(option) {
				if (window.ethereum) {
					window.ethereum.request({ method: 'eth_sendTransaction', params: [option] });
					//.then(console.log).catch(err=>console.log);
			    }
			    else {
			    	reject("Not found ethereum.");
			    }
			});
	}

	async getKeyword (name, key) {
		var pthis = this;
		return this._init_account()
			.then(function(option) {
				return pthis._contact.methods.getKeyword(name, key).call();
			});
	}

	async getAllKeywords (name) {
		var pthis = this;
		return this._init_account()
			.then(function(option) {
				return pthis._contact.methods.getAllKeywords(name).call();
			});
	}

	async getNameProfile (name) {
		var nameInfo = {"name": name};
		var pthis = this;
		return this._init_account()
			.then(function(option) {
				return pthis._contact.methods.getAllKeywords(name).call();
			})
			.then (function(value) {
				var keys = value.split(",");

				var promises = [];

				for (var key of keys) {
				
					(function(k) {
						promises.push(pthis.getKeyword(name, k).then(function(v) {
							nameInfo[k] = v;
						}));
					})(key);
				}
				return Promise.all(promises);
			})
			.then (function (ret) {
				return nameInfo;
			});
	}

};