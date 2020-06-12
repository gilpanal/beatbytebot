module.exports = class Bot_Helper {
    constructor(dbhandler, telegram) {
        this.dbhandler = dbhandler
        this.telegram = telegram 
    }
    messageHandler = async (message) =>{
    
        const chatId = message.chat.id

        let result = {
            ok: false, 
            result: null,          
            error: null
        }
        // if you talk directly to bot we do not store the chat
        if(message.chat.title){
            await this.dbhandler.isChannelInDB(chatId).then(async (response)=>{
    
                if(response.ok){         
                    
                    if(message.new_chat_title){
                     
                        const titleChanged = await this.dbhandler.setChatTitle(message.chat.id, message.new_chat_title)                                             
                        result = titleChanged

                    } else {
                     
                        const insert = await this.dbhandler.insertNewTypeInDB(message, response.result)                                            
                        result = insert
                    }
        
                } else {
                    await this.telegram.getChat(chatId).then(async (chatInfo)=>{  
    
                        const create  = await this.dbhandler.createNewEntry (chatId, chatInfo, message)                              
                        result = create
                        
                    }).catch((err)=>{                    
                        result.error = err                    
                    })
                }
            }) 
        }
       
        return result 
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
        return doc.result ? doc.result.file_path : null
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