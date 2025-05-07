async function updateUseTemplateDate(documentIdData) {
    const documentId = documentIdData.params.documentId;
    try {
        // Check if documentId is provided
        if (!documentId) {
            throw new Error('Document ID is missing or invalid.');
        }

        // Query to fetch the existing document based on documentId
        const query = new Parse.Query('contracts_Document');
        const document = await query.get(documentId, { useMasterKey: true });

        // Ensure document was found
        if (!document) {
            throw new Error(`Document with ID ${documentId} not found.`);
        }

        // Retrieve the Placeholders data
        const placeHoldersData = document.get('Placeholders');

        // Process only if placeHoldersData is a non-empty array
        if (Array.isArray(placeHoldersData) && placeHoldersData.length > 0) {
            let placeHolders = [];
            for (let placeHoldersItem of placeHoldersData) {
                // Ensure the item and its 'placeHolder' property are valid arrays
                if (placeHoldersItem && Array.isArray(placeHoldersItem.placeHolder)) {
                    for (let placeholder of placeHoldersItem.placeHolder) {
                        // Ensure the placeholder object has a valid 'pos' array
                        if (placeholder && Array.isArray(placeholder.pos)) {
                            for (let item of placeholder.pos) {
                                // Check if the item type is 'date'
                                if (item.type === 'date') {
                                    item.options.response = '';
                                }
                            }
                        }
                    }
                }
                // Accumulate processed items
                placeHolders.push(placeHoldersItem);
            }
            // Set Placeholders only if the processed array is non-empty
            if (Array.isArray(placeHolders) && placeHolders.length > 0) {
                document.set('Placeholders', placeHolders);
                // Save the updated document
                await document.save(null, { useMasterKey: true });
                return 'Date cleared While Use Template';
            }
            else {
                return 'Place holder not changed';
            }
        }
        else {
            return 'Place holder not found';
        }
    } catch (error) {
        console.error('Error saving document:', error);
        throw new Error('Error saving document: ' + error.message);  
    }
}

export default updateUseTemplateDate;