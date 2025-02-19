async function deleteUser(objectId) {
  const contractsUserQuery = new Parse.Query("contracts_Users");
  const contractsUser = await contractsUserQuery.get(objectId, { useMasterKey: true });

  //Store UserId of _User from contracts_User
  const userPointer = contractsUser.get("UserId");

  const userQuery = new Parse.Query("_User");
  const user = await userQuery.get(userPointer.id, { useMasterKey: true });
  
  await contractsUser.destroy({ useMasterKey: true });
  user.destroy({ useMasterKey: true });
  return { success: true };
  }

  export default deleteUser;