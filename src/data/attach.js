/* jshint node: true */
/* global self */
/* global document */
'use strict';

Array.prototype.remove = function(value) {
  let index = this.indexOf(value);
  if (index >= 0) {
    this.splice(index, 1);
  }
  return index >= 0;
};

let autoSubmittedUrls = [];
let autoFillAndSubmitPending = false;

let passwordFieldNames;
let loginFieldNames;
let iframeSearchDepth;

self.port.on('update-prefs', function(prefs) {
  passwordFieldNames = prefs.passwordFieldNames.toLowerCase().split(',');
  loginFieldNames = prefs.loginFieldNames.toLowerCase().split(',');
  iframeSearchDepth = prefs.iframeSearchDepth;
  console.log(passwordFieldNames);
  console.log(loginFieldNames);
});

self.port.on('fill', processDocument);

self.port.on('fill-submit', function(passwordData) {
  processDocument(passwordData);
  submit();
});

function processDocument(passwordData, doc = document, depth = 0) {
  getPasswordInputs(passwordFieldNames).forEach(function(input) {
    input.value = passwordData.password;
  });
  getLoginInputs(loginFieldNames).forEach(function(input) {
    input.value = passwordData.login;
  });

  if (depth <= iframeSearchDepth) {
    let iframes = doc.getElementsByTagName('iframe');
    Array.prototype.slice.call(iframes).forEach(function(iframe) {
      processDocument(iframe.contentDocument, passwordData, depth++);
    });
  }
}

function submit() {
  let passwordInputs = getPasswordInputs(passwordFieldNames);
  if (passwordInputs.length === 0) {
    return;
  }

  let form = (function(input) {
    while (input !== null && input.tagName.toLowerCase() != 'form') {
      input = input.parentNode;
    }
    return input;
  })(passwordInputs[0]);

  if (!form) {
    console.debug('No form found to submit');
    return;
  }

  console.debug('Found form to submit', form);
  let submitButton = getSubmitButton(form);

  if (submitButton) {
    console.info('Click submit button');
    submitButton.click();
  } else {
    console.info('Submit form');
    form.submit();
  }
}

function matchFieldName(fieldName, goodFieldNames) {
  fieldName = fieldName.toLowerCase();
  let goodName;
  for (let i = 0; i < goodFieldNames.length; i++) {
    if (fieldName.indexOf(goodFieldNames[i].toLowerCase()) !== -1) {
      return true;
    }
  }
  return false;
}

function getLoginInputs(loginInputNames) {
  let inputArray = Array.prototype.slice.call(document.getElementsByTagName('input'));
  return inputArray.filter(function(input) {
    return (input.type == 'text' || input.type == 'email' || input.type == 'tel') &&
            (matchFieldName(input.name, loginInputNames) || matchFieldName(input.id, loginInputNames));
  });
}

function getPasswordInputs(passwordInputNames) {
  let inputArray = Array.prototype.slice.call(document.getElementsByTagName('input'));
  return inputArray.filter(function(input) {
    return (input.type == 'password');
  });
}

function getSubmitButton(form) {
  let buttons = form.querySelectorAll('button[type=submit]');

  if (buttons.length === 0) {
    buttons = Array.prototype.slice.call(form.querySelectorAll('input[type=submit]'));
  }

  if (buttons.length === 0) {
    return null;
  }

  return Array.prototype.slice.call(buttons, buttons.length - 1, buttons.length)[0];
}

