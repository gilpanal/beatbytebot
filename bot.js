const { TELEGRAM_TOKEN, DATABASE_URL, ACCOUNT_FILE } = require('./config/env_vars')
const admin = require('firebase-admin')
const serviceAccount = require(ACCOUNT_FILE)

/**
 * INIT DB STUFF
 * In the future it should be able to move to any DB, not only Firebase
 */
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: DATABASE_URL
})

const db = admin.database()
const ref = db.ref('songs')


const DB_Handler = require('./dbhandler/dbhandler')
const dbhandler = new DB_Handler(db, ref)

/**
 * INIT BOT STUFF
 */

const { Telegraf } = require('telegraf')
const Telegram = require('telegraf/telegram')
const bot = new Telegraf(TELEGRAM_TOKEN)
const telegram = new Telegram(TELEGRAM_TOKEN)
const BotHelpers = require('./bot_helpers')
const bothelper = new BotHelpers(dbhandler, telegram)

/**
 *  WEB DEV SERVER STUFF
 *  The following code is only for demo purpose to display 
 *  info visually in order to easily test the info retrieval
 */

const WebDevServer = require('./webdevserver/devserver')
const webdevserver = new WebDevServer(dbhandler, bothelper)
webdevserver.init()


/**
 * BOT STUFF
 */



// CHANNELS

bot.on('channel_post', async (ctx) => {
  const response = await bothelper.messageHandler(ctx.update.channel_post)  
  if (response && response.ok) {
    ctx.reply(response.result)
  }

})

bot.on('edited_channel_post', async (ctx) => {
  if (ctx.update.edited_channel_post.caption === 'delete') {
    const isDeleted = await bothelper.deleteMessage(ctx.update.edited_channel_post)
    if (isDeleted.ok) {
      ctx.reply(`File ${isDeleted.result} deleted`)
    }
  }
})

// GROUPS

bot.on('message', async (ctx) => {
  const response = await bothelper.messageHandler(ctx.message)  
  if (response && response.ok) {
    ctx.reply(response.result)
  }
  
})

bot.on('edited_message', async (ctx) => {

  if (ctx.update.edited_message.caption === 'delete') {
    const isDeleted = await bothelper.deleteMessage(ctx.update.edited_message)
    if (isDeleted.ok) {
      ctx.reply(`File ${isDeleted.result} deleted`)
    }
  }
})

bot.launch()

console.log('Server running at port: ', process.env.PORT || 8125)