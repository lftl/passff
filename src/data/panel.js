/* jshint node: true */
/* global document */
/* global self */
'use strict';

let entryList = document.getElementById('entry-list');
let itemStack = [];


self.port.on('update-items', function (items) {
  itemStack = [
    { children: items }  // fake root item
  ];
  updateView();
});

let searchBox = document.getElementById('search-box');
searchBox.addEventListener('keyup', function(e) {
    self.port.emit('search', searchBox.value);
    if(e.keyCode == 13) {
        self.port.emit('fill', itemStack[itemStack.length-1].children[0]);
    } else if (e.keyCode == 40) {
        entryList.focus();
        entryList.children[0].selected = true;
    }
});

self.port.on('show', function(url) {
    if(url) {
        searchBox.value = url;
    }
    searchBox.focus();
    searchBox.select();
});

let refresh = document.getElementById('refresh');
refresh.addEventListener('click', function() {
    self.port.emit('refresh');
});

function updateView() {
  entryList.innerHTML = '';

  if (itemStack.length > 1) {
    let upItem = document.createElement('option');
    upItem.innerHTML = '..';
    upItem.addEventListener('click', function () {
      itemStack.pop();
      updateView();
    });
    entryList.appendChild(upItem);
  }

  let top = itemStack[itemStack.length - 1];
  top.children.map(createEntryOption)
              .forEach(entryList.appendChild.bind(entryList));
}

function createEntryOption(item) {
  let entryOption = document.createElement('option');
  entryOption.innerHTML = item.key;
  entryOption.item = item;

  if (typeof item.children == 'object' && item.children.length > 0) {
    entryOption.innerHTML += '/';
    entryOption.addEventListener('click', function () {
      itemStack.push(item);
      updateView();
    });
  } else if (typeof item.activate == 'function') {
    entryOption.addEventListener('click', item.activate);
  } else {
    entryOption.addEventListener('click', function () {
      item.children = [
        { key: 'Fill', activate: self.port.emit.bind(this, 'fill', item) },
        { key: 'Fill and Submit', activate: self.port.emit.bind(this, 'fill-submit', item) },
        { key: 'Goto, fill and submit', activate:  self.port.emit.bind(this, 'goto-fill-submit', item) },
        { key: 'Goto', activate:  self.port.emit.bind(this, 'goto', item) },
        { key: 'Copy login', activate:  self.port.emit.bind(this, 'copy-login', item) },
        { key: 'Copy password', activate:  self.port.emit.bind(this, 'copy-password', item) }
      ];
      itemStack.push(item);
      updateView();
      item.children = [];
    });
  }

  return entryOption;
}

entryList.addEventListener('keyup', function(e) {
    if(e.keyCode == 13) {
        entryList.selectedOptions[0].click();
    }
});
