module.exports = class Bot_Helper {
    constructor(dbhandler, telegram, token) {
        this.dbhandler = dbhandler
        this.telegram = telegram 
        this.token = token
        this.default_filepath = 'https://api.telegram.org/file/bot'+token+'/'
    }
    messageHandler = (message) =>{
    
        const chatId = message.chat.id
    
        this.dbhandler.isChannelInDB(chatId).then((response)=>{
    
            if(response.ok){         
                
                this.dbhandler.insertNewTypeInDB(message, response.result)
    
            } else {
                this.telegram.getChat(chatId).then((chatInfo)=>{  

                    this.dbhandler.createNewEntry (chatId, chatInfo, message)             
                    
                }).catch((err)=>{
                    console.log(err)
                })
            }
        })  
    }
    deleteMessage = async (edited_message) => {     
        if(edited_message.document){            
            const docDeletion = await this.dbhandler.deleteDocument(edited_message.chat.id, edited_message.document.file_name)
            return docDeletion
        } 
        else if ( edited_message.audio || edited_message.voice) {                    
            const audioFile = edited_message.audio || edited_message.voice      
            const file_key =  audioFile.file_unique_id + '_' + edited_message.date  
            const trackDeletion = await this.dbhandler.deleteTrack(edited_message.chat.id, file_key)
            return trackDeletion
        }
    }
    
    getDocFilePath = async (file_id) => {
        const doc = await this.fetchFileInfo(file_id, {})       
        return this.default_filepath+doc.result.file_path 
    }
    fetchFileInfo = (file_id, message) => {
        const response = {
            ok: false,
            result: null,
            error: null
        }
        return new Promise(resolve => {
            this.telegram.getFile(file_id).then((fileInfo)=>{                
                response.ok = true 
                message.file_path = fileInfo.file_path    
                response.result = message 
        
            }).catch((err)=>{
                response.error = err
            }).finally(()=>{
                resolve(response)
            })
        })
    }
    getAllTracksInfo = async (tracks)=> {
        let alltracks = []
        for(const key in tracks){           
            const file_id = tracks[key].id
            let trackInfo = await this.fetchFileInfo(file_id,tracks[key])
            alltracks.push(trackInfo)         
        }
        return alltracks         
    }

}