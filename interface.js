"use strict";

import abi from "./abi.js";
import { bytecode } from "./bytecode.js";

const Web3 = require("web3");

const providerRPC = {
  development: "http://localhost:9933",
  moonbase: "https://rpc.api.moonbase.moonbeam.network",
};
const web3 = new Web3(providerRPC.development); // Change to correct network

const account_from = {
  privateKey: "YOUR-PRIVATE-KEY-HERE",
  address: "PUBLIC-ADDRESS-OF-PK-HERE",
};
const bytecode = contractFile.evm.bytecode.object;
const abi2 = abi;

const deploy = async () => {
  console.log(`Attempting to deploy from account ${account_from.address}`);

  const incrementer = new web3.eth.Contract(abi2);

  const incrementerTx = incrementer.deploy({
    data: bytecode,
    arguments: [5],
  });

  const createTransaction = await web3.eth.accounts.signTransaction(
    {
      data: incrementerTx.encodeABI(),
      gas: await incrementerTx.estimateGas(),
    },
    account_from.privateKey
  );

  const createReceipt = await web3.eth.sendSignedTransaction(
    createTransaction.rawTransaction
  );
  console.log(`Contract deployed at address: ${createReceipt.contractAddress}`);
  return createReceipt.contractAddress;
};

const contractAddress = deploy();

let web3, contractInstanse;
const container = document.querySelector(".container");

async function network() {
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  contractInstanse = new web3.eth.Contract(abi, contractAddress);
  console.log("Connected successfully!");
}

network();
await getAccounts();

async function getAccounts() {
  const accounts = await web3.eth.getAccounts().then((data) => data);
  unlockAccountsIfNeeded(accounts, "76760");
  // accounts.forEach(async (e) => {
  //   await web3.eth.personal
  //     .unlockAccount(e, "76760")
  //     .then(console.log("Account unlocked!"));
  // });
  console.log(accounts);
}

async function isAccountLocked(account) {
  try {
    await web3.eth.sendTransaction({
      from: account,
      to: account,
      value: 0,
    });
    return false;
  } catch (err) {
    return err.message == "authentication needed: password or unlock";
  }
}

async function unlockAccountsIfNeeded(
  accounts,
  passwords,
  unlock_duration_sec
) {
  if (typeof unlock_duration_sec === "undefined") unlock_duration_sec = 300;

  for (let i = 0; i < accounts.length; i++) {
    if (isAccountLocked(accounts[i])) {
      console.log("Account " + accounts[i] + " is locked. Unlocking");
      web3.eth.personal.unlockAccount(
        accounts[i],
        passwords,
        unlock_duration_sec
      );
      console.log("unlock");
    }
  }
}

async function getBalance(account) {
  let balance = await web3.eth.getBalance(account);
  balance = await web3.utils.fromWei(balance, "ether");
  return balance;
}

const registation = async (address, password) => {
  const passwordSha3 = web3.utils.soliditySha3({
    type: "string",
    value: password,
  });
  return await contractInstanse.methods
    .registration(address, passwordSha3)
    .send({ from: address }, function (error, result) {
      console.log("registration error: ", error);
      console.log("result: ", result);
      if (error === null) {
        alert("You have successfully registered!");
      }
    });
};

const login = async (address, password) => {
  const passwordSha3 = await web3.utils.soliditySha3({
    type: "string",
    value: password,
  });

  try {
    return await contractInstanse.methods
      .auth(address, passwordSha3)
      .call({ from: address }, function (error, result) {
        console.log("registration error: ", error);
        console.log("result: ", result);
      });
  } catch (error) {
    alert(error.name);
  }
};

const logout = async (position) => {
  const logoutBtn = document.createElement("button");

  logoutBtn.className = "logout";
  logoutBtn.innerText = "Выйти";

  logoutBtn.onclick = async () => {
    localStorage.removeItem("accountinfo");
    container.querySelector(".account-data").innerHTML = "";
    container.querySelector(".transactions").innerHTML = "";
    container.querySelector(".transfer-panel").innerHTML = "";
    await authFunc();
  };
  position.append(logoutBtn);
};

