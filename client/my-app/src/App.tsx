import React from "react";
import logo from "./logo.svg";
import { HashConnect, HashConnectTypes, MessageTypes } from "hashconnect";
import "./App.css";

//! correr con ($env:HTTPS = "true") -and (npm start) en powershell para hacerlo con https
function App() {
  //* codigo para corer wallet hedera
  let hashconnect: HashConnect;

  let saveData = {
    topic: "",
    pairingString: "",
    privateKey: "",
    pairedWalletData: null,
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
        console.log("acknowledge function");
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

      await hashconnect.init(appMetadata, saveData.privateKey);
      await hashconnect.connect(saveData.topic, saveData.pairedWalletData!); // da error si le entra null de argumento

      console.log("saved data3", saveData);

      //find any supported local wallets
      console.log("localwallets2:", hashconnect.findLocalWallets());

      console.log("finalizo conexion uneva con wallet");
    } else {
      //use loaded data for initialization + connection
      await hashconnect.init(appMetadata, saveData.privateKey);
      await hashconnect.connect(saveData.topic, saveData.pairedWalletData!); // da error si le entra null de argumento
    }
  })();

  return (
    <div className="App">
      <div>web 3 frontend</div>
    </div>
  );
}

export default App;
