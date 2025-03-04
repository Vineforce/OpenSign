import { cloudServerUrl } from '../../Utils.js';
import reportJson from './reportsJson.js';
import axios from 'axios';

export default async function getReport(request) {
  const reportId = request.params.reportId;
  const limit = request.params.limit;
  const skip = request.params.skip;

  const serverUrl = cloudServerUrl; //process.env.SERVER_URL;
  const appId = process.env.APP_ID;
  const masterKey = process.env.MASTER_KEY;
  try {
    const userRes = await axios.get(serverUrl + '/users/me', {
      headers: {
        'X-Parse-Application-Id': appId,
        'X-Parse-Session-Token': request.headers['sessiontoken'],
      },
    });
    const userId = userRes.data && userRes.data.objectId;
    if (userId) {
      const json = reportId && reportJson(reportId, userId);
      const clsName = json?.reportClass ? json.reportClass : 'contracts_Document';
      if (json) {
        const { params, keys } = json;
        const orderBy = '-updatedAt';
        const strKeys = keys.join();
        let strParams = JSON.stringify(params);
        if (reportId == '6TeaPr321t') {
          const extUserQuery = new Parse.Query('contracts_Users');
          extUserQuery.equalTo('Email', userRes.data.email);
          extUserQuery.include('TeamIds');
          const extUser = await extUserQuery.first({ useMasterKey: true });
          if (extUser) {
            const _extUser = JSON.parse(JSON.stringify(extUser));
            if (_extUser?.TeamIds && _extUser.TeamIds?.length > 0) {
              let teamArr = [];
              _extUser?.TeamIds?.forEach(x => (teamArr = [...teamArr, ...x.Ancestors]));
              strParams = JSON.stringify({
                ...params,
                $or: [
                  { SharedWith: { $in: teamArr } },
                  {
                    ExtUserPtr: {
                      __type: 'Pointer',
                      className: 'contracts_Users',
                      objectId: extUser.id,
                    },
                  },
                ],
              });
            } else {
              strParams = JSON.stringify({
                ...params,
                CreatedBy: { __type: 'Pointer', className: '_User', objectId: userId },
              });
            }
          }
        }
        const headers = {
          'Content-Type': 'application/json',
          'X-Parse-Application-Id': appId,
          'X-Parse-Master-Key': masterKey,
        };
        const url = `${serverUrl}/classes/${clsName}?where=${strParams}&keys=${strKeys}&order=${orderBy}&skip=${skip}&limit=${limit}&include=AuditTrail.UserPtr,Placeholders.signerPtr,ExtUserPtr.TenantId`;
        const res = await axios.get(url, { headers: headers });      
        if (res.data && res.data.results) {
           // Check for 'Need your Sign' Report only so that user will sign the documnet in the sequence they are added
          // 4Hhwbp482K is for Need your Signature banner count display and drill down
          // 5Go51Q7T8r is for Recent signature request grid/listview/table
          // 1MwEuxLEkF Out for signatures banner count display and drill down
          // d9k3UfYHBc is for Recent signature request grid/listview/table
          if (reportId === '4Hhwbp482K' || reportId === '5Go51Q7T8r') {
              //console.log('res.data.results',res.data.results);
              // Filter the document so that only those document get signed which have been approved 
              // The documents need to be signed before getting approved
              let filteredDoc = res.data.results.filter(doc => {
                // Include document if:
                // 1. There are no approvers (empty approvers array), or
                // 2. All approvers have approved
                return !doc.Approvers || doc.Approvers.length === 0 || doc.Approvers.every(x => x.HasApproved === 'Approved');
              });
              //console.log('filteredDoc',filteredDoc);

              let myDoc = [];
              filteredDoc.forEach((doc, indexDoc) => {              
              const signerIndex = doc.Signers.findIndex(signer => signer.UserId.objectId === userId)
              // if index is zero then add in the doc array 
              if (signerIndex == 0) {
                myDoc.push(doc);
              }
              else {
                // if index is greater than zero then check if the previous signer has signed or not 
                // get userid of previous signer
                let previousSigner = doc.Signers[signerIndex - 1].UserId.objectId;
                // find the userid ini Audit trail
                let auditTrailIndex = Array.isArray(doc.AuditTrail) ? doc.AuditTrail.findIndex(auditTrailItem => auditTrailItem.UserPtr?.UserId?.objectId === previousSigner) : -1;                
                let previousSignersSigned = auditTrailIndex !== -1 && doc.AuditTrail?.[auditTrailIndex]?.Activity === 'Signed';
                if (previousSignersSigned) {
                  // add document to user collection as previous signer has signed
                  myDoc.push(doc);
                }
              }
            });
            //console.log('myDoc',myDoc);
            return myDoc;
          }
          else {
            return res.data.results;
          }
        } else {
          return [];
        }
      } else {
        return { error: 'Report is not available!' };
      }
    }
  } catch (err) {
    console.log('err', err.message);
    if (err.code == 209) {
      return { error: 'Invalid session token' };
    } else {
      return { error: "You don't have access!" };
    }
  }
}
