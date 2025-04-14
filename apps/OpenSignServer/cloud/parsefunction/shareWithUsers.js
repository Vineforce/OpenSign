import { appName, smtpenable } from '../../Utils.js';


async function shareWithUsers(request) {
  const { templateId, ShareWithUsersArr } = request.params;
  const query = new Parse.Query("contracts_Template");
  const template = await query.get(templateId, { useMasterKey: true });
  const ShareWithUsers = template.get('ShareWithUsers') || [];
  
  let ShareWitUserIdArr=[];
   
  ShareWithUsersArr.forEach(users => {
    const userlist = {
      __type: users.__type,
      className: users.className,
      contracts_Users_Id: users.id,
    };
 
    let alreadyExists = ShareWithUsers.some(user => user.contracts_Users_Id === users.id);
    if (!alreadyExists) {
      ShareWithUsers.push(userlist);
      ShareWitUserIdArr.push(users.id);
    }
  });
 
  template.set('ShareWithUsers', ShareWithUsers);
  let result = await template.save(null, { useMasterKey: true });
  
  if (result && Array.isArray(ShareWitUserIdArr) && ShareWitUserIdArr.length > 0) {
    SendMailUserWithShare(templateId, ShareWitUserIdArr);
  }
  return 'Template is ShareWithUsers';
}
 
async function SendMailUserWithShare(templateId, ShareWitUserIdArr) {
  let subQuery = new Parse.Query('contracts_Template');
  subQuery.equalTo('_id', templateId);
  subQuery.select('Name');
  subQuery.select('Description');
  const template = await subQuery.first({ useMasterKey: true });
 
  const MailConfig = [];
 
  const result = await Promise.all(
    ShareWitUserIdArr.map(async id => {
      const Users_IdQuery = new Parse.Query('contracts_Users');
      Users_IdQuery.equalTo('objectId',id);
      Users_IdQuery.select('Name', 'Email');
      const User = await Users_IdQuery.first({ useMasterKey: true });
 
      if (User) {
        const listOfmail = {
          name: User.get('Name'),
          sendTo: User.get('Email'),
              templateName: template.get('Name'),
              templateDescription: (template.get('Description') == '' || template.get('Description') == undefined) ? 'N/A' : template.get('Description'),
          };

          MailConfig.push(listOfmail);
        return listOfmail;
      }   
     })
  );
  SendMailOnShareWithUsers(result)
}
 
 
async function SendMailOnShareWithUsers(emailConfig) {
  try {
    emailConfig.forEach(async (emailConfig)=>{
      let recipientEmailIds = '';
      recipientEmailIds = emailConfig.sendTo;
      const mailsender = smtpenable ? process.env.SMTP_USER_EMAIL : process.env.MAILGUN_SENDER;
      const docSignUserShareMessage = `<html>
                    <head>
                        <meta http-equiv='Content-Type' content='text/html; charset=UTF-8' />
                    </head>
                    <body>
                        <div>
                            <div style='background-color: rgb(245, 245, 245) !important; padding: 20px;'>
                                    <div style='background-color: white !important;'>
                                        <div>
                                            <img style='padding:20px' height='50' src='https://www.excis.com/assets/images/main-logo.png' data-imagetype='External'>
                                        </div>
                                        <div style='padding: 2px; font-family: system-ui; !important;'>
                                            <div style='box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;background-color:white;'>
                                                <div style='background-color:red;padding:2px;font-family:system-ui; background-color:#47a3ad;'>
                                                    <p style='font-size:20px;font-weight:400;color:white;padding-left:20px'>
                                                    New Template Shared Notification
                                                    </p>
                                                </div>
                                                <div style='padding:20px'>
                                                    <p style='font-family:system-ui;font-size:14px'>Dear <b> ${emailConfig.name},</b></p>
                                                    <p style='font-family:system-ui;font-size:14px'>
                                                    We are sharing the template to assist you with your upcoming tasks. This
                                                    template has been designed to simplify the process and
                                                    ensure consistency.<br/> Below are the details:</p>
                                                   
                                                    <ul style='font-family:system-ui;font-size:14px'>
                                                    <li><b>Template Title:</b> ${emailConfig.templateName} </li>
                                                    <li><b>Description:</b> ${emailConfig.templateDescription}</li>
                                                    </ul>
                                                   
                                                    <p style='font-family:system-ui;font-size:14px'>Please feel free to use this template as needed. You can
                                                    access it from templates. If you have any questions or need further assistance,
                                                    don’t hesitate to reach out.<br/>
                                                    Thank you, and we hope this template helps streamline your work!
                                                    </p>
                                                    <p style='font-family:system-ui;font-size:14px'>Thanks<br>Team Excis</p>
                                                    <p style='text-decoration: none; font-weight: bolder; color:blue;font-size:45px;margin:20px'></p>
 
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style='background-color: #f5f5f5;'>
                                        <p>This is an automated email from Excis. For any queries regarding this email, please
                                            contact Excis. If you think this email is inappropriate or spam,
                                            you may file a complaint with Excis
                                            <a data-auth='NotApplicable' rel='noopener noreferrer' target='_blank' href='https://excis.com' data-linkindex='0'>here </a>.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </body>
                </html>`;
 
      if (recipientEmailIds == '') {
        return false;
      }
      await Parse.Cloud.sendEmail({
        from: appName + '<' + mailsender + '>',
        recipient: recipientEmailIds,
        subject: `${appName} New Template Shared`,
        text: 'This is sample text and will not appear anywhere.',
        html: docSignUserShareMessage,
      });
      return true;
    })
     
  } catch (err) {
    console.log('err in sendMailOnUserShare');
    console.log(err);
    return false;
  }
}
 
 
export default shareWithUsers;