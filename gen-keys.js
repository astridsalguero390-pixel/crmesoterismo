const webpush = require('web-push');
const keys = webpush.generateVAPIDKeys();
console.log('--- VAPID KEYS ---');
console.log('PUBLIC_KEY: ' + keys.publicKey);
console.log('PRIVATE_KEY: ' + keys.privateKey);
console.log('------------------');
