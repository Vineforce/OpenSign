
import PDF from './parsefunction/pdf/PDF.js';
import sendmailv3 from './parsefunction/sendMailv3.js';
import usersignup from './parsefunction/usersignup.js';
import DocumentAftersave from './parsefunction/DocumentAftersave.js';
import ContactbookAftersave from './parsefunction/ContactBookAftersave.js';
import sendMailOTPv1 from './parsefunction/SendMailOTPv1.js';
import AuthLoginAsMail from './parsefunction/AuthLoginAsMail.js';
import getUserId from './parsefunction/getUserId.js';
import getUserDetails from './parsefunction/getUserDetails.js';
import getDocument from './parsefunction/getDocument.js';
import getDrive from './parsefunction/getDrive.js';
import getReport from './parsefunction/getReport.js';
import TemplateAfterSave from './parsefunction/TemplateAfterSave.js';
import GetTemplate from './parsefunction/GetTemplate.js';
import callWebhook from './parsefunction/callWebhook.js';
import DocumentBeforesave from './parsefunction/DocumentBeforesave.js';
import TemplateBeforeSave from './parsefunction/TemplateBeforesave.js';
import DocumentBeforeFind from './parsefunction/DocumentAfterFind.js';
import TemplateAfterFind from './parsefunction/TemplateAfterFind.js';
import UserAfterFind from './parsefunction/UserAfterFInd.js';
import SignatureAfterFind from './parsefunction/SignatureAfterFind.js';
import TenantAterFind from './parsefunction/TenantAfterFind.js';
import VerifyEmail from './parsefunction/VerifyEmail.js';
import encryptedpdf from './parsefunction/encryptedPdf.js';
import { getSignedUrl } from './parsefunction/getSignedUrl.js';
import createBatchDocs from './parsefunction/createBatchDocs.js';
import linkContactToDoc from './parsefunction/linkContactToDoc.js';
import isextenduser from './parsefunction/isextenduser.js';
import TeamsAftersave from './parsefunction/TeamsAftersave.js';
import GetLogoByDomain from './parsefunction/GetLogoByDomain.js';
import AddAdmin from './parsefunction/AddAdmin.js';
import CheckAdminExist from './parsefunction/CheckAdminExist.js';
import UpdateExistUserAsAdmin from './parsefunction/UpdateExistUserAsAdmin.js';
import Newsletter from './parsefunction/Newsletter.js';
import getTeams from './parsefunction/getTeams.js';
import getContact from './parsefunction/getContact.js';
import updateContactTour from './parsefunction/updateContactTour.js';
import declinedocument from './parsefunction/declinedocument.js';
import getTenant from './parsefunction/getTenant.js';
import getSigners from './parsefunction/getSigners.js';
import saveFile from './parsefunction/saveFile.js';
import savecontact from './parsefunction/savecontact.js';
import isUserInContactBook from './parsefunction/isUserInContactBook.js';
import updateTourStatus from './parsefunction/updateTourStatus.js';
import updateSignatureType from './parsefunction/updatesignaturetype.js';
import updatePreferences from './parsefunction/updatePreferences.js';
import createDuplicate from './parsefunction/createDuplicate.js';
import createBatchContact from './parsefunction/createBatchContact.js';
import generateCertificatebydocId from './parsefunction/generateCertificatebydocId.js';
import fileUpload from './parsefunction/fileUpload.js';
import getUserListByOrg from './parsefunction/getUserListByOrg.js';
import editContact from './parsefunction/editContact.js';
import deleteUser from './parsefunction/deleteUser.js';

import additionalDocumentOperation from './parsefunction/additionalDocumentOperation.js';
const {saveAdditionalDocument,removeDocument,getAdditionalDocumentByDocumentId}=additionalDocumentOperation;

import documentSignApprover from './parsefunction/approvalDocumentSign.js';
const {saveDocumentSignApprover, getApprovers, getDocumentsByApproverId}=documentSignApprover;

// This afterSave function triggers after an object is added or updated in the specified class, allowing for post-processing logic.
Parse.Cloud.afterSave('contracts_Document', DocumentAftersave);
Parse.Cloud.afterSave('contracts_Contactbook', ContactbookAftersave);
Parse.Cloud.afterSave('contracts_Template', TemplateAfterSave);
Parse.Cloud.afterSave('contracts_Teams', TeamsAftersave);

