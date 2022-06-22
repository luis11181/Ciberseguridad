import React from "react";
import logo from "./logo.svg";
import { HashConnect, HashConnectTypes, MessageTypes } from "hashconnect";
import "./App.css";
//import trx from "./trx.json";
import {
  Client,
  AccountId,
  PrivateKey,
  Transaction,
  ContractId,
  ContractCreateTransaction,
  ContractFunctionParameters,
  TokenUpdateTransaction,
  ContractExecuteTransaction,
  AccountCreateTransaction,
} from "@hashgraph/sdk";

//! correr con ($env:HTTPS = "true") -and (npm start) en powershell para hacerlo con https
function App() {
  //* codigo para corer wallet hedera
  let hashconnect: HashConnect;

  console.log(process.env.REACT_APP_ALICE_ACCOUNT_ID);

  const aliceAccountId = AccountId.fromString(
    process.env.REACT_APP_ALICE_ACCOUNT_ID!
  );
  const operatorId = AccountId.fromString(process.env.REACT_APP_MY_ACCOUNT_ID!);

  const operatorKey = PrivateKey.fromString(
    process.env.REACT_APP_MY_PRIVATE_KEY!
  );
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  let saveData: {
    topic: string;
    pairingString: string;
    privateKey?: string;
    pairedWalletData?: HashConnectTypes.WalletMetadata;
    pairedAccounts: string[];
  } = {
    topic: "",
    pairingString: "",
    privateKey: undefined,
    pairedWalletData: undefined,
    pairedAccounts: [],
  };

  let appMetadata: HashConnectTypes.AppMetadata = {
    name: "dApp Example",
    description: "An example hedera dApp",
    icon: "https://absolute.url/to/icon.png",
  };

  let availableExtensions: HashConnectTypes.WalletMetadata[] = [];

  let loadLocalData = (): boolean => {
    let foundData = localStorage.getItem("hashconnectData");

    if (foundData) {
      saveData = JSON.parse(foundData);
      return true;
    } else return false;
  };

  let saveDataInLocalstorage = (saveData: {
    topic: string;
    pairingString: string;
    privateKey?: string;
    pairedWalletData?: HashConnectTypes.WalletMetadata;
    pairedAccounts: string[];
  }) => {
    let data = JSON.stringify(saveData);

    localStorage.setItem("hashconnectData", data);
  };

  let transaccionfnc = async () => {
    //const trx = Transaction.fromBytes();
    const contractId = ContractId.fromString("0.0.46041674");
    // set provider user to make the transaction
    let provider = hashconnect.getProvider(
      "testnet",
      saveData.topic,
      saveData.pairedAccounts[0]
    );

    let balance = await provider.getAccountBalance(saveData.pairedAccounts[0]);
    console.log(balance);

    let signer = hashconnect.getSigner(provider);

    const contractTransferTxClient = new ContractExecuteTransaction()
      .setContractId(contractId)
      .setGas(3000000)
      .setFunction(
        "tokenTransfer",
        new ContractFunctionParameters()
          .addAddress(operatorId.toSolidityAddress())
          .addAddress(aliceAccountId.toSolidityAddress())
          .addInt8(1)
      )
      .freezeWith(client);

    let res = await contractTransferTxClient.executeWithSigner(signer);

    console.log(res);

    // //Get the transaction ID
    // const txId = submitTx.transactionId.toString();
    // //Print the transaction ID to the console
    // console.log("The transaction ID " + txId);
  };

  console.log("inicializo");

  (async function () {
    //create the hashconnect instance
    hashconnect = new HashConnect();

    // hashconnect.foundExtensionEvent.on((data) => {
    //   availableExtensions.push(data);
    //   console.log("Found extension", data);
    // });

    if (!loadLocalData()) {
      //first init and store the private for later
      let initData = await hashconnect.init(appMetadata);
      saveData.privateKey = initData.privKey;

      //then connect, storing the new topic for later
      const state = await hashconnect.connect();
      saveData.topic = state.topic;

      console.log("conecto nueva wallet");
      console.log("state", state);

      //generate a pairing string, which you can display and generate a QR code from
      saveData.pairingString = hashconnect.generatePairingString(
        state,
        "testnet",
        true
      );

      //find any supported local wallets
      hashconnect.findLocalWallets();
      console.log("localwallets:", hashconnect.findLocalWallets());

      hashconnect.foundExtensionEvent.once((walletMetadata) => {
        //do something with metadata
      });

      console.log("saved data", saveData);

      hashconnect.acknowledgeMessageEvent.once((acknowledgeData) => {
        //do something with acknowledge response data

        console.log("acknowledge function", acknowledgeData);
      });

      hashconnect.connectToLocalWallet(saveData.pairingString);

      console.log("saved data2", saveData);

      // hashconnect.pairingEvent.once((pairingData) => {
      //   //example
      //   pairingData.accountIds.forEach((id) => {
      //     if (pairedAccounts.indexOf(id) == -1) pairedAccounts.push(id);
      //   });
      // });

      //! repetir los pasos anteriores como si ya hubiese una conexion previa

      hashconnect.pairingEvent.on((data) => {
        console.log("Paired with wallet", data);
        //status = "Paired";

        saveData.pairedWalletData = data.metadata;

        data.accountIds.forEach((id) => {
          if (saveData.pairedAccounts.indexOf(id) == -1)
            saveData.pairedAccounts.push(id);
        });

        console.log("saved data3", saveData);

        //find any supported local wallets
        console.log("localwallets2:", hashconnect.findLocalWallets());

        saveDataInLocalstorage(saveData);
      });

      console.log("finalizo conexion uneva con wallet");
    } else {
      console.log("conecto con datos guardados");
      //use loaded data for initialization + connection
      await hashconnect.init(appMetadata, saveData.privateKey);
      await hashconnect.connect(saveData.topic, saveData.pairedWalletData!); // da error si le entra null de argumento
      console.log("savedData", saveData);
    }
  })();

  return (
    <div className="App">
      <h1>web 3 frontend</h1>
      <button onClick={transaccionfnc}>Ejecutar contrato y enviar NFT</button>
    </div>
  );
}

export default App;
