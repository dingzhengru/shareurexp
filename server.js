'use strict';
var path = require('path');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); // v1.0.5
var Firebase = require('firebase');
var nodemailer = require('nodemailer');

var app = express();
var server = http.Server(app);

var upload = multer(); // for parsing multipart/form-data

// settings
app.set('json spaces', 4);
app.set('x-powered-by', false);

// middleware
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// static middleware
app.use(express.static(path.join(__dirname, '/')));

// set header
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');

    next();
});

// Firebase
// var ref = new Firebase('https://scorching-inferno-8541.firebaseio.com');
// var researchRef = ref.child('universityResearch');

// Email
// 開放安全性 https://accounts.google.com/DisplayUnlockCaptcha, https://www.google.com/settings/security/lesssecureapps
var smtpConfig = {
    service: 'gmail',
    auth: {
        user: 'xiaoming8778@gmail.com',
        pass: 'asdf8778'
    }
};


app.post('/contact-us', function(request, response) {
    
    let contact = request.body.contact;
    
    let  transporter = nodemailer.createTransport(smtpConfig);

    var mailOptions = {
        from: contact.username + '' +  '<xiaoming8778@gmail.com>',
        to: 'qws7869vdx@gmail.com,1102137245@gm.kuas.edu.tw',
        subject: '聯絡我們:' + contact.title + ' | 我的專題網站',
        html: contact.content
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if(error) return console.log('error:', error);
        console.log('Message sent: ' + info.response);
    });
    
    response.send(true);
});

app.post('/report-article', function(request, response) {
    
    let report = request.body.report;
    
    let  transporter = nodemailer.createTransport(smtpConfig);
    
    var mailOptions = {
        from: report.user.displayName + '' +  '<xiaoming8778@gmail.com>',
        to: 'qws7869vdx@gmail.com,1102137245@gm.kuas.edu.tw',
        subject: '檢舉文章:' + report.article.title + ' 原因:' + report.title + ' | 我的專題網站',
        html: '<h2>檢舉原因: ' + report.title + '</h2>' + 
              '<h3>檢舉人ID: ' + report.user.uid + '</h3>' +  
              '<h3>檢舉文章ID: ' + report.article.$id + '</h3>' +  
              report.content
    };
    
    transporter.sendMail(mailOptions, function(error, info){
        if(error) return console.log('error:', error);
        console.log('Message sent: ' + info.response);
    });
    
    response.send(true);
});

app.get('*', function(request, response) {
	console.log('req:', request.ip);
    response.sendFile(__dirname + '/index.html');
});

var host = process.env.C9_HOSTNAME || process.env.HOSTNAME || 'localhost';
var port = 80;

if(process.env.C9_HOSTNAME)
    port = 8080;

server.listen(port, function() {
   console.log('server is running on', 'http://' + host + ':' + port); 
});

// ----------------------------------/ express
