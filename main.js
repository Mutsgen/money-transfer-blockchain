import abi from "./abi.js";

const contractAddress = "0xb5b9133a20EfD0b62C423Fd978bCde6be30d2200";

let web3, contractInstanse, account, accountRole;

function network() {
	web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:7545"));
	contractInstanse = new web3.eth.Contract(abi, contractAddress);
	console.log("Connected successfully!");
}
network();

async function getBalance(account) {
	let balance = await web3.eth.getBalance(account);
	balance = await web3.utils.fromWei(balance, "ether");
	let accountBalanceLab = document.querySelector(".account-balance");
	accountBalanceLab.innerHTML = `Balance: ${balance} eth`;
}

// REGISTRATION
let btnReg = document.querySelector(".regBtn");
btnReg.addEventListener("click", async (e) => {
	e.preventDefault();

	let addressAuthInp = document.querySelector(".authAddress");
	let addressValue = addressAuthInp.value;
	let passwordAuthInp = document.querySelector(".authPassword");
	let passwordValue = web3.utils.soliditySha3({
		type: "string",
		value: passwordAuthInp.value,
	});

	await contractInstanse.methods
		.registration(addressValue, passwordValue)
		.send({ from: addressValue }, function (error, result) {
			console.log("registration error: ", error);
			console.log("result: ", result);
			if (error === null) {
				alert("You have successfully registered!");
			}
		});
});

//LOGIN
let btnLogin = document.querySelector(".login");
btnLogin.addEventListener("click", async (event) => {
	event.preventDefault();
	let addressAuthInp = document.querySelector(".authAddress");
	let addressValue = addressAuthInp.value;
	let passwordAuthInp = document.querySelector(".authPassword");
	let passwordValue = web3.utils.soliditySha3({
		type: "string",
		value: passwordAuthInp.value,
	});

	try {
		let resp = await contractInstanse.methods
			.auth(addressValue, passwordValue)
			.call({ from: addressValue }, function (error, result) {
				console.log("registration error: ", error);
				console.log("result: ", result);
			});
		if (resp == true) {
			let modalAuth = document.querySelector("#modal-auth");
			account = addressValue;
			accountRole = await contractInstanse.methods
				.showRole(account)
				.call({ from: account });
			console.log(accountRole);
			modalAuth.style.display = "none";
			localStorage.setItem(
				"accountinfo",
				JSON.stringify({ account, accountRole })
			);
			passwordAuthInp.value = "";
			main();
		}
	} catch (error) {
		alert(error.name);
	}
});

async function main() {
	let modalAuth = document.querySelector("#modal-auth");
	if (JSON.parse(localStorage.getItem("accountinfo")) != undefined) {
		let accInfo = JSON.parse(localStorage.getItem("accountinfo"));
		account = accInfo.account;
		accountRole = accInfo.accountRole;
	} else {
		modalAuth.style.display = "flex";
	}

	let accountAddressLab = document.querySelector(".account-address");
	accountAddressLab.innerHTML = `Address: ${account}`;

	let accountRoleLab = document.querySelector(".account-role");
	accountRoleLab.innerHTML = `Role: ${accountRole == 1 ? "admin" : "user"}`;

	let createTransferBtn = document.querySelector(".create-transfer");
	createTransferBtn.addEventListener("click", createTransfer);

	let exitBtn = document.querySelector(".exit");
	exitBtn.addEventListener("click", () => {
		console.log(21);
		localStorage.removeItem("accountinfo");
		modalAuth.style.display = "flex";
	});

	getBalance(account);
	renderHistory(await getTransactions());
}
main();

