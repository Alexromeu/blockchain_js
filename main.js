const SHA256 = require('crypto-js/sha256')

class Block {
    constructor(timestamp, data) {
        this.index = 0;
        this.timestamp = timestamp;
        this.data = data;
        this.previousHash = '0';
        this.hash = this.calculateHash();
        this.nonce = 0;
    }

    calculateHash() {
        return SHA256(this.index + this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce).toString(); 
    }

    mineBlock(difficulty) {
        const target = Array(difficulty + 1).join("0");
        const start = Date.now()

        while (this.hash.substring(0, difficulty) !== target) {
            this.nonce++;
            this.hash = this.calculateHash()

            if (this.nonce % 100000 === 0) {
               console.log(`Nonce: ${this.nonce} | Hash: ${this.hash}`);
        }
        }

        const end = Date.now();
        const duration = (end - start) / 1000;

        console.log(`Block mined!`);
        console.log(`Difficulty: ${difficulty}`);
        console.log(`Final nonce: ${this.nonce}`);
        console.log(`Hash: ${this.hash}`);
        console.log(`Time taken: ${duration} seconds`);

    }

}


class Blockchain {
    constructor() {
        this.chain = [this.createGenesis()]
        this.difficulty = 4;
        this.txPool = [];
    }

    createGenesis() {
        return new Block('0', {})
    }

    latestBlock() {
        return this.chain[this.chain.length - 1]
    }

    addBlock(newBlock, minerAddress) {
        newBlock.index = this.chain.length
        newBlock.previousHash = this.latestBlock().hash;

        const txs = newBlock.data.transactions || [];
        if (!this.validateTx(txs)) return;

        newBlock.data.reward = {
            from: "system",
            to: minerAddress,
            amount: 10
        };

        newBlock.mineBlock(this.difficulty)
        this.chain.push(newBlock)
        }


    checkValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (currentBlock.hash !== currentBlock.calculateHash()) {
                return false;
            }

            if (currentBlock.previousHash !== previousBlock.hash) {
                return false;
            }
        }

        return true;
    }

    getBalance(address) {
        let balance = 0
        for (const block of this.chain) {
            const { reward, transactions } = block.data;
            if (reward?.to === address) balance += reward.amount;

            if (transactions) {
                for (const tx of transactions) {
                    if (tx.from === address) balance -= tx.amount;
                    if (tx.to === address) balance += tx.amount;
                }
            }
        }

        return balance;
    }

    validateTx(transactions) {
        for (const tx of transactions) {
            if (tx.from === 'system') continue;

            const balance = this.getBalance(tx.from);
            if (balance < tx.amount) {
                console.log(`Invalid transaction: ${tx.from} has insufficient funds`)
                return false;
            }
        }

        return true;
    }

    submitTx(tx) {
        if (this.validateTx(tx)) {
            this.txPool.push(tx)

        } else {
            console.log('Invalid Transaction')
        }
       
    }


}

class Transaction {
    constructor(amount, from, to) {
       this.txid = SHA256(to + from + amount + Date.now().toString()); 
       this.from = from;
       this.to = to;
       this.amount = amount;
       this.timestamp = new Date().toISOString();
       this.signature = null;
    }

    signTx(privateKey) {
        this.signature = SHA256(this.txid + privateKey).toString()
    }

    isValid(publicKey) {
        if (this.from === 'system') return true;
        const expectedSig = SHA256(this.txid + publicKey).toString();

        return this.signature === expectedSig;
    }

}



let jsChain = new Blockchain(); 
let transaction = new Transaction(10, 'id1', 'id2')
let transaction1 = new Transaction(12, 'id2', 'id1')
let transaction2 = new Transaction(30, 'id1', 'id2')
let transactionS = [transaction, transaction1, transaction2]
let block = new Block(Date.now(), transactionS)
jsChain.addBlock(block)

console.log(jsChain)
