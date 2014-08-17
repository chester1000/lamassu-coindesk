'use strict';

var Wreck       = require('wreck');
var async       = require('async');


// copy relevant convienient constants
var config                = require('../config');
var API_ENDPOINT          = config.API_ENDPOINT;
var SUPPORTED_CURRENCIES  = config.SUPPORTED_CURRENCIES;


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

  currencies.sort();

  if(currencies.length === 0)
    return callback(new Error('Currency not specified'));

  for (var i=0; i<currencies.length; i++)
    if (SUPPORTED_CURRENCIES.indexOf(currencies[i]) === -1)
      return callback(new Error('Unsupported currency: ' + currencies[i]));

  var urls = getTickerUrls(currencies);

  // change each url on the list into a download job
  var downloadList = urls.map(function(url) {
    return function(cb) {
      Wreck.get(url, { json:true }, function(err, res, payload) {
        cb(err, JSON.parse(payload)); // Coindesk fails to properly set headers
      });
    }
  });

  async.parallel(downloadList, function(err, results) {
    if (err) return callback(err);

    formatResponse(currencies, results, callback);
  });
};

