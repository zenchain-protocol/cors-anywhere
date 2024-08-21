// Listen on a specific host via the HOST environment variable
var host = process.env.HOST || '0.0.0.0';
// Listen on a specific port via the PORT environment variable
var port = process.env.PORT || 8080;

// Grab the blacklist from the command-line so that we can update the blacklist without deploying
// again. CORS Anywhere is open by design, and this blacklist is not used, except for countering
// immediate abuse (e.g. denial of service). If you want to block all origins except for some,
// use originWhitelist instead.
var originBlacklist = parseEnvList(process.env.CORSANYWHERE_BLACKLIST);
var originWhitelist = parseEnvList(process.env.CORSANYWHERE_WHITELIST);
function parseEnvList(env) {
  if (!env) {
    return [];
  }
  return env.split(',');
}

// Set up rate-limiting to avoid abuse of the public CORS Anywhere server.
var checkRateLimit = require('./lib/rate-limit')(process.env.CORSANYWHERE_RATELIMIT);

// Determine if logging is enabled via environment variable
var enableRequestLogging = process.env.ENABLE_REQUEST_LOGGING === 'true';

function requestResponseLogger(req, res, next){
  // Import `util` only within this function
  var util = require('util');

  // Log the incoming request
  console.log('\n=== Incoming Request ===');
  console.log('Method: ' + req.method);
  console.log('URL: ' + req.url);
  console.log('Headers:', util.inspect(req.headers, {depth: null, colors: true}));

  // Wrap the `res.end` function to log the outgoing response
  var originalEnd = res.end;
  res.end = function (){
    console.log('\n=== Outgoing Response ===');
    console.log('Status: ' + res.statusCode);
    console.log('Headers:', util.inspect(res.getHeaders(), {depth: null, colors: true}));
    originalEnd.apply(res, arguments); // Use `arguments` to ensure compatibility with Node.js 15
  };

  next();
}

var cors_proxy = require('./lib/cors-anywhere');
cors_proxy.createServer({
  originBlacklist: originBlacklist,
  originWhitelist: originWhitelist,
  requireHeader: ['origin', 'x-requested-with'],
  checkRateLimit: checkRateLimit,
  removeHeaders: [
    'cookie',
    'cookie2',
    // Strip Heroku-specific headers
    'x-request-start',
    'x-request-id',
    'via',
    'connect-time',
    'total-route-time',
    // Other Heroku added debug headers
    // 'x-forwarded-for',
    // 'x-forwarded-proto',
    // 'x-forwarded-port',
  ],
  redirectSameOrigin: true,
  httpProxyOptions: {
    // Do not add X-Forwarded-For, etc. headers, because Heroku already adds it.
    xfwd: false,
  },
  middleware: enableRequestLogging ? [requestResponseLogger] : [],
}).listen(port, host, function () {
  console.log('Running CORS Anywhere on ' + host + ':' + port);
});
