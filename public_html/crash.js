/* global CryptoJS */

class Crash {

    static hashes = [];

    /**
     * Faz o bruteforce tentando achar o próximo seed baseado nos anteriores
     */
    static bruteforce(amount, serverSeed = '') {
        let attempt = 0;
        let start = performance.now();
        while (true) {
            let current = this.points(amount - 1, serverSeed);
            let next = this.points(amount);
            let end = performance.now();
            let elapsed = end - start;
            elapsed /= 1000;
            let seconds = Math.round(elapsed);
            this.hashes = [];
            if (!this.equals(current, next) && seconds <= 7) {
                attempt++;
                continue;
            } else {
                if (seconds <= 7) {
                    return {found: true, msg: 'Encontrado!', attempt: attempt,
                        hash: next.shift(), current: current, next: next};
                } else {
                    return {found: false, msg: 'Tempo esgotado!', attempt: attempt,
                        hash: null, current: current, next: next};
                }
            }
        }
    }

    /**
     * Retorna o tempo em segundos que a func demorou para executar
     */
    static elapsedTime(func) {
        let start = performance.now();
        func();
        let end = performance.now();
        let elapsed = end - start;
        elapsed /= 1000;
        return Math.round(elapsed); //segundos
    }

    /**
     * Verifica se os dois arrays gerados por points() são iguais,
     * (possuem mesmo número de elementos e todos os valores são os mesmos)
     */
    static equals(a, b) {
        return a[0].point === b[1].point && a[0].seed === b[1].seed && a[0].hash === b[1].hash;
    }

    /**
     * Wikizinha marotinha:
     * https://unpkg.com/crypto-js@3.1.9-1/docs/QuickStartGuide.wiki
     * Original em React (nojo):
     * https://codesandbox.io/s/blaze-com-crash-provably-fair-forked-h97thr
     */
    static points(amount, servSeed = '') {
        function makeHash() {
            let text = '';
            let possible = 'abcdef0123456789';
            let length = 64;
            for (let i = 0; i < length; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            if (Crash.hashes.includes(text)) {
                makeHash();
            }
            Crash.hashes.push(text);
            return text;
        }
        let points = [];
        let chain = [servSeed || makeHash()];
        for (let i = 0; i < amount; i++) {
            let sha256 = CryptoJS.algo.SHA256.create();
            sha256.update(chain[chain.length - 1]);
            let hash = sha256.finalize().toString(CryptoJS.enc.Hex);
            chain.push(hash);
        }
        const clientSeed = "0000000000000000000415ebb64b0d51ccee0bb55826e43846e5bea777d91966";
        chain.map((seed, index) => {
            let sha256hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, seed);
            sha256hmac.update(clientSeed);
            let hash = sha256hmac.finalize().toString(CryptoJS.enc.Hex);
            const divisible = (hash, mod) => {
                let val = 0;
                let o = hash.length % 4;
                for (let i = o > 0 ? o - 4 : 0; i < hash.length; i += 4) {
                    val = ((val << 16) + parseInt(hash.substring(i, i + 4), 16)) % mod;
                }
                return val === 0;
            };
            function getPoint(hash) {
                // In 1 of 15 games the game crashes instantly.
                if (divisible(hash, 15))
                    return 0;
                // Use the most significant 52-bit from the hash to calculate the crash point
                let h = parseInt(hash.slice(0, 52 / 4), 16);
                let e = Math.pow(2, 52);
                const point = (Math.floor((100 * e - h) / (e - h)) / 100).toFixed(2);
                return point;
            }
            points.push({'point': getPoint(hash), 'seed': seed, 'hash': hash});
        });
        return points;
    }

};
