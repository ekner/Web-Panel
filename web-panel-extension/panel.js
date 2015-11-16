// Get the elements:
var iframe          = document.getElementById('iframe');
var url             = document.getElementById("url");
var reloadButton    = document.getElementById("reload");
var bookmarksButton = document.getElementById("bookmarks");
var bookmarksPopup  = document.getElementById("bookmarks-popup");
var addBookmark    =  document.getElementById("add-bookmark");

var wpb; //web panel bookmarks folder id
var historyArray = new Array(); // History
var currentPos = -1; // Current position in history

/* Get stored history information */
chrome.storage.local.get(['historyArray', 'currentPos'], function(object) {
  if ( typeof object.historyArray != "undefined" && typeof object.currentPos != "undefined") {
    historyArray = object.historyArray;
    currentPos = object.currentPos;
  }
});

/* Function for storing current history information */
function storeHistory() {
  chrome.storage.local.set({'historyArray': historyArray, 'currentPos': currentPos});
}

chrome.storage.local.get('lastSite', function(object) {
  if ( typeof object.lastSite == "undefined") {
    chrome.storage.local.set({'lastSite': 'example.com'});
    url.value = "example.com";
    changeUrl();
  } else {
    url.value = object.lastSite;
    changeUrl();
  }
});

chrome.runtime.onMessage.addListener(function(message, sender) {
  if (message.fromCnt && !sender.frameId) {
    url.value = message.link;

    // Check if the page was just reloaded:
    if (historyArray[historyArray.length - 1] != message.link) {
      // Check if the page was navigated to via history buttons. Then it shouldn't be added to history again:
      if (historyArray[currentPos] != message.link) {
        historyArray.length = currentPos + 1;
        historyArray.push(message.link);

        // Max length 25:
        if (historyArray.length > 25) {
          historyArray.shift();
        } else {
          currentPos++;
        }

        storeHistory();
      }
      chrome.storage.local.set({'lastSite': url.value});
    }
  }
});

$("#back").click(function() {
  if (currentPos > 0) {
    currentPos --;
    iframe.src = historyArray[currentPos];
    storeHistory();
  }
});

$("#forward").click(function() {
  if (currentPos + 1 != historyArray.length) {
    currentPos ++;
    iframe.src = historyArray[currentPos];
    storeHistory();
  }
});

function changeUrl() {
  var search = url.value.match(/^[a-zA-Z]+:\/\//i);

  if (search == null) {
    $("#iframe").attr('src', "http://" + url.value);
  } else {
    $("#iframe").attr('src', url.value);
  }
}

reloadButton.onclick = function() {
	changeUrl();
}

url.onkeypress = function(e){
  if (e.keyCode == '13'){
    changeUrl();
    return false;
  }
}

addBookmark.onclick = function createBookmark() {
  if (url.value != "") {
    var title = prompt("Bookmark title:", url.value);
    if (title == "") {
      alert("Please type a title for the bookmark. Press cancel on the next pop-up to escape.");
      createBookmark();
    } else if (title != null) {
      chrome.bookmarks.create({'parentId': wpb, 'url': url.value, 'title': title}, function(result) {
        if (result === undefined) {
          alert("Bookmark not created: " + chrome.extension.lastError.message);
        }
      });
      loadBookmarks();
    }
  } else {
    alert("You haven't entered a url.");
  }
}

chrome.bookmarks.search("Web Panel extension", function(list) {
  if (typeof list[0] == "undefined") {
    chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder) {
      wpb = folder.id;
      loadBookmarks();
    });
  } else {
    chrome.bookmarks.get(list[0].parentId, function(parent) {
      if (parent[0].title == "Trash") {
        chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder) {
          wpb = folder.id;
          loadBookmarks();
        });
      } else {
        wpb = list[0].id;
        loadBookmarks();
      }
    });
  }
});

function loadBookmarks() {
  var bookmarks = [];
  chrome.bookmarks.getChildren(wpb, function(result) {
    var content = "";
    result.forEach(function(entry) {
      if (typeof entry.url == "undefined") {
        return; // If it's a folder, skip it
      }
      var re = /(<([^>]+)>)/ig;
      entry.title = entry.title.replace(re, "");
      entry.url = entry.url.replace(re, "");

      // ES6 multi-line string with backticks, Opera 28+:
      content += `<div extension="tes t" title="` + entry.url + `" class="box">
                  <img class="favicon-img" src="http://www.google.com/s2/favicons?domain=` + entry.url + `"></img>
                  <div class="text-box"><p class="link">` + entry.title + `</p></div>
                  </div>`;
      bookmarks.push({id: entry.id, url: entry.url});
    });
    bookmarksPopup.innerHTML = content;

    var links = document.getElementsByClassName("box");
    for (var i = 0; i < links.length; i++) {
      (function() {
        var thisNumber = i;
        links[i].oncontextmenu = function(e) {
          e.preventDefault();
          chrome.bookmarks.remove(bookmarks[thisNumber].id, function() {
            loadBookmarks();
          });
        }
        links[i].onclick = function(e) {
          if (e.button == 0) {
            url.value = bookmarks[thisNumber].url;
            changeUrl();
            fadeOut();
          }
        }
      })();
    }
  });
}

var bookmarksPopupClosed = true;
bookmarksButton.onclick = function() {
  if (bookmarksPopupClosed) {
    fadeIn();
  } else {
    fadeOut();
  }
}

function fadeIn() {
  bookmarksPopup.style.display = "block";
  var animateIn = function() {
    bookmarksPopup.style.opacity = +bookmarksPopup.style.opacity + 0.20;
    if (+bookmarksPopup.style.opacity < 1) {
      requestAnimationFrame(animateIn);
    }
  }
  requestAnimationFrame(animateIn);
  bookmarksPopupClosed = false;
}

function fadeOut() {
  var animateOut = function() {
    bookmarksPopup.style.opacity = +bookmarksPopup.style.opacity - 0.20;
    if (+bookmarksPopup.style.opacity > 0) {
      requestAnimationFrame(animateOut);
    } else {
      bookmarksPopup.style.display = "none";
    }
  }
  requestAnimationFrame(animateOut);
  bookmarksPopupClosed = true;
}

var expandContentWidth = $("#expand-content").outerWidth();
$("#expand-content").css({marginLeft: "-61px"});
var expandOpen = false;

function expand() {
  if (!expandOpen) {
    chrome.storage.local.set({'expandOpen': 'true'});
    $("#expand-content").animate({
      marginLeft: "0px"
    }, 200 );
  } else {
    chrome.storage.local.set({'expandOpen': 'false'});
    $("#expand-content").animate({
      marginLeft: "-61px"
    }, 200 );
  }
  expandOpen = !expandOpen;
}

$("#expand").click(function() {
  expand();
});

chrome.storage.local.get('expandOpen', function(object) {
  if ( object.expandOpen == "true") {
    expand();
  }
});
