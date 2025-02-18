import axios from 'axios';
import { cloudServerUrl } from '../../Utils.js';
const serverUrl = cloudServerUrl;
const APPID = process.env.APP_ID;
const masterKEY = process.env.MASTER_KEY;
import { appName, smtpenable } from '../../Utils.js';

async function generateAndSendOTP(email) {
  const otp = generateOTP();

  await saveOTPToParse(email, otp);
  await sendOTPEmail(email, otp);
}

function generateOTP(length = 6) {
  let otp = '';
  const characters = '0123456789';
  for (let i = 0; i < length; i++) {
    otp += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return otp;
}

async function saveOTPToParse(email, otp) {
  const OtpObject = Parse.Object.extend('mfa_Otp');
  const otpQuery = new Parse.Query(OtpObject);
  otpQuery.equalTo('Email', email);

  try {
    let otpRecord = await otpQuery.first({ useMasterKey: true });

    if (otpRecord) {
      otpRecord.set('OTP', otp);
    } else {
      otpRecord = new OtpObject();
      otpRecord.set('Email', email);
      otpRecord.set('OTP', otp);
    }

    // Remove manual createdAt setting
    await otpRecord.save(null, { useMasterKey: true });
    console.log('OTP saved successfully');
  } catch (error) {
    console.error('Error saving OTP:', error);
    throw error;
  }
}

async function sendOTPEmail(email, otp) {
  const mailLogo = 'https://www.excis.com/assets/images/main-logo.png';
  const subject = 'Your One-Time Password (OTP) for Login';

  const body = `
    <html>
      <head><meta http-equiv='Content-Type' content='text/html; charset=UTF-8' /></head>
      <body style='background-color:#f5f5f5;padding:20px'>
        <div style='box-shadow:rgba(0, 0, 0, 0.1) 0px 4px 12px;background-color:white;padding:20px'>
          <div style='text-align:center'>
            <img src=${mailLogo} height='50' alt='Logo' />
          </div>
          <div style='background-color:#47a3ad;padding:10px;color:white;text-align:center'>
            <p style='font-size:20px;font-weight:400;'>Your OTP for Login</p>
          </div>
          <div style='padding:20px;font-family:system-ui;font-size:14px'>
            <p>Dear User,</p>
            <p>We have received a request to log in to your account. Please use the One-Time Password (OTP) below to complete your login:</p>
            <p style='font-size:18px;font-weight:bold;color:#333;'>${otp}</p>
            <p>This OTP is valid for a short time, so please use it promptly. If you did not request this, please ignore this email.</p>
            <p>If you have any questions, feel free to contact us.</p>
            <p style='font-size:12px;color:#888;'>This is an automated email, please do not reply directly to this message.</p>
          </div>
        </div>
        <div style='text-align:center;margin-top:20px'>
          <p>This is an automated email from Excis. If you think this email is inappropriate or spam, you can file a complaint with us <a href="https://www.excis.com" target="_blank">here</a>.</p>
        </div>
      </body>
    </html>
  `;
  const mailsender = smtpenable ? process.env.SMTP_USER_EMAIL : process.env.MAILGUN_SENDER;
  const params = {
    to: email,
    from: appName + ' <' + mailsender + '>',
    subject: subject,
    text: `Your OTP for login is: ${otp}`,
    html: body,
    recipient: email

  };
  await axios.post(serverUrl + '/functions/sendmailv3', params, {
    headers: {
      'Content-Type': 'application/json',
      'X-Parse-Application-Id': APPID,
      'X-Parse-Master-Key': masterKEY,
    },
  });
}

async function AuthLoginWithMFA(request) {
  try {
    const otp = String(request.params.otp);
    const email = String(request.params.email);

    const OtpObject = Parse.Object.extend('mfa_Otp');
    const checkOtp = new Parse.Query(OtpObject);

    checkOtp.equalTo('Email', email);
    checkOtp.greaterThan('_updated_at', new Date(Date.now() - 5 * 60000));

    const otpRecord = await checkOtp.first({ useMasterKey: true });
    if (!otpRecord) {
      return { message: 'OTP expired or not found' };
    }

    const savedOtp = otpRecord.get('OTP');
    if (savedOtp !== otp) {
      return { message: 'Invalid OTP' };
    }

    // Get user session token
    const result = await getToken(request);

    // Update email verification status if needed
    if (result && !result?.emailVerified) {
      const user = await new Parse.Query(Parse.User)
        .get(result.objectId, { sessionToken: result.sessionToken });

      user.set('emailVerified', true);
      await user.save(null, { useMasterKey: true });
    }

    return result;

    async function getToken() {
      const user = await new Parse.Query(Parse.User)
        .equalTo('email', email)
        .first({ useMasterKey: true });

      if (!user) throw new Error('User not found');

      const response = await axios({
        method: 'POST',
        url: `${serverUrl}/loginAs`,
        headers: {
          'X-Parse-Application-Id': APPID,
          'X-Parse-Master-Key': masterKEY,
        },
        data: { userId: user.id }
      });

      return response.data;
    }
  } catch (err) {
    console.error('AuthLoginWithMFA Error:', err);
    return { error: err.message };
  }
}

export default { generateAndSendOTP, AuthLoginWithMFA };