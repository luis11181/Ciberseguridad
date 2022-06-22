import React from "react";
import logo from "./logo.svg";
import { HashConnect, HashConnectTypes, MessageTypes } from "hashconnect";
import "./App.css";

//! correr con ($env:HTTPS = "true") -and (npm start) en powershell para hacerlo con https
function App() {
  //* codigo para corer wallet hedera
  // let hashconnect: HashConnect;

  // let saveData = {
  //   topic: "",
  //   pairingString: "",
  //   privateKey: "",
  //   pairedWalletData: null,
  //   pairedAccounts: [],
  // };

  // let appMetadata: HashConnectTypes.AppMetadata = {
  //   name: "dApp Example",
  //   description: "An example hedera dApp",
  //   icon: "https://absolute.url/to/icon.png",
  // };

  // let loadLocalData = (): boolean => {
  //   let foundData = localStorage.getItem("hashconnectData");

  //   if (foundData) {
  //     saveData = JSON.parse(foundData);
  //     return true;
  //   } else return false;
  // };

  // console.log("inicializo");

  // (async function () {
  //   //create the hashconnect instance
  //   hashconnect = new HashConnect();

  //   if (!loadLocalData()) {
  //     //first init and store the private for later
  //     let initData = await hashconnect.init(appMetadata);
  //     saveData.privateKey = initData.privKey;

  //     //then connect, storing the new topic for later
  //     const state = await hashconnect.connect();
  //     saveData.topic = state.topic;

  //     console.log("conecto nueva wallet");
  //     console.log("state", state);

  //     //generate a pairing string, which you can display and generate a QR code from
  //     saveData.pairingString = hashconnect.generatePairingString(
  //       state,
  //       "testnet",
  //       true
  //     );

  //     //find any supported local wallets
  //     hashconnect.findLocalWallets();
  //     console.log("localwallets:", hashconnect.findLocalWallets());

  //     //hashconnect.connectToLocalWallet(pairingString, extensionMetadata);

  //     console.log("finalizo conecion uneva con wallet");
  //   } else {
  //     //use loaded data for initialization + connection
  //     await hashconnect.init(appMetadata, saveData.privateKey);
  //     await hashconnect.connect(saveData.topic, saveData.pairedWalletData!); // da error si le entra null de argumento
  //   }
  // })();

  return (
    <div className="App">
      <div>web 3 frontend</div>
    </div>
  );
}

export default App;
