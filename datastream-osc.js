/*******************************************************************************

  Bare Conductive Pi Cap
  ----------------------

  datastream-osc.js - streams capacitive sense data from MPR121 to OSC endpoint

  Written for Raspberry Pi.

  Bare Conductive code written by Szymon Kaliski.

  This work is licensed under a Creative Commons Attribution-ShareAlike 3.0
  Unported License (CC BY-SA 3.0) http://creativecommons.org/licenses/by-sa/3.0/

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

 *******************************************************************************/

var MPR121 = require('node-picap');
var argv   = require('yargs').argv;
var osc    = require('omgosc');

var mpr121;

var host = '127.0.0.1';
var port = 3000;

function printHelp() {
  console.log('Sends Pi Cap readings through OSC - MUST be run as root.\n');
  console.log('Usage: node datastream-osc.js [OPTIONS]\n');
  console.log('Options:');
  console.log('  -h, --host   host address, defaults to 127.0.0.1');
  console.log('  -p, --port   port on which to send, defaults to 3000');
  console.log('      --help   displays this message');

  process.exit(0);
}

if (argv.help) { printHelp(); }
if (argv.h || argv.host) { host = argv.h || argv.host; }
if (argv.p || argv.port) { port = argv.p || argv.port; }

try {
  mpr121 = new MPR121();
}
catch (e) {
  console.log(e);
  process.exit(1);
}

var sender = new osc.UdpSender(host, parseInt(port));

console.log('sending to: ' + host + ':' + port);

mpr121.on('data', function(data) {
  var touch = data.map(function(electrode) { return electrode.isTouched ? 1 : 0; });
  var tths  = data.map(function(electrode) { return electrode.touchThreshold; });
  var rths  = data.map(function(electrode) { return electrode.releaseThreshold; });
  var fdat  = data.map(function(electrode) { return electrode.filtered; });
  var bval  = data.map(function(electrode) { return electrode.baseline; });
  var diff  = data.map(function(electrode) { return electrode.baseline - electrode.filtered; });

  sender.send('/touch', touch.map(function() { return 'i'; }).join(''), touch);
  sender.send('/tths',  tths.map(function() { return 'i'; }).join(''), tths);
  sender.send('/rths',  rths.map(function() { return 'i'; }).join(''), rths);
  sender.send('/fdat',  fdat.map(function() { return 'i'; }).join(''), fdat);
  sender.send('/bval',  bval.map(function() { return 'i'; }).join(''), bval);
  sender.send('/diff',  diff.map(function() { return 'i'; }).join(''), diff);
});
