import React from "react";
import logo from "./logo.svg";
import { HashConnect, HashConnectTypes } from "hashconnect";
import "./App.css";
//import trx from "./trx.json";
import {
  Client,
  AccountId,
  PrivateKey,
  Transaction,
  ContractId,
  AccountBalanceQuery,
  ContractCreateTransaction,
  ContractFunctionParameters,
  TokenUpdateTransaction,
  ContractExecuteTransaction,
  AccountCreateTransaction,
} from "@hashgraph/sdk";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import { Paper, Typography } from "@mui/material";

//! correr con ($env:HTTPS = "true") -and (npm start) en powershell para hacerlo con https
function App() {
  let [balance, setbalance] = React.useState("0");
  let [tresurybalance, settresurybalance] = React.useState("0");
  let [alicebalance, setalicebalance] = React.useState("0");
  //* codigo para corer wallet hedera
  let hashconnect: HashConnect;

  const aliceAccountId = AccountId.fromString(
    process.env.REACT_APP_ALICE_ACCOUNT_ID!
  );
  const operatorId = AccountId.fromString(process.env.REACT_APP_MY_ACCOUNT_ID!);

  const operatorKey = PrivateKey.fromString(
    process.env.REACT_APP_MY_PRIVATE_KEY!
  );
  const client = Client.forTestnet().setOperator(operatorId, operatorKey);

  console.log("contractId as string", process.env.REACT_APP_CONTRACTID!);

  const contractId = ContractId.fromString(process.env.REACT_APP_CONTRACTID!); // este dato tampoco se pasaria si se envia toda la transaccion
  console.log("contractId", contractId);

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

  async function queryAccountBalance(accountId: any, tokenId: any) {
    let balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    return balanceCheckTx.tokens!._map.get(tokenId.toString());
  }

  console.log("inicializo");

  (async function () {
    //create the hashconnect instance
    hashconnect = new HashConnect();

    //* busca si la extension esta disponible y actua respecto a eso
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

      //* se conecta con la wallet y le pide que escoja cual desea usar, paspo que realmente configura todo

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

      //! codigo para ejecutar los balances apenas corre el navegador
      let provider = hashconnect.getProvider(
        "testnet",
        saveData.topic,
        saveData.pairedAccounts[0]
      );

      let balance = await provider.getAccountBalance(
        saveData.pairedAccounts[0]
      );
      setbalance(balance.hbars.toString());

      const aliceBalance = await queryAccountBalance(
        aliceAccountId,
        process.env.REACT_APP_TOKENID!
      );

      const treasuryBalance = await queryAccountBalance(
        operatorId,
        process.env.REACT_APP_TOKENID!
      );
      console.log(
        `- Treasury balance: ${treasuryBalance} units of token ${process.env
          .REACT_APP_TOKENID!}`
      );
      console.log(
        `- Alice balance: ${aliceBalance} units of token ${process.env
          .REACT_APP_TOKENID!} \n`
      );

      setalicebalance(aliceBalance!.toString());

      settresurybalance(treasuryBalance!.toString());
    }
  })();

  //* funcion que ejecuta el NFT, lo transfiere etc..
  let transaccionfnc = async () => {
    //const trx = Transaction.fromBytes();

    // set provider user to make the transaction
    let provider = hashconnect.getProvider(
      "testnet",
      saveData.topic,
      saveData.pairedAccounts[0]
    );

    let balance = await provider.getAccountBalance(saveData.pairedAccounts[0]);
    console.log("balance:", balance.toString());

    setbalance(balance.hbars.toString());

    let signer = hashconnect.getSigner(provider);
    console.log("signer that hashpack see", signer, signer.getAccountId());

    //* FIXME: RUN A BACKEND SERVICE THAT SEND THE WHOLE TRANSACTION ALREADY MADE AS BYTEARRAY, AND IT IS CONVERTED HERE, SIGNED AND EXECUTED
    // const contractTransferTxClient = Transaction.fromBytes();  // THAT WAY WE DONT NEED PRIVATE KEY HERE

    const contractTransferTxClient = new ContractExecuteTransaction()
      .setContractId(process.env.REACT_APP_CONTRACTID!)
      .setGas(3000000)
      .setFunction(
        "tokenTransfer",
        new ContractFunctionParameters()
          .addAddress(operatorId.toSolidityAddress())
          .addAddress(aliceAccountId.toSolidityAddress())
          //@ts-ignore
          .addInt64(1)
      )
      .freezeWith(client);

    //firma

    console.log(`- contractTransferTxClient: ${contractTransferTxClient}`);

    let res = await (
      await contractTransferTxClient.executeWithSigner(signer)
    ).getReceipt;

    //const contractTransferReceipt = await res.getReceipt(client);

    // console.log(
    //   `- Token transfer from Treasury to Alice: ${contractTransferReceipt.status.toString()}`
    // );

    console.log(res);

    // //Get the transaction ID
    // const txId = submitTx.transactionId.toString();
    // //Print the transaction ID to the console
    // console.log("The transaction ID " + txId);

    const aliceBalance = await queryAccountBalance(
      aliceAccountId,
      process.env.REACT_APP_TOKENID!
    );

    const treasuryBalance = await queryAccountBalance(
      operatorId,
      process.env.REACT_APP_TOKENID!
    );
    console.log(
      `- Treasury balance: ${treasuryBalance} units of token ${process.env
        .REACT_APP_TOKENID!}`
    );
    console.log(
      `- Alice balance: ${aliceBalance} units of token ${process.env
        .REACT_APP_TOKENID!} \n`
    );

    setalicebalance(aliceBalance!.toString());

    settresurybalance(treasuryBalance!.toString());
  };

  return (
    <div className="App">
      <Typography variant="h1" component="h2">
        Web 3 Hbar NFT
      </Typography>

      <Button variant="contained" onClick={transaccionfnc}>
        Execute smart contract and send NFT to "alice"
      </Button>

      <Typography variant="body1">
        Browser account balance: {balance}
      </Typography>

      <Typography variant="body1">
        NFT tresury account balance: {tresurybalance}
      </Typography>

      <Typography variant="body1">
        NTF alice account balance: {alicebalance}
      </Typography>
    </div>
  );
}

export default App;
