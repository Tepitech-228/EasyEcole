
import axios from "axios"
const env = process.env.NODE_ENV || 'development';

const config = require('../config/cinetpay.json')[env];

export type MobileMoneyCinetpayResponse = {
    code: string
    message: string
    description: string
    data: {
        payment_token: string,
        payment_url: string
    }
    api_response_id: string
};

export class MobileMoneyCinetpay {
    private static instance: MobileMoneyCinetpay;

    constructor() {
    }

    public static getInstance(): MobileMoneyCinetpay {
        if (!MobileMoneyCinetpay.instance) {
            MobileMoneyCinetpay.instance = new MobileMoneyCinetpay();
        }

        return MobileMoneyCinetpay.instance;
    }

    async init(): Promise<MobileMoneyCinetpayResponse> {
        var data = JSON.stringify({
            "apikey": config.apikey,
            "site_id": config.site_id,
            "transaction_id": Math.floor(Math.random() * 100000000).toString(), //
            "amount": 100,
            "currency": "XOF",
            "alternative_currency": "",
            "description": " TEST INTEGRATION ",
        });

        var options = {
            method: 'post',
            url: config.url,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        return new Promise((resolve, reject) => {
            axios(options)
                .then(function (response) {
                    const res = response.data as MobileMoneyCinetpayResponse
                    console.log(res);
                    resolve(res)
                })
                .catch(function (error) {
                    console.log("Error: ", error)
                    reject(error);
                })
        })
    }

    async enregistrerPaiement(montant: number, description?: string): Promise<MobileMoneyCinetpayResponse> {
        var data = JSON.stringify({
            "apikey": config.apikey,
            "site_id": config.site_id,
            "transaction_id": Math.floor(Math.random() * 100000000).toString(), //
            "amount": montant,
            "currency": "XOF",
            "alternative_currency": "",
            "description": description ?? "Easy Ecole",
            // "customer_id": "172",
            // "customer_name": "KOUADIO",
            // "customer_surname": "Francisse",
            // "customer_email": "harrissylver@gmail.com",
            // "customer_phone_number": "+225004315545",
            // "customer_address": "Antananarivo",
            // "customer_city": "Antananarivo",
            // "customer_country": "CM",
            // "customer_state": "CM",
            // "customer_zip_code": "065100",
            // "notify_url": "https://webhook.site/d1dbbb89-52c7-49af-a689-b3c412df820d",
            // "return_url": "https://webhook.site/d1dbbb89-52c7-49af-a689-b3c412df820d",
            "channels": "ALL",
            "lang": "FR",
        });

        var options = {
            method: 'post',
            url: config.url,
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        return new Promise((resolve, reject) => {
            axios(options)
                .then(function (response) {
                    const res = response.data as MobileMoneyCinetpayResponse
                    console.log(res);
                    resolve(res)
                })
                .catch(function (error) {
                    console.log("Error: ", error)
                    reject(error);
                })
        })
    }
}