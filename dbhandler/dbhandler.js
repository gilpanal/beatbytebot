module.exports = class DB_Handler {
    constructor(db, ref) {
        this.db = db;
        this.ref = ref;
    }

    isChannelInDB(chatId) {
        const response = {
            ok: false,
            result: null,
            error: null
        }
        return new Promise((resolve, reject) => {
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
        });
    }
    insertNewTypeInDB(message, snapshot) {

        if (message.voice || message.audio) {
            this.insertNewAudioEntry (message, snapshot)
        } else if (message.document) {
            this.ref.child(message.chat.id).update({
                "document": message.document
            });
        } else if (message.new_chat_photo) {
            this.ref.child(message.chat.id).update({
                "photo": message.new_chat_photo
            });
        } 

    }

    insertNewAudioEntry (message, snapshot) {
        const audio = message.voice || message.audio        
        let tracks = snapshot.val().tracks
        if (!tracks) {
            tracks = {}
        }
        let update = {}
        tracks[audio.file_id] = { id: audio.file_id, message: message }
        update['/songs/' + message.chat.id + '/tracks'] = tracks
        this.db.ref().update(update)
    }

    createNewEntry (chatId, chatInfo, message) {

        this.ref.child(chatId).update({...chatInfo}).then(()=>{
                   
            this.ref.child(chatId).once('value').then((snapshot) => {
                 
               this.insertNewTypeInDB(message, snapshot)
                
            }).catch((error) => {
                console.log('Failed createNewEntry:', error)
            })                     
        })
    }

};