
async function ManageTwoFactorAuthentication(request) {
    try {
        const mfaObject = Parse.Object.extend('TwofactorAuthentication_Setting');
        const mfaObjectQuery = new Parse.Query(mfaObject);
        mfaObjectQuery.equalTo('UserId', request.params.UserId);
        let mfaObjectRecord = await mfaObjectQuery.first({ useMasterKey: true });

        if (mfaObjectRecord) {
            mfaObjectRecord.set('EnableTwoFactorAuthentication', request.params.EnableTwoFactorAuthentication);
        } else {
            mfaObjectRecord = new mfaObject();
            mfaObjectRecord.set('UserId', request.params.UserId);
            mfaObjectRecord.set('EnableTwoFactorAuthentication', request.params.EnableTwoFactorAuthentication);
        }

        await mfaObjectRecord.save(null, { useMasterKey: true });
        return true;
    } catch (error) {
        console.error('Error saving OTP:', error);
        return false;
    }
}

async function IsTwoFactorAuthenticationEnabled(request) {
    const mfaObject = Parse.Object.extend('TwofactorAuthentication_Setting');
    const mfaObjectQuery = new Parse.Query(mfaObject);
    mfaObjectQuery.equalTo('UserId', request.params.UserId);    
    let mfaObjectRecord = await mfaObjectQuery.first({ useMasterKey: true });
    if (mfaObjectRecord) {
        let IsEnableTwoFactorAuthentication = mfaObjectRecord.get('EnableTwoFactorAuthentication');
        return IsEnableTwoFactorAuthentication;
    }
    return false;
};

export default { ManageTwoFactorAuthentication, IsTwoFactorAuthenticationEnabled };