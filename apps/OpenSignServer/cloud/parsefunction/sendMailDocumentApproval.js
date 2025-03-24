import { appName, smtpenable } from '../../Utils.js';

async function getApproversEmail(docId) {
  try {
    const query = new Parse.Query('contracts_Document');
    query.equalTo('objectId', docId);
    const res = await query.first({ useMasterKey: true });
    const _res = res.toJSON();
    const approverIds = _res.Approvers.map(approver => approver.contracts_Users_Id);
    // get approver's email
    const queryContractUsers = new Parse.Query('contracts_Users');
    queryContractUsers.containedIn('objectId', approverIds);
    const users = await queryContractUsers.find({ useMasterKey: true });
    const emails = users.map(user => user.get('Email')).join('; ');
    return emails;
  } catch (err) {
    console.log('err ', err);
  }
}

async function sendMailDocumentApproval(request) {
  try {
    let recipientEmailIds = '';
    if (request.params?.docId) {
      recipientEmailIds = await getApproversEmail(request.params?.docId);
    }

    const mailsender = smtpenable ? process.env.SMTP_USER_EMAIL : process.env.MAILGUN_SENDER;

    const approvalEmail = `<html><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8' /></head><body><div>
    <div style='background-color: rgb(245, 245, 245) !important; padding: 20px;'><div style='background-color: white !important;'><div>
    <img style='padding:20px' height='50' src='https://www.excis.com/assets/images/main-logo.png' data-imagetype='External'></div>
    <div style='padding: 2px; font-family: system-ui; !important;'><div style='box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;background-color:white;'>
    <div style='background-color:red;padding:2px;font-family:system-ui; background-color:#47a3ad;'>
    <p style='font-size:20px;font-weight:400;color:white;padding-left:20px'>Document Approval Notification</p></div><div style='padding:20px'>
    <p style='font-family:system-ui;font-size:14px'>You have a document in ${appName} for approval. Please click <a href='https://docusign.excis.me' target='_blank'
    rel='noopener noreferrer'> here </a>to login and approve the document</p>
    <p style='text-decoration: none; font-weight: bolder; color:blue;font-size:45px;margin:20px'></p></div></div></div></div>    
    <div style='background-color: #f5f5f5;'>
    <p>This is an automated email from Excis. For any queries regarding this email, please contact Excis. If you think this email is inappropriate or spam, 
    you may file a complaint with Excis <a data-auth='NotApplicable' rel='noopener noreferrer' target='_blank' href='https://excis.com' data-linkindex='0'>here
    </a>.</p></div></div></div></div></body></html>`;

    if(recipientEmailIds == '')
    {
      console.log('recipient is missing');
      return false;
    }

    await Parse.Cloud.sendEmail({
      from: appName + '<' + mailsender + '>',
      recipient: recipientEmailIds,
      subject: `${appName} Document Approval`,
      text: 'This is sample text and will not appear anywhere.',
      html: approvalEmail,
    });
    return true;
  } catch (err) {
    console.log('err in sendMailDocumentApproval');
    console.log(err);
    return err;
  }
}

async function getDocumentOwnerApproverComment(docId, approverId) {
  // Fetch the document by docId
  const query = new Parse.Query('contracts_Document');
  query.equalTo('objectId', docId);
  const res = await query.first({ useMasterKey: true });
  if (!res) {
    throw new Error('Document not found');
  }  
  const _res = res.toJSON();
  let documentName = _res.Name;
  let createdBy = _res.CreatedBy.objectId;

  // Fetch the owner (createdBy user) details
  const queryUsers = new Parse.Query('_User');
  queryUsers.equalTo('objectId', createdBy); 
  const userCreatedBy = await queryUsers.first({ useMasterKey: true });
  if (!userCreatedBy) {
    throw new Error('Owner not found');
  }
  let ownerName = userCreatedBy.get('name');
  let ownerEmail = userCreatedBy.get('email');

  // Fetch the approver's details from contracts_Users table
  const queryContractUsers = new Parse.Query('contracts_Users');
  queryContractUsers.equalTo('UserId', { __type: 'Pointer', className: '_User', objectId: approverId });
  const user = await queryContractUsers.first({ useMasterKey: true });
  if (!user) {
    throw new Error('Approver not found');
  }
  let approverName = user.get('Name');
  
  // Find the approver's comment in the Approvers array from the document
  let approver = _res.Approvers.find(approver => approver.contracts_Users_Id === user.id);
  // Check if the approver exists in the array  
  let approverComment = approver ? approver.comment.replace(/\n/g, '<br>') : 'No comment provided'; 

  // Return the required fields
  return {
    documentName,
    ownerName,
    ownerEmail,
    approverName,
    approverComment
  };
}

