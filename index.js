const request = require('request');
const _ = require('lodash');
const SparkPost = require('sparkpost');

const client = new SparkPost(/* USE YOUR OWN CLIENT HERE */);

const get = async (options) => (
  new Promise(async (resolve, reject) => {
    const req = request.get(options, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  })
);

const sendAlert = async (subject, message, email) => {
  new Promise(async (resolve, reject) => {
    client.transmissions.send({
      content: {
        from: 'email@ragnarokMarket.com',
        subject: `${subject}`,
        html: `<html><body><p>${message}</p></body></html>`,
      },
      recipients: [{ address: email }],
    }, (err) => {
      if (err) { reject(err); } else { resolve(); }
    });
  })
};

const getRequestBody = async (queryString) => {
  const { body } = await get({ url: `https://poring.world/api/search?${queryString}` });
  return JSON.parse(body);
};

const newAlert = async (queryString, alertStrings) => {
  const alertBody = await getRequestBody(queryString);

  const toAlert = _.filter(
    alertBody,
    ({ name }) => (_.some(alertStrings, (alertOn) => { return name.includes(alertOn) })),
  );

  return _.map(toAlert, ({ lastRecord, name }) => ({
    html: `<div>${name} - ${lastRecord.price}</div>`,
    name,
  }));
};

const runAlerts = async () => {
  console.log('Alerting');

  const ancientCapeAlerts = await newAlert(
    // Replace your category w/ the item you're looking for
    'order=popularity&rarity=&inStock=1&modified=&category=&endCategory=&q=ancient%20cape',
    // Casing matters
    ['Divine blessing 3', 'Divine blessing 4'],
  );

  const alerts = [...ancientCapeAlerts];

  if (!_.isEmpty(alerts)) {
    await sendAlert(
      `Item alerts ${_.map(alerts, 'name')}`,
      _.map(alerts, 'html').join('</br>')
    );
  }

  console.log('Alerting Complete');
}

(async () => {
  await runAlerts();
  setInterval(runAlerts, 1800000)
})();