const createTransfer = async (
  receiver,
  count_money,
  codeword,
  category,
  safe_transfer
) => {
  console.log(receiver, count_money, codeword, category, safe_transfer);
  const acc = JSON.parse(localStorage.getItem("accountinfo")).account;
  try {
    return await contractInstanse.methods
      .createTransaction(
        receiver,
        count_money,
        codeword,
        category,
        safe_transfer
      )
      .send({
        value: count_money,
        from: acc,
      });
  } catch (err) {
    console.log(err);
    getBalance(acc);
  }
};
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
const acceptTransfer = async (id, codeword) => {
  const codewordSha3 = web3.utils.soliditySha3({
    type: "string",
    value: codeword,
  });
  const acc = JSON.parse(localStorage.getItem("accountinfo")).account;
  try {
    console.log(123);
    await contractInstanse.methods
      .receiveTransaction(id, codewordSha3)
      .send({ from: acc });
    console.log(321);
  } catch (err) {
    alert(err);
  }
};

const declineTransfer = async (id) => {
  const acc = JSON.parse(localStorage.getItem("accountinfo")).account;
  try {
    await contractInstanse.methods.cancelTransaction(id).send({ from: acc });
  } catch (error) {
    console.log(error);
  }
};

const addCategory = async (name) => {
  const acc = JSON.parse(localStorage.getItem("accountinfo")).account;
  try {
    await contractInstanse.methods.addCategory(name).send({ from: acc });
  } catch (error) {
    console.log(error);
  }
};
const addPattern = async (category, name, money) => {
  const acc = JSON.parse(localStorage.getItem("accountinfo")).account;
  try {
    await contractInstanse.methods
      .addPattern(category, name, money)
      .send({ from: acc });
  } catch (error) {
    console.log(error);
  }
};
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------

const returnCategories = async () => {
  return await contractInstanse.methods.showCategories().call();
};
const returnTransactions = async () => {
  return await contractInstanse.methods.showTransactions().call();
};
const returnPatterns = async () => {
  return await contractInstanse.methods.showPatterns().call();
};
const returnRole = async () => {
  return await contractInstanse.methods
    .showRole(JSON.parse(localStorage.getItem("accountinfo")).account)
    .call();
};
const returnAttempts = async (id) => {
  return await contractInstanse.methods.checkAttempts(id).call();
};
// const returnVotes = async (id) => {
//   return await contractInstanse.methods.checkAttempts(id).call();
// };
// const returnAdminCount = async (id) => {
//   return await contractInstanse.methods.checkAttempts(id).call();
// };

// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------
// ------------------------------------------

const createTransferPanel = async () => {
  const panelBack = document.createElement("div");
  const panel = document.createElement("div");
  const panelContent = document.createElement("div");

  panelBack.className = "modal-wrap";
  panel.className = "transfer-modal";
  panelContent.className = "transfer-content";

  panelContent.innerHTML = `<input type="text" class="reciever" placeholder="Получатель" />
  <div class="count-block">
    <select name="category" id="category">
    <option value="select">Категория</option>
  </select>
  <select name="pattern" id="pattern" style="visibility: hidden">
    <option value="select">Шаблон</option>
  </select>
    <input type="text" class="count" placeholder="Сумма" />
    <select name="swapper" id="swapper">
      <option value="0">Wei</option>
      <option value="1">Ether</option>
    </select>
  </div>
  <input type="text" class="codeword" placeholder="Кодовое слово" />
  <div class="safe-div">
          <input type="checkbox" class="safe-transfer" />
          <span>Безопасный перевод</span>
        </div>
  <button class="send-transfer">Отправить</button>`;

  panelBack.onclick = (event) => {
    if (!event.target.classList.contains("modal-wrap")) return;
    panelBack.remove();
  };

  const categories = await returnCategories();
  const catSelect = panelContent.querySelector("#category");
  const pattSelect = panelContent.querySelector("#pattern");
  const countInp = panelContent.querySelector(".count");
  const sendBtn = panelContent.querySelector(".send-transfer");
  const reciever = panelContent.querySelector(".reciever");
  const codeword = panelContent.querySelector(".codeword");
  const safety = panelContent.querySelector(".safe-transfer");
  console.log(safety.checked);
  for (let i = 0; i < categories.length; i++) {
    const el = categories[i];
    const option = document.createElement("option");
    option.innerText = el[1];
    option.value = el[0];
    catSelect.append(option);
  }

  catSelect.onchange = async () => {
    const patterns = await returnPatterns();
    pattSelect.innerHTML = "";
    pattSelect.style.visibility = "visible";
    for (let i = 0; i < patterns.length; i++) {
      const el = patterns[i];
      if (el[0] != catSelect.value) continue;
      const option = document.createElement("option");
      option.value = el[2];
      option.innerText = `${el[1]} ${el[2]}`;
      pattSelect.append(option);
    }
  };

  pattSelect.onchange = () => {
    countInp.value = pattSelect.value;
  };

  countInp.oninput = () => {
    pattSelect.style.visibility = "hidden";
  };

  sendBtn.onclick = async () => {
    let count;
    if (panelContent.querySelector("#swapper").value == 1) {
      count = String(countInp.value * 10 ** 18);
    }
    if (panelContent.querySelector("#swapper").value == 0) {
      count = String(countInp.value);
    }
    if (catSelect.value == "select") {
      catSelect.value = 0;
    }
    const codewordSha3 = await web3.utils.soliditySha3({
      type: "string",
      value: codeword.value,
    });
    console.log(reciever.value, count, codewordSha3, catSelect.value, "0");
    try {
      await createTransfer(
        reciever.value,
        count,
        codewordSha3,
        catSelect.value,
        // secure transfer TODO!!!!!!
        safety.checked
      );
    } catch (err) {
      alert(err.massenge);
      console.log(err);
    }
    console.log(await returnTransactions());
    panelBack.remove();
    container.querySelector(".account-data").innerHTML = "";
    await renderPersonalPage(true);
    await renderTransferHistory(container);
  };

  panel.append(panelContent);
  panelBack.append(panel);
  document.body.append(panelBack);
};