async function sendMailDocumentSignApprovalRejected(request) {
  try {
    let recipientEmailIds = '';
    if (request.params?.documentId) {

      let approverId = request.params?.approverUserId;
      const result = await getDocumentOwnerApproverComment(request.params?.documentId, approverId);
      recipientEmailIds = result.ownerEmail;

      const mailsender = smtpenable ? process.env.SMTP_USER_EMAIL : process.env.MAILGUN_SENDER;
      const docApprovalRejection = `<html><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8' /></head><body><div>
      <div style='background-color: rgb(245, 245, 245) !important; padding: 20px;'><div style='background-color: white !important;'><div>
      <img style='padding:20px' height='50' src='https://www.excis.com/assets/images/main-logo.png' data-imagetype='External'></div>
      <div style='padding: 2px; font-family: system-ui; !important;'><div style='box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;background-color:white;'>
      <div style='background-color:red;padding:2px;font-family:system-ui; background-color:#47a3ad;'>
      <p style='font-size:20px;font-weight:400;color:white;padding-left:20px'>Document Sign Approval Rejection Notification</p></div><div style='padding:20px'>
      <p>Dear <b>${result.ownerName},</b></p>
      <p style='font-family:system-ui;font-size:14px'>We regret to inform you that the document sign approval for <b>${result.documentName}</b> has been rejected by the approver, <b> ${result.approverName} </b>
      <br> The reason for the rejection is as follows:</p>
      <p style='font-family:system-ui;font-size:14px'><b>Approver's Comments:</b>
      <br>${result.approverComment}</p>
      <p style='font-family:system-ui;font-size:14px'>Please review the comments and make the necessary revisions to the document. Once updated, you may resubmit it for approval.<br> 
      If you have any questions or need further assistance, feel free to reach out.<br> 
      Thank you for your attention to this matter.</p>
      <p style='font-family:system-ui;font-size:14px'>Thanks<br> 
      Team Excis</p>
      <p style='text-decoration: none; font-weight: bolder; color:blue;font-size:45px;margin:20px'></p></div></div></div></div>    
      <div style='background-color: #f5f5f5;'>
      <p>This is an automated email from Excis. For any queries regarding this email, please contact Excis. If you think this email is inappropriate or spam, 
      you may file a complaint with Excis <a data-auth='NotApplicable' rel='noopener noreferrer' target='_blank' href='https://excis.com' data-linkindex='0'>here
      </a>.</p></div></div></div></div></body></html>`;

      if(recipientEmailIds == '')
      {
        console.log('recipient is missing');
        return false;
      }

      await Parse.Cloud.sendEmail({
        from: appName + '<' + mailsender + '>',
        recipient: recipientEmailIds,
        subject: `${appName} Document Sign Approval Rejected`,
        text: 'This is sample text and will not appear anywhere.',
        html: docApprovalRejection,
      });
      return true;
   }
  } catch (err) {
    console.log('err in sendMailDocumentSignApprovalRejected');
    console.log(err);
    return false;
  }
}


export default {sendMailDocumentApproval,sendMailDocumentSignApprovalRejected};