// This beforeSave function triggers before an object is added or updated in the specified class, allowing for validation or modification.
Parse.Cloud.beforeSave('contracts_Document', DocumentBeforesave);
Parse.Cloud.beforeSave('contracts_Template', TemplateBeforeSave);

// This afterFind function triggers after a query retrieves objects from the specified class, allowing for post-processing of the results.
Parse.Cloud.afterFind(Parse.User, UserAfterFind);
Parse.Cloud.afterFind('contracts_Document', DocumentBeforeFind);
Parse.Cloud.afterFind('contracts_Template', TemplateAfterFind);
Parse.Cloud.afterFind('contracts_Signature', SignatureAfterFind);
Parse.Cloud.afterFind('partners_Tenant', TenantAterFind);

// This define function creates a custom Cloud Function that can be called from the client-side, enabling custom business logic on the server.
Parse.Cloud.define('signPdf', PDF);
Parse.Cloud.define('sendmailv3', sendmailv3);
Parse.Cloud.define('usersignup', usersignup);
Parse.Cloud.define('SendOTPMailV1', sendMailOTPv1);
Parse.Cloud.define('AuthLoginAsMail', AuthLoginAsMail);
Parse.Cloud.define('getUserId', getUserId);
Parse.Cloud.define('getUserDetails', getUserDetails);
Parse.Cloud.define('getDocument', getDocument);
Parse.Cloud.define('getDrive', getDrive);
Parse.Cloud.define('getReport', getReport);
Parse.Cloud.define('getTemplate', GetTemplate);
Parse.Cloud.define('callwebhook', callWebhook);
Parse.Cloud.define('verifyemail', VerifyEmail);
Parse.Cloud.define('encryptedpdf', encryptedpdf);
Parse.Cloud.define('getsignedurl', getSignedUrl);
Parse.Cloud.define('batchdocuments', createBatchDocs);
Parse.Cloud.define('linkcontacttodoc', linkContactToDoc);
Parse.Cloud.define('isextenduser', isextenduser);
Parse.Cloud.define('getlogobydomain', GetLogoByDomain);
Parse.Cloud.define('addadmin', AddAdmin);
Parse.Cloud.define('checkadminexist', CheckAdminExist);
Parse.Cloud.define('updateuserasadmin', UpdateExistUserAsAdmin);
Parse.Cloud.define('newsletter', Newsletter);
Parse.Cloud.define('getteams', getTeams);
Parse.Cloud.define('getcontact', getContact);
Parse.Cloud.define('updatecontacttour', updateContactTour);
Parse.Cloud.define('declinedoc', declinedocument);
Parse.Cloud.define('gettenant', getTenant);
Parse.Cloud.define('getsigners', getSigners);
Parse.Cloud.define('savefile', saveFile);
Parse.Cloud.define('savecontact', savecontact);
Parse.Cloud.define('isuserincontactbook', isUserInContactBook);
Parse.Cloud.define('updatetourstatus', updateTourStatus);
Parse.Cloud.define('updatesignaturetype', updateSignatureType);
Parse.Cloud.define('updatepreferences', updatePreferences);
Parse.Cloud.define('createduplicate', createDuplicate);
Parse.Cloud.define('createbatchcontact', createBatchContact);
Parse.Cloud.define('generatecertificate', generateCertificatebydocId);
Parse.Cloud.define('fileupload', fileUpload);
Parse.Cloud.define('getuserlistbyorg', getUserListByOrg);
Parse.Cloud.define('editcontact', editContact);
Parse.Cloud.define('deleteUser', async (request) => {
    const { contractsUserId } = request.params;
    return deleteUser(contractsUserId);
  });

//These  functions will add/save, get and remove/delete the additional documents
Parse.Cloud.define('saveAdditionalDocument',saveAdditionalDocument);
Parse.Cloud.define('removeDocument',removeDocument);
Parse.Cloud.define('getAdditionalDocumentByDocumentId',getAdditionalDocumentByDocumentId);

// function for document sign approval process
Parse.Cloud.define('saveDocumentSignApprover', async (request) => {
  return await saveDocumentSignApprover(request.params);  // Call the function from approvaldocumentsign.js
});

Parse.Cloud.define('getDocumentsByApproverId', getDocumentsByApproverId);
Parse.Cloud.define('getApprovers',getApprovers);