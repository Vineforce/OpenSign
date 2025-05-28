export default async function getJobTitle(request) {
    const userId = request.params.UserId;
    if (!userId) {
        throw new Error('UserId is required');
    }
    try {
        const ContractsUserQuery = new Parse.Query('contracts_Users');

        //ContractsUserQuery.equalTo('_p_UserId', `_User$${userId}`)   

        // ContractsUserQuery.equalTo('UserId', {
        //     __type: 'Pointer',
        //     className: '_User',
        //     objectId: userId
        // });

        //const userPointer = new Parse.User();
        //userPointer.id = userId;

        const userPointer = Parse.Object.extend('_User').createWithoutData(userId);
        ContractsUserQuery.equalTo('UserId', userPointer);

        const contractsUserRes = await ContractsUserQuery.first({ useMasterKey: true });
        return contractsUserRes ? contractsUserRes?.toJSON() : {};

    } catch (err) {
        console.log('Err in contracts_Users', err.message || err);
        throw err;
    }
}