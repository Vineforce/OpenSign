export default async function saveSubscription(request, response) {
  const SubscriptionId = request.body.data.subscription.subscription_id;
  const body = request.body;
  const customerId = request.body.data.subscription.customer_id;
  try {
    const extUserCls = new Parse.Query('contracts_Users');
    extUserCls.equalTo('Customer_id', customerId);
    const extUser = await extUserCls.first({ useMasterKey: true });
    const subcriptionCls = new Parse.Query('contracts_Subscriptions');
    subcriptionCls.equalTo('SubscriptionId', SubscriptionId);
    const subscription = await subcriptionCls.first({ useMasterKey: true });
    if (subscription) {
      const updateSubscription = new Parse.Object('contracts_Subscripitons');
      updateSubscription.id = subscription.id;
      updateSubscription.set('SubscriptionDetails', body);
      await updateSubscription.save(null, { useMasterKey: true });
      return response.status(200).json({ status: 'update subscription!' });
    } else {
      const createSubscription = new Parse.Object('contracts_Subscripitons');
      createSubscription.set('SubscriptionId', SubscriptionId);
      createSubscription.set('SubscriptionDetails', body);
      createSubscription.set('ExtUserPtr', {
        __type: 'Pointer',
        className: 'contracts_Users',
        objectId: extUser.id,
      });
      createSubscription.set('CreatedBy', {
        __type: 'Pointer',
        className: '_User',
        objectId: extUser.get('UserId').id,
      });
      await createSubscription.save(null, { useMasterKey: true });
      return response.status(200).json({ status: 'create subscription!' });
    }
  } catch (err) {
    console.log('Err in save subscription', err);
    return response.status(400).json({ status: 'error:' + err.message });
  }
}
