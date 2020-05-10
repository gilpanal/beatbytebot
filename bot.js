require('dotenv').config()
const MODE = process.env.MODE
const admin = require('firebase-admin')
const accountFirebaseFile = (MODE === 'DEV') ? './account_dev.json' : './account.json'
const serviceAccount = require(accountFirebaseFile)

const TelegramBot = require('node-telegram-bot-api')

const token = (MODE === 'DEV') ? process.env.TELEGRAM_TOKEN_DEV : process.env.TELEGRAM_TOKEN
const bot = new TelegramBot(token, {polling: true})

/**
 * INIT STUFF
 */
const dbURL = (MODE === 'DEV') ? process.env.DATABASE_URL_DEV : process.env.DATABASE_URL
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: dbURL
})

const db = admin.database()
const ref = db.ref('songs')

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

 
bot.on('message', (msg) => {    
    handleMessage(msg)   
})

bot.on('channel_post', (msg) => {     
    handleMessage(msg)    
})

const handleMessage = (msg) => {    
    const audio = msg.voice || msg.audio
    const lyrics = msg.document 
    if(audio){
        bot.getFileLink(audio.file_id).then((filelink) => {
            insertNewAudioIntoDB(filelink, msg)            
        }).catch((error) => {
            console.log(error.code)  // => 'ETELEGRAM'
            console.log(error.response.body) // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
        })
    } else if (lyrics) {
        bot.getFileLink(lyrics.file_id).then((filelink) => {
            insertNewLyricsIntoDB(filelink, msg)            
        }).catch((error) => {
            console.log(error.code)  // => 'ETELEGRAM'
            console.log(error.response.body) // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
        })
    }  
}
const insertNewAudioIntoDB = (filelink, msg) => {
    const chatId = msg.chat.id        
    const songRef = db.ref('/songs/' + chatId)   
    songRef.once('value').then((snapshot) => {
        const snap = snapshot.val()             
        if(snap){
            let tracks = snapshot.val().tracks                    
            let update = {}                
            if(tracks[0].link === ''){
                tracks.shift()
            }
            tracks.push({link:filelink, msgInfo:msg})                
            update['/songs/' + chatId + '/tracks'] = tracks         
            db.ref().update(update)      
        } else {  
            // DB empty          
            ref.child(chatId).set({
                name: msg.chat.title,
                lyrics: {link:'', msgInfo:''},
                tracks: [{link:filelink, msgInfo:msg}]
            })
        }       
        
    }).catch((error) => {
        console.log('Failed :', error)
    })   
}
const insertNewLyricsIntoDB = (filelink, msg) => {
    const chatId = msg.chat.id        
    const songRef = db.ref('/songs/' + chatId)   
    songRef.once('value').then((snapshot) => {
        const snap = snapshot.val()
        if(snap){                          
            let update = {}                
            update['/songs/' + chatId + '/lyrics'] = {link:filelink, msgInfo:msg}       
            db.ref().update(update)                         
        } else {    
            // DB empty          
            ref.child(chatId).set({
                name: msg.chat.title,
                lyrics: {link:filelink, msgInfo:msg},
                tracks:[{link:'', msgInfo:''}]
            })
        }       
        
    }).catch((error) => {
        console.log('Failed :', error)
    })   
}

console.log('Server running at port: ', process.env.PORT || 8125)