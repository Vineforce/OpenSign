export default async function getContactJson(request) {
    const contactId = request.params.contactId;
    try {
      const contactCls = new Parse.Query('contracts_Contactbook');
      contactCls.include('_UserId');
      const contactRes = await contactCls.get(contactId, { useMasterKey: true });
      return contactRes.toJSON();
    } catch (err) {
      console.log('Err in contracts_Contactbook class ', err);
      throw err;
    }
  }