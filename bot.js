require('dotenv').config()
const MODE = process.env.MODE
const admin = require('firebase-admin')
const accountFirebaseFile = (MODE === 'DEV') ? './account_dev.json' : './account.json'
const serviceAccount = require(accountFirebaseFile)

/**
 * INIT DB STUFF
 * In the future it should be able to move to any DB, not only Firebase
 */
const dbURL = (MODE === 'DEV') ? process.env.DATABASE_URL_DEV : process.env.DATABASE_URL
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: dbURL
})

const db = admin.database()
const ref = db.ref('songs')


const DB_Handler =  require('./dbhandler/dbhandler')
const dbhandler = new DB_Handler(db,ref);


/**
 *  WEB DEV SERVER STUFF
 *  The following code is only for demo purpose to display 
 *  info visaully in order to easily test the bot
 */

const WebDevServer =  require('./webdevserver/devserver')
const webdevserver = new WebDevServer(db,ref);
webdevserver.init()

/**
 * BOT STUFF
 */

const { Telegraf } = require('telegraf')
const Telegram = require('telegraf/telegram')
const token = (MODE === 'DEV') ? process.env.TELEGRAM_TOKEN_DEV : process.env.TELEGRAM_TOKEN
const bot = new Telegraf(token)
const telegram = new Telegram(token)

const messageHandler = (message) =>{
    
    const chatId = message.chat.id

    dbhandler.isChannelInDB(chatId).then((response)=>{

        if(response.ok){         
            
            dbhandler.insertNewTypeInDB(message, response.result)

        } else {
            telegram.getChat(chatId).then((chatInfo)=>{
                                
                dbhandler.createNewEntry (chatId, chatInfo, message)
         
            }).catch((err)=>{
                console.log(err)
            })
        }
    })  
}
// CHANNELS

bot.on('channel_post', (ctx) => {    
    messageHandler(ctx.update.channel_post)       
})

// FOR GROUPS

bot.on('message', (ctx) => {    
    messageHandler(ctx.message)    
})

bot.launch()


console.log('Server running at port: ', process.env.PORT || 8125)