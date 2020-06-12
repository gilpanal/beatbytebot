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
                this.writeResponseForIndex(filePath, data, response, extraInfo)
            })
        } else {
            this.getResponseForSong(filePath, response, extraInfo)
        }

    }
    writeResponseForIndex = (filePath, data, response, extraInfo) => {
        if(extraInfo){
            this.writeCollectionPage(filePath, response, extraInfo)
        } else {
            this.writehomePage(filePath, data, response)
        } 
        
    }
    writeCollectionPage = (filePath, response, extraInfo) => {
        const me = this
        if(extraInfo){
            const collectionName = decodeURI(extraInfo.substring(extraInfo.indexOf('=') + 1))
            this.dbhandler.db.ref('/songs/').orderByChild('collection').equalTo(collectionName).on('value', (snapshot) => {                                              
                me.writehomePage(filePath, snapshot.val(), response)                             
            })
        }
    }
    writehomePage = (filePath, data, response) => {      
        let listElelemts = ''
        if (data) {
            const keys = Object.keys(data)
            keys.forEach(element => {
                let collection = ''               
                if(data[element].collection){
                    const collectionName = decodeURI(data[element].collection)                                       
                    collection = '( '+'<a href="index.html?collection=' + data[element].collection + '">'+ collectionName+'</a>)'
                }                
                listElelemts += '<li><a href="song.html?id=' + element + '">' + data[element].title+'</a>'+ collection +'</li>'
            })
        }
        const listTracks = '<ul>' + listElelemts + '</ul>'
        const extname = String(path.extname(filePath)).toLowerCase()
        const contentType = mimeTypes[extname] || 'application/octet-stream'
        response.writeHead(200, { 'Content-Type': contentType })
        response.write('<html><meta charset="utf-8"/><head><title>Beat 8yte ꓭot</title></head><body>')
        response.write('<a href="./"><h1>Beat 8yte ꓭot</h1></a>')
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
        const chatphoto = snapshot.val().photo
        objSong.channelName = snapshot.val().title
        const doc = lyrics && this.bothelper.getDocFilePath(lyrics.file_id).then((doc_path) => {
            return doc_path
        })
        const photo = chatphoto && this.bothelper.getDocFilePath(chatphoto).then((img_path) => {            
            return img_path
        })
        const alltracks = tracks && this.bothelper.getAllTracksInfo(tracks).then((allTracks) => {
            return this.generateListOfHtml(allTracks)

        })
        const docPromise = doc || ''
        const photoPromise = photo || ''
        const tracksPromise = alltracks || ''

        Promise.all([docPromise, photoPromise, tracksPromise]).then((values) => {
            objSong.lyricsFile = values[0]
            objSong.photoFile = values[1]
            objSong.listHtml = values[2]
            callBack(filePath, objSong, response)            
        }).catch((reason) => {
            console.log(reason)
        })
    }
    generateListOfHtml = (allTracks) => {
        let listHtml = ''
        allTracks.forEach(element => {
            if(element.result){
                const messageInfo = element.result
                const audio = messageInfo.message.voice || messageInfo.message.audio
                listHtml += `<p>${messageInfo.file_path}<span>; Mime-Type: ${audio.mime_type}</span></p>`
            }
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
            response.write(`<p><i>Document: ${objSong.lyricsFile}</i><p>`)
        }
        if (objSong.photoFile) {
            response.write(`<p><i>Photo: ${objSong.photoFile}</i><p>`)
        }
        response.write('<p><i>Tracks:</i></p>')
        response.write(objSong.listHtml)
        response.end()
    }
}