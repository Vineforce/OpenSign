
async function saveAdditionalDocument(additionalDocumentData) {
    try {
        //create table
        const additinalDocumentObject = Parse.Object.extend('Additional_Document');
        // fill the data to object   
        let additionalDocument = new additinalDocumentObject();
        additionalDocument.set('UserId', additionalDocumentData.params.userId);
        additionalDocument.set('DocumentId', additionalDocumentData.params.documentId);
        additionalDocument.set('OriginalFileName', additionalDocumentData.params.originalFileName);
        additionalDocument.set('FileName', additionalDocumentData.params.fileName);
        additionalDocument.set('FileUrl', additionalDocumentData.params.fileUrl);
        //---save data in database
        await additionalDocument.save(null, { useMasterKey: true });
        console.log('Document Saved');
    } catch (error) {
        console.error('Error saving document:', error);
    }
}

async function removeDocument(additionalDocumentId) {
    //console.log(additionalDocumentId);
    // get all records from additioanl document table
    let additionalDocumentQuery = new Parse.Query("Additional_Document");
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

async function getAdditionalDocumentByDocumentId(documentId) {
    // Initialize the query for the "Additinal_Document" class
    let additionalDocumentQuery = new Parse.Query("Additional_Document"); 
    // Filter records based on documentId
    additionalDocumentQuery = additionalDocumentQuery.equalTo('DocumentId', documentId.params.documentId); 
    try {
        // Find all matching records
        const allDocuments = await additionalDocumentQuery.find({ useMasterKey: true }); 
         // Get specific fields from each document      
        const documentData = allDocuments.map(doc => {           
            const FileName = doc.get('FileName');
            const FileUrl = doc.get('FileUrl'); 
            const OriginalFileName = doc.get('OriginalFileName');
            return { FileName, FileUrl,OriginalFileName }; 
        });
        return documentData;
    } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
    }
}

export default { saveAdditionalDocument, removeDocument, getAdditionalDocumentByDocumentId };


