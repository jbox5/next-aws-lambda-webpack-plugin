'use strict';
const {SSR_API_GATEWAY_DNS,SSR_PAGES} = require('./parameters');

function setCustomOrigin(request,host) {
 const origin = request.origin ? request.origin : {};
 request.headers = request.headers ? request.headers : {};
 if (request.origin.s3) {
  delete request.origin.s3;
 }
 request.uri = request.uri === '/' ? '/index' : request.uri;
 request.headers['host'] = [{key: 'host', value: host}];
 
 origin.custom = {
  domainName: host,
  customHeaders : {},
  keepaliveTimeout: 5,
  path: "/Prod",
  port: 443,
  protocol: "https",
  readTimeout: 30,
  sslProtocols: [
   "TLSv1",
   "TLSv1.1",
   "TLSv1.2"
  ]
 }
 
 request.origin = origin;
}

function isCookiePresent(headers,name) {
 for (let i = 0; i < headers.cookie.length; i++) {
  if (headers.cookie[i].value.indexOf(name) >= 0) {
   return true
  }
 }
}

function setS3Origin(request) {
 request.headers = request.headers ? request.headers : {};
 if (request.origin.custom) {
  delete request.origin.custom;
 }
 console.log("request.uri",request.uri);
 if (request.uri.match(/\/$/)) {
  request.uri = `${request.uri}index.html`
 } else if (request.uri.match(/\/(.+\.[^\/]+)$/) === null) {
  request.uri = `${request.uri}.html`
 }
}

function checkSSR(uri) {
 uri = uri === "/" ? "/index" : uri;
 for (const path of SSR_PAGES) {
  let regex = `^${path.replace(/\[.+\]/,".*")}$`;
  let result_regex = (new RegExp(regex)).exec(uri);
  if (result_regex !== null) {
   return true;
  }
 }
 return false;
}

exports.handler = (event, context, callback) => {
 const request = event.Records[0].cf.request;
 
 console.log('INTPUT');
 console.log(JSON.stringify(request,0,1));
 
 if (checkSSR(request.uri)) {
  setCustomOrigin(request,SSR_API_GATEWAY_DNS)
 } else {
  setS3Origin(request)
 }
 
 console.log('OUTPUT');
 console.log(JSON.stringify(request,0,1));
 
 callback(null, request);
};