const renderPersonalPage = async (loginStatus) => {
  if (!loginStatus) {
    alert("something wrong");
    return;
  }
  const address = JSON.parse(localStorage.getItem("accountinfo")).account;
  console.log(address);
  const account = document.createElement("span");
  const balance = document.createElement("span");
  const transBtn = document.createElement("button");

  account.className = "account-address";
  balance.className = "account-balance";

  account.innerText = `Your address:\t ${address}`;
  balance.innerText = `Your balance:\t ${await getBalance(address)} ETH`;
  transBtn.innerText = "Перевести";

  transBtn.onclick = async () => {
    await createTransferPanel();
  };
  container.querySelector(".account-data").innerHTML = "";
  container.querySelector(".account-data").append(account, balance, transBtn);

  if ((await returnRole()) == 1) {
    const div = document.createElement("div");
    const div2 = document.createElement("div");
    const createCatBtn = document.createElement("button");
    createCatBtn.innerText = "Добавить категорию";
    createCatBtn.className = "create-category";
    div.append(createCatBtn, div2);
    container.querySelector(".account-data").append(div);
    createCatBtn.onclick = () => {
      div2.innerHTML = "";
      const nameInp = document.createElement("input");
      const create = document.createElement("button");
      div2.append(nameInp, create);

      create.onclick = async () => {
        const name = nameInp.value;
        addCategory(name);
        div2.innerHTML = "";
      };
    };
  }

  if ((await returnRole()) == 1) {
    const div = document.createElement("div");
    const div2 = document.createElement("div");
    const createPatBtn = document.createElement("button");
    createPatBtn.innerText = "Добавить шаблон";
    createPatBtn.className = "create-pattern";
    div.append(createPatBtn, div2);
    container.querySelector(".account-data").append(div);
    createPatBtn.onclick = async () => {
      div2.innerHTML = "";
      const categories = await returnCategories();
      const catInp = document.createElement("select");
      for (let i = 0; i < categories.length; i++) {
        const el = categories[i];
        const option = document.createElement("option");
        option.innerText = el[1];
        option.value = el[0];
        catInp.append(option);
      }
      const nameInp = document.createElement("input");
      const moneyInp = document.createElement("input");
      const create = document.createElement("button");
      div2.append(catInp, nameInp, moneyInp, create);

      create.onclick = async () => {
        const name = nameInp.value;
        const cat = catInp.value;
        const money = moneyInp.value;
        addPattern(cat, name, money);
        div2.innerHTML = "";
      };
    };
  }

  await logout(container.querySelector(".account-data"));
};
const createTransferCard = async ({ transaction, id }, position) => {
  const li = document.createElement("li");
  const card = document.createElement("div");
  card.classList.add("transfer-card");
  card.dataset.id = id;
  card.style.display = "grid";

  const sender = document.createElement("span");
  sender.classList.add("sender");
  const reciever = document.createElement("span");
  reciever.classList.add("reciever");
  const count = document.createElement("span");
  count.classList.add("count");
  const attempts = document.createElement("span");
  attempts.classList.add("attempts");
  const codewordInp = document.createElement("input");
  codewordInp.classList.add("codeword-input");
  const status = document.createElement("span");
  status.classList.add("status");
  const createData = document.createElement("span");
  createData.classList.add("created");
  const closeData = document.createElement("span");
  closeData.classList.add("closed");

  const divBtn = document.createElement("div");
  divBtn.classList.add("buttons");

  if (
    transaction[1] == JSON.parse(localStorage.getItem("accountinfo")).account
  ) {
    if (transaction[8] != 0 || (transaction[6] == 1 && transaction[7] != 1)) {
      codewordInp.style.display = "none";
    }
    if (transaction[8] == 0) {
      console.log(transaction[6], transaction[7]);
      if (transaction[6] == 0 || (transaction[6] == 1 && transaction[7] == 1)) {
        console.log(2);
        const acceptBtn = document.createElement("button");
        acceptBtn.classList.add("accept");
        acceptBtn.innerText = "Принять";
        divBtn.append(acceptBtn);

        acceptBtn.onclick = async (event) => {
          const id = event.target.closest(".transfer-card").dataset.id;
          await acceptTransfer(id, codewordInp.value);
          await renderPersonalPage(true);
          await renderTransferHistory(container);
        };
      }
    }
  }
  if (
    transaction[0] == JSON.parse(localStorage.getItem("accountinfo")).account
  ) {
    codewordInp.style.display = "none";
    if (transaction[8] == 0) {
      const declineBtn = document.createElement("button");
      declineBtn.classList.add("decline");
      declineBtn.innerText = "Отклонить";
      divBtn.append(declineBtn);

      declineBtn.onclick = async (event) => {
        const id = event.target.closest(".transfer-card").dataset.id;
        await declineTransfer(id);
        await renderPersonalPage(true);
        await renderTransferHistory(container);
      };
    }
  }

  sender.innerText = `Отправитель: ${transaction[0]}`;
  reciever.innerText = `Получатель: ${transaction[1]}`;
  count.innerText = `Сумма: ${transaction[2]}`;
  attempts.innerText = `Попыток: ${await returnAttempts(id)}`;

  if (transaction[8] == 0) status.innerText = "Статус: не завершено";
  if (transaction[8] == 1) status.innerText = "Статус: завершено";
  if (transaction[8] == 2) status.innerText = "Статус: отменено";
  if (transaction[8] == 3)
    status.innerText = "Статус: получатель ввел неправильно код слово";

  createData.innerText = `Дата создания: ${String(
    new Date(transaction[9] * 1000).toLocaleDateString()
  )}`;

  li.append(card);

  card.append(
    sender,
    reciever,
    count,
    attempts,
    status,
    createData,
    codewordInp,
    divBtn
  );

  position.append(li);
};

