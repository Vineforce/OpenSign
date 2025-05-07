import { appName, smtpenable } from '../../Utils.js';


async function getDocumentOwnerSignerDetail(docId, signerId) {
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
  let declineReason = _res.DeclineReason.replace(/\n/g, '<br>');
  if (declineReason == '' || declineReason == null) {
    declineReason = 'No reason provided';
  }

  // Fetch the owner (createdBy user) details
  const queryUsers = new Parse.Query('_User');
  queryUsers.equalTo('objectId', createdBy); 
  const userCreatedBy = await queryUsers.first({ useMasterKey: true });
  if (!userCreatedBy) {
    throw new Error('Owner not found');
  }
  let ownerName = userCreatedBy.get('name');
  let ownerEmail = userCreatedBy.get('email');

  const querySignerUser = new Parse.Query('_User');
  querySignerUser.equalTo('_id', signerId); 
  const SignerUser = await querySignerUser.first({ useMasterKey: true });
  if (!SignerUser) {
    throw new Error('Approver not found');
  }
  let signerName = SignerUser.get('name');

  // Return the required fields
  return {
    documentName,
    ownerName,
    ownerEmail,
    signerName, 
    declineReason   
  };
}


async function sendMailOnDecline(request) {
  try {
    let recipientEmailIds = '';       
    const result = await getDocumentOwnerSignerDetail(request.params.docId, request.params.userId);
    recipientEmailIds = result.ownerEmail;

    const mailsender = smtpenable ? process.env.SMTP_USER_EMAIL : process.env.MAILGUN_SENDER;

    const docSignDeclineMessage = `<html><head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8' /></head><body><div>
      <div style='background-color: rgb(245, 245, 245) !important; padding: 20px;'><div style='background-color: white !important;'><div>
      <img style='padding:20px' height='50' src='https://www.excis.com/assets/images/main-logo.png' data-imagetype='External'></div>
      <div style='padding: 2px; font-family: system-ui; !important;'><div style='box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;background-color:white;'>
      <div style='background-color:red;padding:2px;font-family:system-ui; background-color:#47a3ad;'>
      <p style='font-size:20px;font-weight:400;color:white;padding-left:20px'>Document Signature Declined Notification</p></div><div style='padding:20px'>
      <p>Dear <b> ${result.ownerName},</b></p>
      <p style='font-family:system-ui;font-size:14px'>We wanted to inform you that the signer, <b>${result.signerName}</b>, has declined to sign the document, <b>${result.documentName}</b>, that you sent.
      <br> The reason provided for their decision is as follows:</p>     
      <p style='font-family:system-ui;font-size:14px'>${result.declineReason}</p>
      <p style='font-family:system-ui;font-size:14px'>Please take note of this update and review the next steps accordingly.</p>
      <p style='font-family:system-ui;font-size:14px'>Thanks<br> 
      Team Excis</p>
      <p style='text-decoration: none; font-weight: bolder; color:blue;font-size:45px;margin:20px'></p></div></div></div></div>    
      <div style='background-color: #f5f5f5;'>
      <p>This is an automated email from Excis. For any queries regarding this email, please contact Excis. If you think this email is inappropriate or spam, 
      you may file a complaint with Excis <a data-auth='NotApplicable' rel='noopener noreferrer' target='_blank' href='https://excis.com' data-linkindex='0'>here
      </a>.</p></div></div></div></div></body></html>`;

    if (recipientEmailIds == '') {
      console.log('recipient is missing');
      return false;
    }

    await Parse.Cloud.sendEmail({
      from: appName + '<' + mailsender + '>',
      recipient: recipientEmailIds,
      subject: `${appName} Document Signing Declined by the Signer`,
      text: 'This is sample text and will not appear anywhere.',
      html: docSignDeclineMessage,
    });
    return true;

  } catch (err) {
    console.log('err in sendMailOnDecline');
    console.log(err);
    return false;
  }
}
export default sendMailOnDecline;