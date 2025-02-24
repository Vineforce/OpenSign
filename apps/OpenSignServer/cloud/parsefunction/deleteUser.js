async function deleteUser(objectId) {
//Set IsDeleted to contract_Userss
  const contractsUserQuery = new Parse.Query("contracts_Users");
  const contractsUser = await contractsUserQuery.get(objectId, { useMasterKey: true });

  const userPointer = contractsUser.get("UserId");

  contractsUser.set("IsDeleted", true);
  await contractsUser.save(null, { useMasterKey: true });

  //Set IsDeleted to _User
  const userQuery = new Parse.Query("_User");
  const user = await userQuery.get(userPointer.id, { useMasterKey: true });
  user.set("IsDeleted", true);
  await user.save(null, { useMasterKey: true});

  return { success: true };

  }

  export default deleteUser;