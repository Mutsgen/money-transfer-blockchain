cd C:\Users\Blockchain.PC43-1\Desktop\Money-Transfer-blockchain-main\mygeth 
   ::geth --datadir ./ init genesis.json

start /ik geth attach \\.\pipe\geth.ipc --exec miner.start()
start /i C:\Users\Blockchain.PC43-1\Desktop\Money-Transfer-blockchain-main\index.html  
cmd /k geth --datadir ./ --networkid 1547 --http --http.corsdomain "*" --allow-insecure-unlock  --rpc.allow-unprotected-txs --ws.api="db,eth,net,web3,personal,web3"

