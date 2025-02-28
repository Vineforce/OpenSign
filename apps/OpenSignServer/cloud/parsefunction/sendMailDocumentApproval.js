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

    await Parse.Cloud.sendEmail({
      from: appName + '<' + mailsender + '>',
      recipient: recipientEmailIds,
      subject: `${appName} Document Approval`,
      text: 'This email is a test.',
      html: approvalEmail,
    });
  } catch (err) {
    console.log('err in sendMailDocumentApproval');
    console.log(err);
    return err;
  }
}

export default sendMailDocumentApproval;
