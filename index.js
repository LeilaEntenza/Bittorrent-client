"use strict";
const fs = require('fs');
const bencode = require('bencode.js');
const tracker = require('./tracker');

const torrent = bencode.decode(fs.readFileSync('puppy.torrent'));

tracker.getPeers(torrent, peers => {
    console.log('List of peers: ', peers);
});