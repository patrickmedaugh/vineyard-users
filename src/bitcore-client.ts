var Client = require('bitcore-wallet-client');
var utils = require('./cli-utils');
var fs = require('fs');

const bitcoreSecrets = require('../../config/secrets.json').bitcore;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export interface TransactionOutput {
    address: string
}

export interface TransactionSource {
    index: number
    confirmations: number
    address: string
    status: string
    txid: string
    time: number
    amount: number
    outputs: TransactionOutput []
}

export class BitcoreClient {
    private client;
    private isOpen: boolean = false;

    private openWallet(): Promise<void> {
        this.isOpen = true;
        console.log('Connecting to bitcore wallet.');
        return new Promise<void>((resolve) => {
            this.client.openWallet((err, ret) => {
                utils.die(err);
                console.log('Now connected to bitcore wallet.');
                resolve(ret)
            })
        })
    }

    constructor() {
        this.client = new Client({
            baseUrl: bitcoreSecrets.bwsUrl,
            // baseUrl: 'fakefakefake.gov',
            verbose: false,
        });

        const wallet = fs.readFileSync(bitcoreSecrets.walletFile, 'utf8');
        this.client.import(wallet, {})
    }

    // This is now obsolete.
    start(): Promise<void> {
        return this.isOpen
            ? new Promise<void>(r => r())
            : this.openWallet()
    }

    checkStart<T>(action: () => Promise<T>): Promise<T> {
        return this.isOpen
            ? action()
            : this.openWallet()
                .then(() => action())
    }

    getHistory(skip: number, limit?: number): Promise<TransactionSource []> {
        return this.checkStart(() => new Promise<TransactionSource []>((resolve) => {
                // const options: any = {skip: skip - 1}
                // if (typeof limit === 'number')
                //     options.limit = limit

                this.client.getTxHistory({}, function (err, transactions) {
                    utils.die(err);
                    // if (skip > 0)
                    //     transactions.unshift()

                    // for (let i = 0; i < transactions.length; ++i) {
                    //     transactions[i].index = i + skip
                    // }

                    resolve(transactions)
                })
            })
        )
    }

    // getTransaction(txid: string): Promise<TransactionSource> {
    //     return this.getHistory(index, 1)
    //         .then(transactions => transactions [0])
    // }

    createAddress(): Promise<string> {
        return this.checkStart(() => new Promise<string>((resolve) => {
            this.client.createAddress({}, function (err, record) {
                utils.die(err);
                resolve(record.address)
            })
        }))
    }
}