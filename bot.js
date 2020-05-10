/* https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework */
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
}

const http = require('http')
const fs = require('fs')
const path = require('path')

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
 * WEB SERVER STUFF
 */

http.createServer((request, response) => {
    let extraInfo = null
    let filePath = '.' + request.url
    if(filePath.includes('?')){
        filePath = '.' + request.url.substring(0, request.url.indexOf('?'))
        extraInfo = request.url.substring(request.url.indexOf('?'))
    }
    if (filePath === './') {
        filePath = './index.html'
    }
    fs.readFile(filePath, (error, content) => {
        if (error) {
            handleError(error, response)
        }
        else {                     
            selectPage(filePath, response, extraInfo)           
        }
    })

}).listen(process.env.PORT || 8125)


const handleError = (error, response) => {
    if(error.code == 'ENOENT') {
        fs.readFile('./404.html', (error, content) => {
            response.writeHead(404, { 'Content-Type': 'text/html' })
            response.end(content, 'utf-8')
        })
    }
    else {
        response.writeHead(500)
        response.end('Sorry, check with the site admin for error: '+error.code+' ..\n')
    }
}
const selectPage = (filePath, response, extraInfo) =>{    

    if(filePath.includes('index')){
        ref.once('value',(snapshot) => {
            const data = snapshot.val()                      
            writeResponseForIndex(filePath, data, response)            
        })        
    } else {        
        getResponseForSong(filePath, response, extraInfo)        
    }   
    
}


const writeResponseForIndex = (filePath, data, response) => {    
    let listElelemts = ''
    if(data){
        const keys = Object.keys(data)
        keys.forEach(element => {    
            listElelemts += '<li><a href="song.html?id='+element+'">'+data[element].name+'</a></li>'       
        })
    }    
    const listTracks = '<ul>'+listElelemts+'</ul>'
    const extname = String(path.extname(filePath)).toLowerCase() 
    const contentType = mimeTypes[extname] || 'application/octet-stream'
    response.writeHead(200, { 'Content-Type': contentType })
    response.write('<html><head><title>Bunch Of Songs</title></head><body>')
    response.write('<h1>Bunch Of Songs</h1>')    
    response.write(listTracks)
    response.write('<br />')        
    response.write('</body></html')
    response.end()    
}
const getResponseForSong = (filePath, response, extraInfo) => {
    
    const songId = extraInfo.substring(extraInfo.indexOf('=') + 1)    
    const songRef = db.ref('/songs/' + songId)   
    const objSong = {
        listHtml: '',
        channelName: 'Empty Channel',
        lyricsFile: null
    } 
    songRef.once('value').then((snapshot) => {
        const snap = snapshot.val()
              
        if(snap){
            const tracks = snapshot.val().tracks
            const lyrics = snapshot.val().lyrics            
            objSong.channelName = snapshot.val().name                           
            if (tracks && tracks.length) {                 
                if (lyrics && lyrics.link!=='') {                    
                    objSong.lyricsFile = snapshot.val().lyrics.link
                }                             
                snapshot.val().tracks.forEach(element => {  
                    if(element.link !== ''){
                        const audio = element.msgInfo.voice || element.msgInfo.audio                      
                        let messageFrom = element.msgInfo.from && element.msgInfo.from.username
                    
                        const title = audio.title ? audio.title : element.msgInfo.date   
                        if(messageFrom){
                            messageFrom = 'From: ' + messageFrom
                        } else {
                            messageFrom = ''
                        }
    
                        objSong.listHtml += '<br>'+messageFrom+'<br>'+title+'<br><audio controls class="audio-file"><source src="'+element.link+'" type="'+audio.mime_type+'"></audio>'                               
                    }
                 
                })                         
            } else if (lyrics && lyrics.link!=='') {                
                objSong.lyricsFile = snapshot.val().lyrics.link
            }
        }            
        
    }).catch((error) => {
        console.log('Failed :', error)
    }).finally(()=>{
        paintListOfTracks(filePath, objSong, response)     
    }) 
    
}

const paintListOfTracks = (filePath, objSong, response) =>{    
    const extname = String(path.extname(filePath)).toLowerCase() 
    const contentType = mimeTypes[extname] || 'application/octet-stream'
    response.writeHead(200, { 'Content-Type': contentType })
    response.write('<html><head><title>'+objSong.channelName+'</title></head><body>')
    response.write('<a class="" href="/">Back</a><h4>'+objSong.channelName+'</h4>') 
    if(objSong.lyricsFile){
        response.write('<a class="" target="_blank" href="'+objSong.lyricsFile+'">Lyrics</a><br>')  
    } 
    response.write('<br><button onclick="play()">PLAY ALL</button><button onclick="pause()">PAUSE</button><br>')               
    response.write(objSong.listHtml)    
    response.write('<script type="text/javascript">function pause(){const e=document.getElementsByClassName("audio-file");for(let l of e)l.pause()}</script>')
    response.write('<script type="text/javascript">function play(){const e=document.getElementsByClassName("audio-file");for(let l of e)l.play()}</script></body></html')
    response.end()    
}


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