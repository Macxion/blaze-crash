/* global self, Crash */
importScripts('crypto.js', 'crash.js');

self.addEventListener('message', (e) => {
    let message = e.data;
    if (message.cmd === 'bruteforce') {
        let amount = 1;
        let bruteforce = Crash.bruteforce(amount, message.seed);
        self.postMessage({id: message.id, bruteforce: bruteforce});
        self.close();
    }
});
