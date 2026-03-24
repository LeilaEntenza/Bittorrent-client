'use strict';

const fs = require('fs');
const bencode = require('bencode');
const crypto = require('crypto');

module.exports.open = (filepath) => {
    return bencode.decode(fs.readFileSync(filepath));
};

module.exports.size = torrent => {
    const size = torrent.info.files ?
        torrent.info.file.map(file => file.length).reduce((a, b) => a + b):
        torrent.info.length;

};

module.exports.infoHash = torrent => {
    const info = bencode.encode(torrent.info);
    return crypto.createHash('sha-1').update(info).digest();
};