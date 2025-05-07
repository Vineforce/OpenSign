
export default async function editUser(request) {
    try 
    {
        const userId = request.params.userId;
        const userQuery = new Parse.Query("_User");
        const user = await userQuery.get(userId, { useMasterKey: true });
        if (user) {
            user.set("name", request.params.name);
            user.set("phone", request.params.phoneNumber);
            await user.save(null, { useMasterKey: true });
        }

        const queryContractUsers = new Parse.Query("contracts_Users");
        const userPointer = { __type: "Pointer", className: "_User", objectId: userId, };
        queryContractUsers.equalTo("UserId", userPointer);
        const contractUser = await queryContractUsers.first({ useMasterKey: true });
        if (contractUser) {
            contractUser.set("Name", request.params.name);
            contractUser.set("Phone", request.params.phoneNumber);
            contractUser.set("JobTitle", request.params.jobtitle);
            contractUser.set("UserRole", "contracts_" + request.params.userRole);
            await contractUser.save(null, { useMasterKey: true });
        }
        return true;
        
    } catch (err) {
        console.error("Error editing user:", err);
        return false;
    }
}