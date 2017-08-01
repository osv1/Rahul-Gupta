'use strict';

var mongoose = require('mongoose'),
    Patient = mongoose.model('Patient'),
    User = mongoose.model('User'),
    Response = require('../lib/response.js'),
    constantsObj = require('./../../constants'),
    config = require('../../config/config.js'),
    validator = require('validator'),
    utility = require('../lib/utility.js'),
    async = require('async'),
    co = require('co'),
    querystring = require('querystring'),
    https = require('https');

module.exports = {
    issueInvoice: issueInvoice
};

/**
 * Function is use to Patient 
 * @access private
 * @return json
 * Created by Swapnali
 * @smartData Enterprises (I) Ltd
 * Created Date 20-April-2017
 */
function issueInvoice(req, res) {
     var data = querystring.stringify({
        doctype: 'invoice',
    });
    var url = "https://api.icount.co.il/api/v3.php/doc/create/?doctype=invoice&client_id=23&chk=chk&items\[0\]\[unitprice\]=100&items\[0\]\[quantity\]=1"
    https.get(url, function (response) {
        // data is streamed in chunks from the server
        // so we have to handle the "data" event    
        var buffer = "",
            data,
            route;

        response.on("data", function (chunk) {
            buffer += chunk;
        });

        response.on("end", function (err) {
            // finished transferring data
            // dump the raw data
            console.log(buffer);
            console.log("\n");
            data = JSON.parse(buffer);

            // extract the distance and time
            console.log("Walking Distance: " + route.legs[0].distance.text);
            console.log("Time: " + route.legs[0].duration.text);
        });
    });
    // http.request({
    //     host: 'www.icount.co.il',
    //     port: '443',
    //     path: 'api/v3.php/doc/create/',
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/x-www-form-urlencoded',
    //         'Content-Length': Buffer.byteLength(data)
    //     }
    // }, function(res) {
    //     res.setEncoding('utf8');
    //     console.log("response statusCode: ", res.statusCode);
    //     res.on('data', function (data) {
    //         console.log('Posting Result:\n');
    //         process.stdout.write(data);
    //         console.log('\n\nPOST Operation Completed');
    //     });
    // });
   // reqPost.write(data);
   // reqPost.end();
}
