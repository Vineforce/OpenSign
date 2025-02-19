import axios from 'axios';
import { cloudServerUrl } from '../../Utils.js';
const serverUrl = cloudServerUrl; //process.env.SERVER_URL;
const APPID = process.env.APP_ID;
const masterKEY = process.env.MASTER_KEY;

async function saveAdditionalDocument(additionalDocumentData) {
    try {
        //create table
        const additinalDocumentObject = Parse.Object.extend('Additional_Document');    
        // fill the data to object   
        let additionalDocument = new additinalDocumentObject();    
        additionalDocument.set('UserId', additionalDocumentData.params.userId);
        additionalDocument.set('DocumentId', additionalDocumentData.params.documentId);
        additionalDocument.set('FileName', additionalDocumentData.params.fileName);
        additionalDocument.set('FileUrl', additionalDocumentData.params.fileUrl);
        //---save data in database
        await additionalDocument.save(null, { useMasterKey: true });
    } catch (error) {
        console.error('Error deleting document:', error);
    }
}

async function removeDocument(additionalDocumentId)
{
    //console.log(additionalDocumentId);
    // get all records from additioanl document table
    let additionalDocumentQuery = new Parse.Query("Additinal_Document");  
    //  filter the record according to input 
    additionalDocumentQuery = additionalDocumentQuery.equalTo('objectId', additionalDocumentId.params.documentId);
    try {
        // Find the document to delete
        const documentToDelete = await additionalDocumentQuery.first({ useMasterKey: true });        
        //---console.log(documentToDelete);
        if (documentToDelete) {
            console.log('Document found:', documentToDelete);
            // Delete the document
            await documentToDelete.destroy({ useMasterKey: true });
            console.log('Document deleted successfully');
        } else {
            console.log('Document to be deleted not found');
        }
    } catch (error) {
        console.error('Error deleting document:', error);
    }
}

export default {saveAdditionalDocument,removeDocument};


