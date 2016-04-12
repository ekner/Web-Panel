var wpb; //web panel bookmarks folder id
var historyArray = new Array(); // History
var currentPos = -1; // Current position in history

/* Get stored history information */
chrome.storage.local.get(['historyArray', 'currentPos'], function(object)
{
  if ( typeof object.historyArray != "undefined" && typeof object.currentPos != "undefined")
  {
    historyArray = object.historyArray;
    currentPos = object.currentPos;
  }
});

/* Function for storing current history information */
function storeHistory()
{
  chrome.storage.local.set({'historyArray': historyArray, 'currentPos': currentPos});
}

chrome.storage.local.get('lastSite', function(object)
{
  if ( typeof object.lastSite == "undefined")
  {
    chrome.storage.local.set({'lastSite': 'example.com'});
    $("#url").val("example.com");
    changeUrl();
  }
  else
  {
    $("#url").val(object.lastSite);
    changeUrl();
  }
});

chrome.runtime.onMessage.addListener(function(message, sender)
{
  // If the sender doesn't have a frame id, then we know it comes from the sidebar
  if (message.fromCnt && !sender.frameId)
  {
    $("#url").val(message.link);
    $("#loading").css("display", "none");

    // Check if the page was just reloaded:
    if (historyArray[historyArray.length - 1] != message.link)
    {
      // Check if the page was navigated to via history buttons. Then it shouldn't be added to history again:
      if (historyArray[currentPos] != message.link)
      {
        historyArray.length = currentPos + 1;
        historyArray.push(message.link);

        // Max length 25:
        if (historyArray.length > 25)
          historyArray.shift();
        else
          currentPos++;

        storeHistory();
      }
      chrome.storage.local.set({'lastSite': $("#url").val() });
    }
  }
});

$("#back").click(function()
{
  if (currentPos > 0)
  {
    $("#loading").css("display", "block");
    currentPos --;
    $("#iframe").attr('src', historyArray[currentPos]);
    storeHistory();
  }
});

$("#forward").click(function()
{
  if (currentPos + 1 != historyArray.length)
  {
    $("#loading").css("display", "block");
    currentPos ++;
    $("#iframe").attr('src', historyArray[currentPos]);
    storeHistory();
  }
});

function changeUrl()
{
  $("#loading").css("display", "block");

  var search = $("#url").val().match(/^[a-zA-Z]+:\/\//i);

  if (search == null)
    $("#iframe").attr('src', "http://" + $("#url").val());
  else
    $("#iframe").attr('src', $("#url").val());
}

$("#reload").click(function()
{
  changeUrl();
});

$("#url").keypress(function( event )
{
  if ( event.which == 13 )
  {
     event.preventDefault();
     changeUrl();
     return false;
  }
});

function createBookmark()
{
  if ($("#url").val() != "")
  {
    var title = prompt( "Bookmark title:", $("#url").val() );
    if (title == "")
    {
      alert("Please type a title for the bookmark. Press cancel on the next pop-up to escape.");
      createBookmark();
    }
    else if (title != null)
    {
      chrome.bookmarks.create({'parentId': wpb, 'url': $("#url").val(), 'title': title}, function(result)
      {
        if (result === undefined)
          alert("Bookmark not created: " + chrome.extension.lastError.message);
      });
      loadBookmarks();
    }
  }
  else
  {
    alert("You haven't entered a url.");
  }
}

$("#add-bookmark").click(createBookmark);

chrome.bookmarks.search("Web Panel extension", function(list)
{
  if (typeof list[0] == "undefined")
  {
    chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder)
    {
      wpb = folder.id;
      loadBookmarks();
    });
  }
  else
  {
    chrome.bookmarks.get(list[0].parentId, function(parent)
    {
      if (parent[0].title == "Trash")
      {
        chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder)
        {
          wpb = folder.id;
          loadBookmarks();
        });
      }
      else
      {
        wpb = list[0].id;
        loadBookmarks();
      }
    });
  }
});

function loadBookmarks()
{
  chrome.bookmarks.getChildren(wpb, function(result)
  {
    var content = "";
    if (result.length == 0)
    {
      content = "<h3 style='margin-left: 10px;'>You have no bookmarks</h3>";
    }
    else
    {
      result.forEach(function(entry)
      {
        if (typeof entry.url == "undefined")
          return; // If it's a folder, skip it
          
        var re = /(<([^>]+)>)/ig;
        entry.title = entry.title.replace(re, "");
        entry.url = entry.url.replace(re, "");

        // ES6 multi-line string with backticks, Opera 28+:
        content += `<div data-id="` + entry.id + `" title="` + entry.url + `" class="box">
                    <img class="favicon-img" src="http://www.google.com/s2/favicons?domain=` + entry.url + `"></img>
                    <div class="text-box"><p class="link">` + entry.title + `</p></div>
                    </div>`;
      });
    }
    $("#bookmarks-popup").html(content);

    $(".box").on('contextmenu', function(e)
    {
      e.preventDefault();
      chrome.bookmarks.remove( $(this).attr("data-id"), function()
      {
        loadBookmarks();
      });
    });
    $('.box').mousedown(function(event)
    {
      if (event.which == 1)
      {
        $("#url").val( $(this).attr("title") );
        changeUrl();
        fadeOut();
      }
    });
  });
}

var bookmarksPopupClosed = true;

$("#bookmarks").click(function()
{
  if (bookmarksPopupClosed)
    fadeIn();
  else
    fadeOut();
});

function fadeIn()
{
  //$("#bookmarks-popup").css("display", "block");
  $("#bookmarks-popup").fadeIn(100);
  bookmarksPopupClosed = false;
}

function fadeOut()
{
  $("#bookmarks-popup").fadeOut(100, function()
  {
    //$("#bookmarks-popup").css("display", "none");
  });
  bookmarksPopupClosed = true;
}

var expandContentWidth = $("#expand-content").outerWidth();
$("#expand-content").css({marginLeft: "-61px"});
var expandOpen = false;

function expand()
{
  if (!expandOpen)
  {
    chrome.storage.local.set({'expandOpen': 'true'});
    $("#expand-content").animate(
    {
      marginLeft: "0px"
    },
    200 );
  }
  else
  {
    chrome.storage.local.set({'expandOpen': 'false'});
    $("#expand-content").animate(
    {
      marginLeft: "-61px"
    },
    200 );
  }
  expandOpen = !expandOpen;
}

$("#expand").click(function()
{
  expand();
});

chrome.storage.local.get('expandOpen', function(object)
{
  if ( object.expandOpen == "true")
    expand();
});
