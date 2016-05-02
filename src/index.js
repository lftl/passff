/* jshint node: true */
'use strict';

let { Cc, Ci } = require('chrome');

let buttons = require('sdk/ui/button/action');
let prefs = require('sdk/simple-prefs').prefs;
let self = require('sdk/self');
let tabs = require('sdk/tabs');
let {URL} = require('sdk/url');

let workers = require('lib/workers');
let pass = require('lib/pass');

let panel = require('sdk/panel').Panel({
  contentURL: self.data.url('panel.html'),
  contentScriptFile: self.data.url('panel.js')
});

let copyToClipboard = function(text) {
    let str = Cc['@mozilla.org/supports-string;1'].createInstance(Ci.nsISupportsString);
    let trans = Cc['@mozilla.org/widget/transferable;1'].createInstance(Ci.nsITransferable);
    let clip = Cc['@mozilla.org/widget/clipboard;1'].getService(Ci.nsIClipboard);

    str.data = text;

        trans.addDataFlavor('text/unicode');
    trans.setTransferData('text/unicode', str, str.data.length * 2);

    clip.setData(trans, null, Ci.nsIClipboard.kGlobalClipboard);
};

let showPanel = function() {
    var host = URL(tabs.activeTab.url).hostname.split('.').slice(-2).join('.');
    panel.show({ position: button });
    panel.port.emit('show', host);
};

let button = buttons.ActionButton({
  id: 'passff-button',
  label: 'PassFF',

  icon: {
    '16': './img/icon-16.png',
    '32': './img/icon-32.png',
    '64': './img/icon-64.png',
    '128': './img/icon-128.png'
  },

  onClick: function () {
      showPanel();
  }
});

panel.port.on('fill', function (item) {
  panel.hide();
  workers.getWorker(tabs.activeTab).port.emit('fill', pass.getPasswordData(item));
});

panel.port.on('fill-submit', function (item) {
  panel.hide();
  workers.getWorker(tabs.activeTab).port.emit('fill-submit', pass.getPasswordData(item));
});

panel.port.emit('update-items', pass.getRootItems());
panel.port.on('refresh', function() {
    panel.port.emit('update-items', pass.getRootItems());
});

panel.port.on('search', function(search) {
    panel.port.emit('update-items', pass.getMatchingItems(search));
});

panel.port.on('copy-login', function (item) {
    panel.hide();
    copyToClipboard(pass.getPasswordData(item).login);
});

panel.port.on('copy-password', function (item) {
    panel.hide();
    copyToClipboard(pass.getPasswordData(item).password);
});

var showHotKey = require('sdk/hotkeys').Hotkey({
    combo: "alt-p",
    onPress: function() {
        showPanel();
    }
});

