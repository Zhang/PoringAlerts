const request = require('request');
const _ = require('lodash');
const send = require('gmail-send')

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

const waitFor = (seconds) => (new Promise((resolve) => { setTimeout(() => { resolve(); }, seconds); }));

const sendAlert = async (subject, message, email) => {
  console.log(message);
  new Promise(async (resolve, reject) => {
    send({
      user: '',
      pass: '',
      to: [email],
      subject,
      text: message,
    })({}, function(err, result) {
      if (err) {
        reject(err);
      } else {
        resolve(result)
      }
    })
  })
};

const getRequestBody = async (queryString) => {
  const { body } = await get({ url: `https://poring.world/api/search?${queryString}` });

  let bodyParsed;
  try {
    bodyParsed = JSON.parse(body);
  } catch (e) {
    console.log('error');
    bodyParsed = null;
  }

  return bodyParsed;
};

const newAlert = async (queryString, alertStrings) => {
  const alertBody = await getRequestBody(queryString);

  if (alertBody) {
    const toAlert = _.filter(
      alertBody,
      ({ name }) => (_.some(alertStrings, (alertOn) => { return name.includes(alertOn) || alertStrings[0] === '*' })),
    );

    return _.map(toAlert, ({ lastRecord, name }) => ({
      html: `<div>${name} - ${lastRecord.price}</div>`,
      name,
    }));
  } else {
    return [];
  }
};

const runAlerts = async () => {
  console.log('Alerting');

  const MVPCards = [
    'Drake Card',
    'Stormy Knight Card',
    'Owl Baron Card',
    'Maya Card',
    'Drake ★ Card',
    'Eddga Card',
    'Angeling Card',
    'Goblin Leader Card',
    'Phreeoni Card',
    'Phreeoni ★ Card',
    'Garm Card',
    'Spashire Card',
    'Mistress Card',
    'Time Holder Card',
    'Chimera Card',
    'Golden Thief Bug Card',
    'Detarderous Card',
    'Orc Lord Helm Card',
    'Deviling Card',
    'Doppelganger Card',
    'Chepet Card',
    'Eddga ★ Card',
    'Cenia Card',
    'Kobold Leader Card',
    'Deje Card',
    'Osiris ★ card',
    'Chimera ★ Card',
    'Osiris Card',
    'Phreeoni the Revenant Card',
    'Osiris ★ Card',
    'Detarderous ★ Card',
    'Dead Eddga Card'
  ];

  const encodedCards = _.map(MVPCards, (name) => encodeURIComponent(name));

  let alerts = [];
  for (let i = 0; i < encodedCards.length; i += 1) {
    console.log(`order=popularity&rarity=&inStock=1&modified=&category=&endCategory=&q=${encodedCards[i]}`);
    const alertMessages = await newAlert(
      `order=popularity&rarity=&inStock=1&modified=&category=&endCategory=&q=${encodedCards[i]}`,
      ['*'],
    );
    if (!_.isEmpty(alertMessages)) {
      console.log(alertMessages);
      alerts = _.compact(alerts.concat(alertMessages));
    }
    await waitFor(3000);
  }

  if (!_.isEmpty(alerts)) {
    await sendAlert(
      `Item alerts ${_.map(alerts, 'name')}`,
      _.map(alerts, 'html').join('</br>'),
      'scottzhang235@gmail.com',
    );
  }

  console.log('Alerting Complete');
}

(async () => {
  await runAlerts();
  setInterval(runAlerts, 1800000)
})();