const secureConfirmAdmin = async ({ transaction, id }, position) => {
  const li = document.createElement("li");
  const card = document.createElement("div");
  card.classList.add("transfer-card");
  card.dataset.id = id;
  card.style.display = "grid";

  const sender = document.createElement("span");
  sender.classList.add("sender");
  const reciever = document.createElement("span");
  reciever.classList.add("reciever");
  const count = document.createElement("span");
  count.classList.add("count");
  const status = document.createElement("span");
  status.classList.add("status");
  const createData = document.createElement("span");
  createData.classList.add("created");

  const divBtn = document.createElement("div");
  divBtn.classList.add("buttons");

  const accept = document.createElement("button");
  accept.className = "accept-secure";
  accept.innerText = "Подтвердить";
  const decline = document.createElement("button");
  decline.className = "decline-secure";
  decline.innerText = "Отклонить";

  sender.innerText = `Отправитель: ${transaction[0]}`;
  reciever.innerText = `Получатель: ${transaction[1]}`;
  count.innerText = `Сумма: ${transaction[2]}`;

  if (transaction[8] == 0) status.innerText = "Статус: не завершено";
  if (transaction[8] == 1) status.innerText = "Статус: завершено";
  if (transaction[8] == 2) status.innerText = "Статус: отменено";
  if (transaction[8] == 3)
    status.innerText = "Статус: получатель ввел неправильно код слово";

  createData.innerText = `Дата создания: ${String(
    new Date(transaction[9] * 1000).toLocaleDateString()
  )}`;

  accept.onclick = async (event) => {
    const id = event.target.closest(".transfer-card").dataset.id;
    const acc = JSON.parse(localStorage.getItem("accountinfo")).account;
    await contractInstanse.methods.acceptSafeTransfer(id).send({ from: acc });
    await renderPersonalPage(true);
    await renderTransferHistory(container);
  };
  decline.onclick = async (event) => {
    const id = event.target.closest(".transfer-card").dataset.id;
    const acc = JSON.parse(localStorage.getItem("accountinfo")).account;
    await contractInstanse.methods.cancelSafeTransfer(id).send({ from: acc });
    await renderPersonalPage(true);
    await renderTransferHistory(container);
  };

  li.append(card);
  divBtn.append(accept, decline);
  card.append(sender, reciever, count, status, createData, divBtn);

  position.append(li);
};

