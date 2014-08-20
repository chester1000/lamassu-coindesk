'use strict';

var _       = require('lodash');
var Wreck   = require('wreck');
var async   = require('async');


exports.NAME = 'Coindesk';
exports.SUPPORTED_MODULES = ['ticker'];
var API_ENDPOINT = 'https://api.coindesk.com/v1/bpi/';
var config = {};


exports.config = function config(localConfig) {
  if (localConfig) _.merge(config, localConfig);
};


function getTickerUrls(currencies) {
  var urls = currencies.map(function(currency) {
    return API_ENDPOINT + 'currentprice/' + currency + '.json';
  });

  return urls;
};

function formatResponse(currencies, results, callback) {
  var out = results.reduce(function(prev, current) {
    for (var currency in current.bpi) {
      if (prev[currency] === undefined) {
        var rate = current.bpi[currency].rate_float;
        prev[currency] = {
          currency: currency,
          rates: {
            ask: rate,
            bid: rate
          }
        };
      }
    }

    return prev;
  }, {});

  callback(null, out);
};


exports.ticker = function ticker(currencies, callback) {
  if (typeof currencies === 'string')
    currencies = [currencies];

  if(currencies.length === 0)
    return callback(new Error('Currency not specified'));

  var urls = getTickerUrls(currencies);

  // change each url on the list into a download job
  var downloadList = urls.map(function(url) {
    return function(cb) {
      Wreck.get(url, {json: true}, function(err, res, payload) {
        if (res.statusCode === 404)
          return cb(new Error('Unsupported currency'));

        cb(err, JSON.parse(payload)); // Coindesk fails to properly set headers
      });
    }
  });

  async.parallel(downloadList, function(err, results) {
    if (err) return callback(err);

    formatResponse(currencies, results, callback);
  });
};