async function createTransfer() {
	let modal = document.querySelector("#modal-create-transfer");
	modal.style.display = "flex";
	let close = document.querySelector(".close-modal");
	let transfer = document.querySelector(".transfer");
	let safeTransferBtn = document.querySelector(".safe-transfer");
	let categoriesSelect = document.querySelector("#category");
	let patternsSelect = document.querySelector("#pattern");
	let recieverInp = document.querySelector(".reciever");
	let amountMoneyInp = document.querySelector(".money");
	let codewordInp = document.querySelector(".codeword");
	let safeTransfer = false;
	let currentCategory, currentPattern;
	let categories = await contractInstanse.methods
		.showCategories()
		.call({ from: account });
	let patterns = await contractInstanse.methods
		.showPatterns()
		.call({ from: account });

	close.addEventListener("click", () => {
		modal.style.display = "none";
	});

	categoriesSelect.innerHTML = "<option value=''>Select category</option>";
	for (let elem of categories) {
		let opt = document.createElement("option");
		opt.innerHTML = elem[1];
		opt.value = elem[0];
		categoriesSelect.append(opt);
	}

	categoriesSelect.addEventListener("change", (event) => {
		currentCategory = event.target.value;
		patternsSelect.innerHTML = "<option value=''>...</option>";
		let currentPatternId = -1;
		for (let elem of patterns) {
			currentPatternId++;
			if (elem[0] == currentCategory) {
				let opt = document.createElement("option");
				opt.innerHTML = `${elem[1]}: ${elem[2]} coins`;
				opt.value = currentPatternId;
				patternsSelect.append(opt);
			}
		}
	});

	patternsSelect.addEventListener("change", (event) => {
		currentPattern = patterns[event.target.value];
		amountMoneyInp.value = currentPattern ? currentPattern[2] : "";
	});

	safeTransferBtn.addEventListener("click", () => {
		if (safeTransfer == false) {
			safeTransfer = true;
		} else {
			safeTransfer = false;
		}
	});

	transfer.onclick = async (event) => {
		event.preventDefault();
		let to = recieverInp.value;
		let money = web3.utils.toWei(amountMoneyInp.value, "wei");
		let codeword = await web3.utils.soliditySha3({
			type: "string",
			value: codewordInp.value,
		});
		try {
			await contractInstanse.methods
				.createTransaction(
					to,
					money,
					codeword,
					currentCategory,
					safeTransfer
				)
				.send({ value: money, from: account, gas: "6721975" });
			alert("Transaction succesfully created");
			getBalance(account);
			renderHistory(await getTransactions());
		} catch (err) {
			console.log(err.message);
			getBalance(account);
		}
	};
}

async function getTransactions() {
	let transactions = await contractInstanse.methods
		.showTransactions()
		.call({ from: account });
	return transactions;
}

function renderHistory(array) {
	let ul = document.querySelector(".content-list");
	ul.innerHTML = "";
	let typeSelector = document.querySelector(".history-type");

	for (let elem of array) {
		if (elem[0] == account || elem[1] == account) {
			renderHistoryElem(elem);
		}
	}

	typeSelector.addEventListener("change", (e) => {
		let type = e.target.value;
		ul.innerHTML = "";
		switch (type) {
			case "all":
				for (let elem of array) {
					if (elem[0] == account || elem[1] == account) {
						renderHistoryElem(elem);
					}
				}
				break;
			case "in":
				for (let elem of array) {
					if (elem[1] == account) {
						renderHistoryElem(elem);
					}
				}
				break;
			case "out":
				for (let elem of array) {
					if (elem[0] == account) {
						renderHistoryElem(elem);
					}
				}
				break;
		}
	});
}

async function renderHistoryElem(elem) {
	let categories = await contractInstanse.methods
		.showCategories()
		.call({ from: account });
	let ul = document.querySelector(".content-list");
	let li = document.createElement("li");
	li.classList.add("content-elem");
	li.innerHTML = `
	<div class="content">
		<p>From: ${elem[0]}</p>
		<p>To: ${elem[1]}</p>
		<p>${elem[2]}</p>
		<p>Attempts left: ${elem[4]}</p>
		<p>Category: ${categories[elem[5]][1]}</p>
		${statusRender(elem)}
		${safeTransferRender(elem)}
		<p>Created: ${convertToDate(elem[9])}</p>
		${recieveAtRender(elem)}
	</div>
	`;
	ul.append(li);
}

function statusRender(elem) {
	if (elem[8] == 0) {
		return "<p>Status: Not done yet</p>";
	} else if (elem[8] == 1) {
		return "<p>Status: Done</p>";
	} else if (elem[8] == 2) {
		return "<p>Status: Canceled</p>";
	} else if (elem[8] == 3) {
		return "<p>Status: Code word entered incorrectly</p>";
	}
}

function safeTransferRender(elem) {
	if (elem[6] == true) {
		return `<p>Safe transfer</p>
		<p>Confirmed: ${elem[7]}</p>`;
	}
	return "";
}

function recieveAtRender(elem) {
	if (elem[10] != 0) {
		return `<p>Recieved at: ${convertToDate(elem[10])}</p>`;
	}
	return "";
}

function convertToDate(timestamp) {
	const result = new Date(timestamp * 1000);

	return `${
		String(result.getDate()).length < 2
			? "0" + result.getDate()
			: result.getDate()
	}.${
		String(result.getMonth() + 1).length < 2
			? "0" + result.getMonth() + 1
			: result.getMonth() + 1
	}.${result.getFullYear()} ${
		String(result.getHours() + 1).length < 2
			? "0" + result.getHours()
			: result.getHours()
	}:${
		String(result.getMinutes()).length < 2
			? "0" + result.getMinutes()
			: result.getMinutes()
	}`;
}