const renderTransferHistory = async (position) => {
  if (position.querySelector(".transactions")) {
    position.querySelector(".transactions").remove();
  }
  const div = document.createElement("div");
  div.classList.add("transactions");
  const ul = document.createElement("ul");
  ul.classList.add("transaction-list");
  const divBtn = document.createElement("div");
  divBtn.className = "swapperLists";
  const outputBtn = document.createElement("button");
  outputBtn.innerText = "Исходящие";
  const inputBtn = document.createElement("button");
  inputBtn.innerText = "Входящие";
  if ((await returnRole()) == 1) {
    const secureConfirm = document.createElement("button");
    secureConfirm.innerText = "Запросы на безопасные переводы";

    const votings = document.createElement("button");
    votings.innerText = "Голосования";

    divBtn.append(secureConfirm, votings);

    secureConfirm.onclick = async (event) => {
      ul.innerHTML = "";
      const buttons = divBtn.querySelectorAll("button");
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
      }
      event.target.classList.add("active");
      for (let i = 0; i < securedConf.length; i++) {
        const el = securedConf[i];
        await secureConfirmAdmin(el, ul);
      }
    };

    votings.onclick = async (event) => {
      ul.innerHTML = "";
      const buttons = divBtn.querySelectorAll("button");
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove("active");
      }
      event.target.classList.add("active");
    };
  }

  outputBtn.onclick = async (event) => {
    ul.innerHTML = "";
    const buttons = divBtn.querySelectorAll("button");
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove("active");
    }
    event.target.classList.add("active");
    console.log(outputTrans);
    for (let i = 0; i < outputTrans.length; i++) {
      const el = outputTrans[i];
      createTransferCard(el, ul);
    }
  };

  inputBtn.onclick = async (event) => {
    ul.innerHTML = "";
    const buttons = divBtn.querySelectorAll("button");
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].classList.remove("active");
    }
    event.target.classList.add("active");
    console.log(inputTrans);
    for (let i = 0; i < inputTrans.length; i++) {
      const el = inputTrans[i];
      createTransferCard(el, ul);
    }
  };

  const transaction = await returnTransactions();
  const curAcc = JSON.parse(localStorage.getItem("accountinfo")).account;
  let outputTrans = [];
  let inputTrans = [];
  let securedConf = [];
  for (let i = 0; i < transaction.length; i++) {
    const el = transaction[i];
    if (el[0] == curAcc) {
      outputTrans.push({ transaction: el, id: i });
    }
    if (el[1] == curAcc) {
      inputTrans.push({ transaction: el, id: i });
    }
    if (el[6] == true) {
      if (el[7] == 0) {
        securedConf.push({ transaction: el, id: i });
      }
    }
  }
  console.log(securedConf);

  divBtn.prepend(outputBtn, inputBtn);

  div.append(divBtn, ul);
  position.append(div);
};

const authFunc = async () => {
  const modalAuth = document.querySelector("#modal-auth");
  modalAuth.style.display = "block";
  const authAddress = document.querySelector(".authAddress");
  const authPassword = document.querySelector(".authPassword");

  const btnLogin = document.querySelector(".loginBtn");
  const btnReg = document.querySelector(".regBtn");

  btnReg.onclick = async (event) => {
    event.preventDefault();
    const regStatus = await registation(authAddress.value, authPassword.value);
    authPassword.value = "";
    if (regStatus) console.log(`regStatus`, regStatus);
  };

  btnLogin.onclick = async (event) => {
    event.preventDefault();
    const logStatus = await login(authAddress.value, authPassword.value);
    authPassword.value = "";
    if (logStatus) {
      const account = authAddress.value;
      localStorage.setItem("accountinfo", JSON.stringify({ account }));
      await renderPersonalPage(logStatus);
      await renderTransferHistory(container);
      authAddress.value = "";
      modalAuth.style.display = "none";
    }

    if (!logStatus) {
      document.querySelector(".alert-login").style.display = "block";
    }
  };
};
authFunc();
