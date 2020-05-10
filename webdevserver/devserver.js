/* https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework */
const mimeTypes = require('./mimetypes')
const http = require('http')
const fs = require('fs')
const path = require('path')

module.exports = class WebDevServer {
    constructor(db, ref) {
        this.db = db;
        this.ref = ref;
    }

    init() {
        http.createServer((request, response) => {
            let extraInfo = null
            let filePath = '.' + request.url
            if (filePath.includes('?')) {
                filePath = '.' + request.url.substring(0, request.url.indexOf('?'))
                extraInfo = request.url.substring(request.url.indexOf('?'))
            }
            if (filePath === './') {
                filePath = './index.html'
            }
            fs.readFile(filePath, (error, content) => {
                if (error) {
                    this.handleError(error, response)
                }
                else {
                    this.selectPage(filePath, response, extraInfo)
                }
            })

        }).listen(process.env.PORT || 8125)
    }

    handleError = (error, response) => {
        if (error.code == 'ENOENT') {
            fs.readFile('./404.html', (error, content) => {
                response.writeHead(404, { 'Content-Type': 'text/html' })
                response.end(content, 'utf-8')
            })
        }
        else {
            response.writeHead(500)
            response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n')
        }
    }
    selectPage = (filePath, response, extraInfo) => {

        if (filePath.includes('index')) {
            this.ref.once('value', (snapshot) => {
                const data = snapshot.val()
                this.writeResponseForIndex(filePath, data, response)
            })
        } else {
            this.getResponseForSong(filePath, response, extraInfo)
        }

    }
    writeResponseForIndex = (filePath, data, response) => {
        let listElelemts = ''
        if (data) {
            const keys = Object.keys(data)
            keys.forEach(element => {
                listElelemts += '<li><a href="song.html?id=' + element + '">' + data[element].name + '</a></li>'
            })
        }
        const listTracks = '<ul>' + listElelemts + '</ul>'
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
    getResponseForSong = (filePath, response, extraInfo) => {

        const songId = extraInfo.substring(extraInfo.indexOf('=') + 1)
        const songRef = this.db.ref('/songs/' + songId)
        const objSong = {
            listHtml: '',
            channelName: 'Empty Channel',
            lyricsFile: null
        }
        songRef.once('value').then((snapshot) => {
            const snap = snapshot.val()

            if (snap) {
                const tracks = snapshot.val().tracks
                const lyrics = snapshot.val().lyrics
                objSong.channelName = snapshot.val().name
                if (tracks && tracks.length) {
                    if (lyrics && lyrics.link !== '') {
                        objSong.lyricsFile = snapshot.val().lyrics.link
                    }
                    snapshot.val().tracks.forEach(element => {
                        if (element.link !== '') {
                            const audio = element.msgInfo.voice || element.msgInfo.audio
                            let messageFrom = element.msgInfo.from && element.msgInfo.from.username

                            const title = audio.title ? audio.title : element.msgInfo.date
                            if (messageFrom) {
                                messageFrom = 'From: ' + messageFrom
                            } else {
                                messageFrom = ''
                            }

                            objSong.listHtml += '<br>' + messageFrom + '<br>' + title + '<br><audio controls class="audio-file"><source src="' + element.link + '" type="' + audio.mime_type + '"></audio>'
                        }

                    })
                } else if (lyrics && lyrics.link !== '') {
                    objSong.lyricsFile = snapshot.val().lyrics.link
                }
            }

        }).catch((error) => {
            console.log('Failed :', error)
        }).finally(() => {
            this.paintListOfTracks(filePath, objSong, response)
        })

    }
    paintListOfTracks = (filePath, objSong, response) =>{    
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
};