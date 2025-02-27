
async function saveDocumentSignApprover({ documentId, approvers }) {
  try {
    console.log('Document ID:', documentId);

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

    // Get the current approvers, or initialize an empty array if none exist
    const currentApprovers = document.get('Approvers') || [];

    // Append new approvers to the current list
    approvers.forEach(approver => {
      // Construct the approver object with both the Pointer and IsApproved field
      const approverObject = {
        approverId: approver.id,  // Assuming approver.id is the user ID
        IsApproved: false  // This is the custom field in contracts_Document
      };

      // Log the approver object before adding it to the Approvers array
      console.log('Adding Approver:', approverObject);

      // Push the approver object to the currentApprovers array
      currentApprovers.push(approverObject);
    });

    // Update the Approvers field with the new approvers data
    document.set('Approvers', currentApprovers);

    // Save the updated document
    await document.save(null, { useMasterKey: true });

    console.log('Document Sign Approvers Updated');
    return 'Document Sign Approvers Updated';  // Success message
  } catch (error) {
    console.error('Error saving document:', error);
    throw new Error('Error saving document: ' + error.message);  // Propagate error
  }
}

async function getDocumentsByApproverId(approveIdData) {
  console.log('approveIdData===>', approveIdData);
  const approverId = approveIdData.params.approverId;
  console.log('approverId===>', approverId);
  let query = new Parse.Query('contracts_Document');
  query.equalTo('Approvers.objectId', approverId);
  try {
    const documents = await query.find({ useMasterKey: true });
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}


// Function to escape special characters in the search string
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
}

async function getApprovers(request) {
  try {
    const searchObj = { search: request.params.search || '', sessionToken: '' };
    if (request.user) {
      searchObj.CreatedBy = { __type: 'Pointer', className: '_User', objectId: request?.user?.id };
      searchObj.sessionToken = request.user.getSessionToken();

      const escapedSearch = escapeRegExp(searchObj.search); // Escape the search input
      const searchRegex = new RegExp(escapedSearch, 'i'); // Create regex once to reuse
      const contactNameQuery = new Parse.Query('contracts_Users');
      contactNameQuery.matches('Name', searchRegex);

      const conatctEmailQuery = new Parse.Query('contracts_Users');
      conatctEmailQuery.matches('Email', searchRegex);

      // Combine the two queries with OR
      const mainQuery = Parse.Query.or(contactNameQuery, conatctEmailQuery);

      // Add the common condition for 'CreatedBy'
      //mainQuery.equalTo('CreatedBy', searchObj.CreatedBy);
      mainQuery.notEqualTo('IsDeleted', true);
      let isJWT='undefined';
      //--console.log('searchObj.sessionToken',searchObj.sessionToken)
      const findOpt = isJWT ? { useMasterKey: true } : { sessionToken: searchObj.sessionToken };
      const contactRes = await mainQuery.find(findOpt);
      const _contactRes = JSON.parse(JSON.stringify(contactRes));
      return _contactRes;
    }
    else {
      throw new Parse.Error(Parse.Error.INVALID_SESSION_TOKEN, 'Invalid session token');
    }
  } catch (err) {
    console.log('err while fetch contacts', err);
    throw err;
  }

}

export default { saveDocumentSignApprover, getApprovers, getDocumentsByApproverId };


