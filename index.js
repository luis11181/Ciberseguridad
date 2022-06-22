console.clear();
require("dotenv").config();
const {
  Client,
  AccountId,
  PrivateKey,
  TokenInfoQuery,
  AccountBalanceQuery,
  TokenCreateTransaction,
  FileCreateTransaction,
  FileAppendTransaction,
  Hbar,
  ContractCreateTransaction,
  ContractFunctionParameters,
  TokenUpdateTransaction,
  ContractExecuteTransaction,
  AccountCreateTransaction,
  ContractId,
  Transaction,
} = require("@hashgraph/sdk");
const fs = require("fs");

const operatorId = AccountId.fromString(process.env.MY_ACCOUNT_ID);

const operatorKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY);
const client = Client.forTestnet().setOperator(operatorId, operatorKey);

async function main() {
  // STEP 1 ===================================
  // Write, Compile, and get contract Bytecode
  // Our contract will mint Fungible tokens, Associate tokens, Transfer tokens
  const bytecode = fs.readFileSync("./contracts_Minting_sol_Minting.bin");
  console.log("----Finished Step 1----");

  // STEP 2 ===================================
  // Create a fungible token
  // set Admin, and supply keys
  const ourToken = await new TokenCreateTransaction()
    .setTokenName("NFT ciberseguridad")
    .setTokenSymbol("Our-NFT")
    .setDecimals(0)
    .setInitialSupply(100)
    .setTreasuryAccountId(operatorId)
    .setAdminKey(operatorKey)
    .setSupplyKey(operatorKey)
    .freezeWith(client)
    .sign(operatorKey);

  const sumbitToken = await ourToken.execute(client);
  const tokenCreateReceipt = await sumbitToken.getReceipt(client);
  const tokenId = tokenCreateReceipt.tokenId;
  const tokenIdSolidity = tokenId.toSolidityAddress();

  console.log("Token Id: ", tokenId.toString());
  console.log("As a sol address: ", tokenIdSolidity);
  // Token query 1

  const tokeninfo1 = await tQueryFcn(tokenId);
  console.log(
    `Supply of Nft our token is: ${tokeninfo1.totalSupply.low}, token name: ${tokeninfo1.name}, token symbol: ${tokeninfo1.symbol}`
  );
  // Create a file on Hedera and store the hex-encoded bytecode

  const fileCreateTx = new FileCreateTransaction().setKeys([operatorKey]);
  const fileCreateSubmit = await fileCreateTx.execute(client);
  const fileCreateReceipt = await fileCreateSubmit.getReceipt(client);
  const byteCodeFileId = fileCreateReceipt.fileId;
  // Append contents to the file

  const fileAppend = new FileAppendTransaction()
    .setFileId(byteCodeFileId)
    .setContents(bytecode)
    .setMaxChunks(10)
    .setMaxTransactionFee(new Hbar(2));

  const fileAppendSubmit = await fileAppend.execute(client);
  const fileAppendReceipt = await fileAppendSubmit.getReceipt(client);

  console.log(
    "response Code for file append was: ",
    fileAppendReceipt.status.toString()
  );
  console.log("----Finished Step 2----");

  // STEP 3 ===================================
  // Create the smart contract
  const contractCreateTx = new ContractCreateTransaction()
    .setBytecodeFileId(byteCodeFileId)
    .setGas(3000000)
    .setConstructorParameters(
      new ContractFunctionParameters().addAddress(tokenIdSolidity)
    );

  const contractCreateSubmit = await contractCreateTx.execute(client);
  const contractCreateReceipt = await contractCreateSubmit.getReceipt(client);

  const contractId = contractCreateReceipt.contractId;
  const contractIdSolidity = contractId.toSolidityAddress();

  console.log("Contract ID: ", contractId.toString());
  console.log("Contract Sol address: ", contractIdSolidity);

  // Token query 2 to show the suply key
  const tokeninfo2 = await tQueryFcn(tokenId);
  console.log("Token Supply key is: ", tokeninfo2.supplyKey.toString());

  // Update the fungible token so the smart contract manages the supply
  const tokenUpdateTx = await new TokenUpdateTransaction()
    .setTokenId(tokenId)
    .setSupplyKey(contractId)
    .freezeWith(client)
    .sign(operatorKey);

  const tokenUpdateSubmit = await tokenUpdateTx.execute(client);
  const tokenUpdateReceipt = await tokenUpdateSubmit.getReceipt(client);

  console.log(
    "The token update transaction was a ",
    tokenUpdateReceipt.status.toString()
  );

  const tokeninfo3 = await tQueryFcn(tokenId);
  console.log("Token Supply key is: ", tokeninfo3.supplyKey.toString());
  console.log("----Finished Step 3----");

  // STEP 4 ===================================
  // Execute a contract function (mint)

  const contractMint = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "mintFungibleToken",
      new ContractFunctionParameters().addUint64(1)
    )
    .setMaxTransactionFee(new Hbar(2));

  //Minting fungible token allows you to increase the total supply of the token.

  const contractMintExecute = await contractMint.execute(client);
  const contractMintReceipt = await contractMintExecute.getReceipt(client);

  console.log("Contract Mint was a ", contractMintReceipt.status.toString());

  const tokeninfo4 = await tQueryFcn(tokenId);
  console.log("Token total Supply: ", tokeninfo4.totalSupply.toNumber());

  //* Execute a contract function (associate)

  //* create or import alice keys

  // const alicePrivateKey = PrivateKey.generateECDSA();
  // console.log("Alice's private key: ", alicePrivateKey.toString());
  // const alicePublicKey = alicePrivateKey.publicKey;
  // console.log("Alice's public key: ", alicePublicKey.toString());

  // const accountCreateTx = await new AccountCreateTransaction()
  //   .setKey(alicePrivateKey)
  //   .execute(client);

  // const aliceAccountCreateReceipt = await accountCreateTx.getReceipt(client);
  // const aliceAccountId = aliceAccountCreateReceipt.accountId;
  // console.log("Alice's account ID: ", aliceAccountId.toString());

  //* option 2 to import alice keys
  const alicePrivateKey = PrivateKey.fromString(process.env.ALICE_PRIVATE_KEY);
  const aliceAccountId = AccountId.fromString(process.env.ALICE_ACCOUNT_ID);

  const aliceSol = aliceAccountId.toSolidityAddress();

  const contractAssociateTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "tokenAssociate",
      new ContractFunctionParameters().addAddress(aliceSol)
    )
    .freezeWith(client)
    .sign(alicePrivateKey);

  const contractAssociateSubmit = await contractAssociateTx.execute(client);
  const contractAssociateReceipt = await contractAssociateSubmit.getReceipt(
    client
  );

  console.log(
    "The contract Associate with allice was a ",
    contractAssociateReceipt.status.toString()
  );
  // Execute a contract function (transfer)
  // ========================================

  const tresurySol = operatorId.toSolidityAddress();

  const contractTransferTx = await new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "tokenTransfer",
      new ContractFunctionParameters()
        .addAddress(operatorId.toSolidityAddress())
        .addAddress(aliceAccountId.toSolidityAddress())
        .addInt64(1)
    )
    .freezeWith(client)
    .sign(operatorKey); // the tresury account must signs

  const contractTransferSubmit = await contractTransferTx.execute(client);
  const contractTransferReceipt = await contractTransferSubmit.getReceipt(
    client
  );

  console.log(
    `- Token transfer from Treasury to Alice: ${contractTransferReceipt.status.toString()}`
  );

  let info = await tQueryFcn(tokenId);
  console.log("TCheck again total supply: ", info.totalSupply.toString());

  //Sign with the client operator private key and submit to a Hedera network
  const tokenBalance = await tQueryFcn(tokenId);

  console.log("The token info again: " + tokenBalance.maxSupply.toString());

  // let AliceQuery = await tQueryFcn(aliceAccountId);
  // let AliceBalance = await bCheckerFcn(aliceAccountId);
  // console.log(
  //   "The nft new balance for this account(alice) is : " +
  //     AliceQuery.tokens.toString(),
  //   "The nft new balance for this account(alice) is : " +
  //     AliceBalance.toString()
  // );

  const treasuryBalance = await queryAccountBalance(operatorId, tokenId);
  const aliceBalance = await queryAccountBalance(aliceAccountId, tokenId);
  console.log(
    `- Treasury balance: ${treasuryBalance} units of token ${tokenId}`
  );
  console.log(`- Alice balance: ${aliceBalance} units of token ${tokenId} \n`);

  console.log("---Finished Step 4---");

  //%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
  //* example transaction to freeze and run in the backend

  const contractTransferTxClient = new ContractExecuteTransaction()
    .setContractId(contractId)
    .setGas(3000000)
    .setFunction(
      "tokenTransfer",
      new ContractFunctionParameters()
        .addAddress(operatorId.toSolidityAddress())
        .addAddress(aliceAccountId.toSolidityAddress())
        .addInt64(1)
    )
    .freezeWith(client);

  let transactionBytes = contractTransferTxClient.toBytes;
  console.log("transaction freezed", transactionBytes);

  // Buffer
  var callback = (err) => {
    if (err) throw err;
    console.log("It's saved!");
  };

  // fs.writeFile("./", transactionBytes, "binary", (err) => {
  //   if (err) {
  //     console.log("There was an error writing the image");
  //   } else {
  //     console.log("Written File :" + "./");
  //   }
  // });

  // fs.writeFile("/trx.json", JSON.stringify(transaction, null, 2)).catch((err) =>
  //   console.error("Failed to write file", err)
  // );
  // ========================================
  // helper FUNCTIONS

  async function tQueryFcn(tId) {
    return new TokenInfoQuery().setTokenId(tId).execute(client);
  }

  async function queryAccountBalance(accountId, tokenId) {
    let balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    return balanceCheckTx.tokens._map.get(tokenId.toString());
  }

  async function bQueryFcn(accountId) {
    let balanceCheckTx = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(client);
    //Sign with the client operator private key and submit to a Hedera network

    return balanceCheckTx;
  }
}
main();
