const MODE = 'PROD' // DEV, STAGE, PROD

const ENVIRONMENTS = {
    PROD : {
        TELEGRAM_TOKEN: '',
        DATABASE_URL: '',
        ACCOUNT_FILE: './config/account.json'
    },
    STAGE : {
        TELEGRAM_TOKEN: '',
        DATABASE_URL: '',
        ACCOUNT_FILE: './config/account_stage.json'
    },
    DEV: {
        TELEGRAM_TOKEN: '',
        DATABASE_URL: '',
        ACCOUNT_FILE: './config/account_dev.json'
    }
}

module.exports = {
    TELEGRAM_TOKEN: ENVIRONMENTS[MODE].TELEGRAM_TOKEN,
    DATABASE_URL: ENVIRONMENTS[MODE].DATABASE_URL,
    ACCOUNT_FILE: ENVIRONMENTS[MODE].ACCOUNT_FILE   
}