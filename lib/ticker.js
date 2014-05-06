'use strict';

var async = require('async');
var jsonquest = require('jsonquest');

var CoindeskTicker = function(config) {
  this.config = config;
};

CoindeskTicker.factory = function factory(config) {
  return new CoindeskTicker(config);
};

function fetchTicker(currency, cb) {
  jsonquest({
    host: 'api.coindesk.com',
    path: '/v1/bpi/currentprice/' + currency + '.json',
    method: 'GET',
    protocol: 'https'
  }, function (err, response, result) {
    if (err) return cb(err);
    var rate = null;
    try {
      rate = result.bpi[currency].rate_float;
    } catch (ex) {
      return cb(new Error('Could not parse Coindesk ticker response.'));
    }
    cb(null, {currency: currency, rate: rate});
  });
}

CoindeskTicker.prototype.ticker = function ticker(currencies, cb) {
  async.map(currencies, fetchTicker, function (err, results) {
    if (err) return cb(err);
    return cb(null, results);
  });
};

var Ticker = CoindeskTicker.factory();
Ticker.ticker(['USD', 'EUR', 'ILS'], function (err, results) {
  console.dir(results);
});


module.exports = CoindeskTicker;
