var wpb; //web panel bookmarks folder id

chrome.storage.local.get('lastSite', function(object)
{
  if ( typeof object.lastSite === "undefined")
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

    chrome.storage.local.set({'lastSite': $("#url").val() });
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
  if (typeof list[0] === "undefined")
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
        if (typeof entry.url === "undefined")
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
  $("#bookmarks-popup").fadeOut(100, function() {
    //$("#bookmarks-popup").css("display", "none");
  });
  bookmarksPopupClosed = true;
}

/* Auto-refresh: */

var displayAutoReload = true;
var autoReload = false;

function openAutoReload()
{
  displayAutoReload = false;
      
  $("#auto-reload").css("left", event.pageX);
  $("#auto-reload").css("top", event.pageY);
  
  $("#auto-reload").css("display", "block");
}

function closeAutoReload()
{
  displayAutoReload = true;
  $("#auto-reload").css("display", "none");
}

$("#reload").bind("contextmenu", function (event)
{
  event.preventDefault();

  if (displayAutoReload)
    openAutoReload();
  else
    closeAutoReload();
});

// The user should also be able to close with left click:
$("#reload").click(function()
{
  if (!displayAutoReload)
    closeAutoReload();
});

// And by pressing "close":
$("#auto-reload .close").click(function()
{
  if (!displayAutoReload)
    closeAutoReload();
});

function setReload(time, item)
{
  removeReload();
  
  autoReload = setInterval(function()
  {
    changeUrl();
  },
  time * 1000);
  
  $(item).css("color", "lightblue");
  $("#reload").css("background-color", "lightblue");
  $("#auto-reload .clear").css("display", "block");
}

function removeReload()
{
  $("#auto-reload li").css("color", "black");
  $("#reload").css("background-color", "transparent");
  $("#auto-reload .clear").css("display", "none");
  
  if (autoReload != false)
    clearInterval(autoReload);
    
  closeAutoReload();
}

$("#auto-reload li").click(function()
{
  // The Value the user clicked on on the list:
  var item = this;
  var time = Number( $(this).attr("data-time") );
  
  // Security, if the user has modified the HTML:
  if (isNaN(time))
    return;
  
  if (time != 0)
  {
    setReload(time, item);
  }
  else
  {
    var lastCustomTime = "";
    chrome.storage.local.get('lastCustomTime', function(object)
    {
      if ( typeof object.lastCustomTime !== "undefined")
        lastCustomTime = object.lastCustomTime;
    });
    
    time = "";
    var wrong = "";
    while (time != null && time.match(/^\d+:\d+:\d+$/) == null || time == "0:0:0")
    {
      time = prompt(wrong + "Please enter the interval in this format: Hours:Minutes:Seconds", lastCustomTime);
      wrong = "Wrong format specified.\n\n";
    }
    // If the user has pressed cancel on the prompt:
    if (time == null)
      return;
    
    chrome.storage.local.set({'lastCustomTime': time});
    var values = time.split(":");
    time = Number(values[0]) * 3600 + Number(values[1]) * 60 + Number(values[2]);
    setReload(time, item);
  }
});

$("#auto-reload .clear").click(function()
{
  removeReload();
});
