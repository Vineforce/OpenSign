import axios from 'axios';
import {
  cloudServerUrl,
} from '../../Utils.js';

export default async function GetTemplate(request) {
  const serverUrl = cloudServerUrl; //process.env.SERVER_URL;
  const templateId = request.params.templateId;
  const ispublic = request.params.ispublic;
  const sessiontoken = request.headers?.sessiontoken;
  try {
    if (!ispublic) {
      let userEmail;
      if (sessiontoken) {
        const userRes = await axios.get(serverUrl + '/users/me', {
          headers: {
            'X-Parse-Application-Id': process.env.APP_ID,
            'X-Parse-Session-Token': sessiontoken,
          },
        });
        userEmail = userRes.data && userRes.data.email;
      }
      if (templateId && userEmail) {
        try {
          let template = new Parse.Query('contracts_Template');
          template.equalTo('objectId', templateId);
          template.include('ExtUserPtr');
          template.include('Signers');
          template.include('CreatedBy');
          template.include('ExtUserPtr.TenantId');
          template.include('Bcc');
          const extUserQuery = new Parse.Query('contracts_Users');
          extUserQuery.equalTo('Email', userEmail);
          extUserQuery.include('TeamIds');
          const extUser = await extUserQuery.first({ useMasterKey: true });
          if (extUser) {
            const _extUser = JSON.parse(JSON.stringify(extUser));
            if (_extUser?.TeamIds && _extUser.TeamIds?.length > 0) {
              let teamsArr = [];
              _extUser?.TeamIds?.forEach(x => (teamsArr = [...teamsArr, ...x.Ancestors]));
              let userArr = [];
              let template = new Parse.Query('contracts_Template');
              template.equalTo('objectId', templateId);
              template.include('ShareWithUsers');  // Include full objects
              const templateObj = await template.first({ useMasterKey: true });
 
              if (templateObj) {
                const sharedUsers = templateObj.get('ShareWithUsers'); // Get array
                if (Array.isArray(sharedUsers) && sharedUsers.length > 0) {
                  userArr = sharedUsers.map(user => user.contracts_Users_Id); // Direct property access
                } else {
                  userArr = []; // Ensure it's always defined
                }
              } else {
                userArr = []; // Handle case where no template is found
              }
              const sharedWithUserQuery = new Parse.Query('contracts_Template');
              sharedWithUserQuery.containedIn('contracts_Users_Id', userArr);
              
              // Create the first query
              const sharedWithQuery = new Parse.Query('contracts_Template');
              sharedWithQuery.containedIn('SharedWith', teamsArr);

              // Create the second query
              const createdByQuery = new Parse.Query('contracts_Template');
              createdByQuery.equalTo('ExtUserPtr', {
                __type: 'Pointer',
                className: 'contracts_Users',
                objectId: extUser.id,
              });
              template = Parse.Query.or(sharedWithQuery, createdByQuery,sharedWithUserQuery);
              template.equalTo('objectId', templateId);
              template.include('ExtUserPtr');
              template.include('Signers');
              template.include('CreatedBy');
              template.include('ExtUserPtr.TenantId');
              template.include('Placeholders.signerPtr');
              template.include('Bcc');
            }
          }
          const res = await template.first({ useMasterKey: true });
          if (res) {
            const templateRes = JSON.parse(JSON.stringify(res));
            delete templateRes?.ExtUserPtr?.TenantId?.FileAdapters;
            delete templateRes?.ExtUserPtr?.TenantId?.PfxFile;
            return templateRes;
          } else {
            return { error: "You don't have access of this document!" };
          }
        } catch (err) {
          console.log('err', err);
          return err;
        }
      } else {
        return { error: "You don't have access of this document!" };
      }
    } else if (templateId && ispublic) {
      try {
        const template = new Parse.Query('contracts_Template');
        template.equalTo('objectId', templateId);
        template.include('ExtUserPtr');
        template.include('Signers');
        template.include('CreatedBy');
        template.include('ExtUserPtr.TenantId');
        template.include('Bcc');
        const res = await template.first({ useMasterKey: true });
        if (res) {
          const templateRes = JSON.parse(JSON.stringify(res));
          delete templateRes?.ExtUserPtr?.TenantId?.FileAdapters;
          delete templateRes?.ExtUserPtr?.TenantId?.PfxFile;
          return templateRes;
        } else {
          return { error: "You don't have access of this document!" };
        }
      } catch (err) {
        console.log('err', err);
        return err;
      }
    } else {
      return { error: 'Please pass required parameters!' };
    }
  } catch (err) {
    console.log('err', err);
    if (err?.response?.data?.code === 209 || err.code == 209) {
      return { error: 'Invalid session token' };
    } else {
      return { error: "You don't have access of this document!" };
    }
  }
}