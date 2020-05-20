module.exports = class DB_Handler {
    constructor(db, ref) {
        this.db = db
        this.ref = ref
    }
    isChannelInDB(chatId) {
        const response = {
            ok: false,
            result: null,
            error: null
        }
        return new Promise((resolve) => {
            this.db.ref('/songs/' + chatId).once('value').then((snapshot) => {
                const snap = snapshot.val()
                response.result = snapshot
                if (snap) {
                    response.ok = true
                } else {
                    response.ok = false
                }
            }).catch((error) => {
                response.error = error
            }).finally(() => {
                resolve(response)
            })
        })
    }
    async insertNewTypeInDB(message, snapshot) {

        let response = {
            ok: false,
            result: null,
            error: null
        }

        if (message.voice || message.audio) {

            response = await this.insertNewAudio(message, snapshot, response)

        } else if (message.document) {

            response = this.insertNewDocument(message, response)

        } else if (message.new_chat_photo) {

            response = await this.insertNewChatPhoto(message, response)

        } else if (message.text) {

            const isCollection = message.text.indexOf('collection:') === 0

            if (isCollection) {
                response = await this.insertNewCollection(message, response)
            }
        }

        return response
    }
    async insertNewDocument(message, response) {
        await this.ref.child(message.chat.id).update({
            'document': message.document
        })
        response.ok = true
        response.result = 'New document!'
        return response
    }
    async insertNewChatPhoto(message, response) {

        await this.ref.child(message.chat.id).update({
            'photo': message.new_chat_photo[0].file_id
        })
        response.ok = true
        response.result = 'New chat photo!'
        return response
    }
    async insertNewCollection(message, response) {
        let startPos = 11
        // If whitespace after 'collection:' then is removed        
        if (message.text.charAt(startPos) === ' ') {
            startPos = 12
        }
        const collectionName = message.text.substring(startPos)
        if (collectionName) {
            await this.ref.child(message.chat.id).update({
                'collection': collectionName
            })
            response.ok = true
            response.result = 'New collection!'
        }
        return response
    }

    async insertNewAudio(message, snapshot, response) {
        const audio = message.voice || message.audio
        let tracks = snapshot.val().tracks
        // Object.keys(tracks).length => to limit number tracks
        if (!tracks) {
            tracks = {}
        }
        let update = {}
        const file_key = audio.file_unique_id + '_' + message.date
        tracks[file_key] = { id: audio.file_id, message: message }
        update['/songs/' + message.chat.id + '/tracks'] = tracks
        await this.db.ref().update(update)
        response.ok = true
        response.result = 'New audio track!'
        return response
    }

    async createNewEntry(chatId, chatInfo, message) {

        let response = {
            ok: false,
            result: null,
            error: null
        }

        await this.ref.child(chatId).update({ ...chatInfo }).then(async () => {

            await this.ref.child(chatId).once('value').then(async (snapshot) => {

                response = await this.insertNewTypeInDB(message, snapshot)                            

            }).catch((error) => {
                
                response.error = error                
            })
        })        
        
        return response       
    }

    deleteTrack = (chatId, fileKey) => {
        const response = {
            ok: false,
            result: null,
            error: null
        }
        return new Promise((resolve) => {
            this.ref.child(chatId).child('tracks').update({
                [fileKey]: null
            }).then(() => {
                response.ok = true
                response.result = 'audio'
            }).catch((err) => {
                response.error = err
            }).finally(() => {
                resolve(response)
            })
        })

    }

    deleteDocument = (chatId, fileName) => {
        const response = {
            ok: false,
            result: null,
            error: null
        }
        return new Promise((resolve) => {
            this.ref.child(chatId).update({
                'document': null
            }).then(() => {
                response.ok = true
                response.result = fileName
            }).catch((err) => {
                response.error = err
            }).finally(() => {
                resolve(response)
            })
        })
    }
    setChatTitle = (chatId, newName) => {
        const response = {
            ok: false,
            result: null,
            error: null
        }        
        return new Promise((resolve) => {
            this.ref.child(chatId).update({
                'title': newName
            }).then(() => {
                response.ok = true
                response.result = 'New title: ' + newName
            }).catch((err) => {
                response.error = err
            }).finally(() => {
                resolve(response)
            })
        })
    }
}