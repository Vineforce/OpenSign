
async function saveDocumentSignApprover({ documentId, approvers }) {
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

    // Get the current approvers, or initialize an empty array if none exist
    const currentApprovers = document.get('Approvers') || [];

    // Append new approvers to the current list
    approvers.forEach(approver => {
      // Construct the approver object with both the Pointer and IsApproved field
      const approverObject = {
        contracts_Users_Id: approver.contracts_Users_Id,
        HasApproved: 'ApprovalPending' 
      };
      // Push the approver object to the currentApprovers array
      currentApprovers.push(approverObject);
    });

    // Update the Approvers field with the new approvers data
    document.set('Approvers', currentApprovers);

    // Save the updated document
    await document.save(null, { useMasterKey: true });
    return 'Document Sign Approvers Updated';
  } catch (error) {
    console.error('Error saving document:', error);
    throw new Error('Error saving document: ' + error.message);  // Propagate error
  }
}

async function getDocumentsByApproverId(approveIdData) {
  try {
    // This is _User table id
    const approverUserId = approveIdData.params.approverId;
    // Get Contracts_Users table id
    const getapproverContracts_Users_IdQuery = new Parse.Query('contracts_Users');
    getapproverContracts_Users_IdQuery.equalTo('UserId', { __type: 'Pointer', className: '_User', objectId: approverUserId });
    const approverContract_UsersIdData = await getapproverContracts_Users_IdQuery.first({ useMasterKey: true });
    const approverContracts_Users_Id = approverContract_UsersIdData.id
    const whichDocumentSignApprovalFlag = approveIdData.params.documentSignApprovalFlag;

    let query = new Parse.Query('contracts_Document');
    query.select('Name', 'Description', 'Signers', 'Approvers', 'DocSentAt', 'URL', 'SignedUrl', 'CreatedBy', '_id');  // Only fetch these columns
    query.notEqualTo('IsDeclined', true);
    query.notEqualTo('IsArchive', true);
    query.descending('DocSentAt');

    const results = await query.find({ useMasterKey: true });
    const filteredResults = results.filter((document) => {
      const approvers = document.get('Approvers');
      if (Array.isArray(approvers)) {
        return approvers.some((approver) => {
          return approver.contracts_Users_Id === approverContracts_Users_Id && approver.HasApproved === whichDocumentSignApprovalFlag;
        });
      }
      return false;
    });

    const documents = filteredResults;// await query.find({ useMasterKey: true });

    const processedDocuments = await Promise.all(documents.map(async (document) => {

      // get approver Email Ids  
      const approvers = document.get('Approvers') || [];
      const approverEmails = await Promise.all(approvers.map(async (approver) => {
        const userId = approver.contracts_Users_Id;
        const approverQuery = new Parse.Query('contracts_Users');
        approverQuery.equalTo('objectId', userId);
        const approverUser = await approverQuery.first({ useMasterKey: true });
        if (approverUser) {
          return approverUser.get('Email');
        }
        return null;
      }));

      // get signers email id
      const signers = document.get('Signers') || [];
      const SignerEmails = await Promise.all(signers.map(async (signer) => {
        const signerUserId = signer.id;
        if (!signerUserId) {
          return null;
        }
        const signerQuery = new Parse.Query('contracts_Contactbook');
        signerQuery.equalTo('objectId', signerUserId);
        const signerUser = await signerQuery.first({ useMasterKey: true })
        if (signerUser) {
          return signerUser.get('Email');
        }
        return null;
      }));

      // get the owner name 
      let CreatedById = document.get('CreatedBy').id;
      const userTableQuery = new Parse.Query('_User');
      userTableQuery.equalTo('objectId', CreatedById);
      userTableQuery.select('name', 'email');
      const user = await userTableQuery.first({ useMasterKey: true });
      let ownerUserName = '';
      let ownerUserEmail = '';
      if (user) {
        ownerUserName = user.get('name');
        ownerUserEmail = user.get('email');
      }

      return {
        Name: document.get('Name'),
        Description: document.get('Description'),
        Signers: document.get('Signers'),
        Approvers: document.get('Approvers'),
        SignersEmail: SignerEmails,
        ApproversEmail: approverEmails,
        DocSentAt: document.get('DocSentAt'),
        URL: document.get('URL'),
        SignedUrl: document.get('SignedUrl'),
        ownerUserName: ownerUserName,
        ownerUserEmail: ownerUserEmail,
        DocumentId: document.id,
      };

    }));

    return processedDocuments;
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
      let isJWT = 'undefined';
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


async function approveRejectDocumentSign(approveRejectData) {
  try {
    const documentId = approveRejectData.params.documentId;
    const approvedorrejected = approveRejectData.params.approvedorrejected;
    const comment= approveRejectData.params.comment;
    // This is _User table id
    const approverUserId = approveRejectData.params.approverUserId;
    // Get Contracts_Users table id
    const getapproverContracts_Users_IdQuery = new Parse.Query('contracts_Users');
    getapproverContracts_Users_IdQuery.equalTo('UserId', { __type: 'Pointer', className: '_User', objectId: approverUserId });
    const approverContract_UsersIdData = await getapproverContracts_Users_IdQuery.first({ useMasterKey: true });
    const approverContracts_Users_Id = approverContract_UsersIdData.id

    // Query to fetch the existing document based on documentId
    const query = new Parse.Query('contracts_Document');
    query.equalTo('objectId', documentId);
    query.select('Approvers');
    const document = await query.first({ useMasterKey: true });
    // Ensure document was found
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found.`);
    }

    // Get the current approvers, or initialize an empty array if none exist
    const currentApprovers = document.get('Approvers') || [];
    currentApprovers.forEach(approver => {
      if (approver.contracts_Users_Id == approverContracts_Users_Id) {
        approver.HasApproved = approvedorrejected;
        approver.ApprovedRejectedOn = new Date();
        approver.comment = comment;
      }
    });

    // Update the Approvers field with the new approvers data
    document.set('Approvers', currentApprovers);
    // Save the updated document
    await document.save(null, { useMasterKey: true });
    return true;

  } catch (err) {
    console.log('err while updating approve reject status', err);
    throw err;
  }

}

async function hasAllApproverApproved(documentData) {
  try {
    const documentId = documentData.params.documentId;
    if (!documentId) {
      throw new Error('Document ID is missing or invalid.');
    }

    // Query to fetch the existing document based on documentId
    const query = new Parse.Query('contracts_Document');
    query.equalTo('objectId', documentId);
    query.select('Approvers');
    const document = await query.first({ useMasterKey: true });

    // Ensure document was found
    if (!document) {
      throw new Error(`Document with ID ${documentId} not found.`);
    }

    // Get the current approvers, or initialize an empty array if none exist
    const currentApprovers = document.get('Approvers') || [];
    let hasAllApproved = currentApprovers.every(x => x.HasApproved === 'Approved');
    return hasAllApproved;
    
  } catch (err) {
    console.log('err getting all approver approved status', err);
    throw err;
  }
}

export default { saveDocumentSignApprover, getApprovers, getDocumentsByApproverId, approveRejectDocumentSign, hasAllApproverApproved };


