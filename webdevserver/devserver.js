/* https://developer.mozilla.org/en-US/docs/Learn/Server-side/Node_server_without_framework */
const mimeTypes = require('./mimetypes')
const http = require('http')
const fs = require('fs')
const path = require('path')

module.exports = class WebDevServer {
    constructor(dbhandler, bothelper) {
        this.dbhandler = dbhandler
        this.bothelper = bothelper
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
            this.dbhandler.ref.once('value', (snapshot) => {
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
                listElelemts += '<li><a href="song.html?id=' + element + '">' + data[element].title + '</a></li>'
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
        this.dbhandler.isChannelInDB(songId).then((resp) => {
            if (resp.ok) {
                const snapshot = resp.result
                this.processSongResponse(snapshot, filePath, response, this.paintListOfTracks )
            }
        })

    }
    processSongResponse = (snapshot, filePath, response, callBack) => {
        const objSong = {
            listHtml: '',
            channelName: 'Empty Channel',
            lyricsFile: null
        }
        
        const tracks = snapshot.val().tracks
        const lyrics = snapshot.val().document
        objSong.channelName = snapshot.val().title
        const doc = lyrics && this.bothelper.getDocFilePath(lyrics.file_id).then((doc_path) => {
            return doc_path
        })
        const alltracks = tracks && this.bothelper.getAllTracksInfo(tracks).then((allTracks) => {
            return this.generateListOfHtml(allTracks)

        })
        const docPromise = doc || ''
        const tracksPromise = alltracks || ''

        Promise.all([docPromise, tracksPromise]).then((values) => {
            objSong.lyricsFile = values[0]
            objSong.listHtml = values[1]
            callBack(filePath, objSong, response)            
        }).catch((reason) => {
            console.log(reason)
        })
    }
    generateListOfHtml = (allTracks) => {
        let listHtml = ''
        allTracks.forEach(element => {
            const messageInfo = element.result
            const audio = messageInfo.message.voice || messageInfo.message.audio
            const fullLink = this.bothelper.default_filepath + messageInfo.file_path
            listHtml += '<br><audio controls class="audio-file"><source src="' + fullLink + '" type="' + audio.mime_type + '"></audio>'
        })
        return listHtml
    }
    paintListOfTracks = (filePath, objSong, response) => {
        const extname = String(path.extname(filePath)).toLowerCase()
        const contentType = mimeTypes[extname] || 'application/octet-stream'
        response.writeHead(200, { 'Content-Type': contentType })
        response.write('<html><head><title>' + objSong.channelName + '</title></head><body>')
        response.write('<a class="" href="/">Back</a><h4>' + objSong.channelName + '</h4>')
        if (objSong.lyricsFile) {
            response.write('<a class="" target="_blank" href="' + objSong.lyricsFile + '">Lyrics</a><br>')
        }
        response.write('<br><button onclick="play()">PLAY ALL</button><button onclick="pause()">PAUSE</button><br>')
        response.write(objSong.listHtml)
        response.write('<script type="text/javascript">function pause(){const e=document.getElementsByClassName("audio-file");for(let l of e)l.pause()}</script>')
        response.write('<script type="text/javascript">function play(){const e=document.getElementsByClassName("audio-file");for(let l of e)l.play()}</script></body></html')
        response.end()
    }
}