// This software is freeware with MIT license

webchmView = new function() {

// Setup
// ---------------------------

var self = this;

// TOOLS
// ---------------------------

function getQueryParams(query, namePrefix) {
  if (namePrefix == null) { namePrefix = ''; }
  var params = {};
  if (query.length > 0) {
    if (query[0] == '?') {
      query = query.substring(1);
    }
    var parts = query.split('&');
    for (var i = 0; i < parts.length; i++) {
      var param = parts[i].split('=');
      if (param.length == 2) {
        params[namePrefix + decodeURIComponent(param[0])] = decodeURIComponent(param[1]);
      }
    }
  }
  return params;
}

function execAjax(url, callback) {
  var theReq = new XMLHttpRequest();
  theReq.open('GET', url);
  theReq.onreadystatechange = function () { 
    if (theReq.readyState === 4) {
      if ((theReq.status >= 200) && (theReq.status <= 299)) {
        callback(theReq);
      } else {
        callback(null);
      }
    }
  };
  theReq.send();
}

// CORE
// ---------------------------

function fillTreeIndexNodeByHhc(hhcText) {
  function getAnchorTreeParent(a) {
    function isEqualIc(s1,s2) { return s1.toUpperCase() === s2.toUpperCase(); }
    p = a;
    var parents = [ 'li', 'ul', 'li' ];
    for (var i = 0; i < parents.length; i++) {
      if ((p.parentNode == null) || (!isEqualIc(p.parentNode.tagName,parents[i]))) { return null; }
      p = p.parentNode;
    }
    return p;
  }

  var text = hhcText;
  var node = document.getElementById('webchm_help_tree');
  node = webchm.fillNodeByChmHhc(node, text, { 
    onAnchorAdded: function(a) {
      a.setAttribute('target', 'help_content');
      a.parentNode.classList.add('subtree-collapsed');
      a.parentNode.setAttribute('onclick', 'webchmView.procTreeNodeToggleColapse(this, event)');
      var p = getAnchorTreeParent(a);
      if (p != null) {
        p.classList.add('has-children');
      }
    }
  });

  return node;
}

function procTreeNodeToggleColapse(li, e) {
  e.stopPropagation();
  if (li.classList.contains('subtree-collapsed')) {
    li.classList.remove('subtree-collapsed');
    li.classList.add('subtree-open');
  } else if (li.classList.contains('subtree-open')) {
    li.classList.remove('subtree-open');
    li.classList.add('subtree-collapsed');
  }
}

function procChangeContentDocLocation(helpPageFrame) {
   function openParents(a) {
     var p = a.parentNode; // li
     if (p != null) { p = p.parentNode; } // ul (do not open me, just parents)
     while((p != null) && (p.classList != null)) {
       if (p.classList.contains('subtree-collapsed')) {
         p.classList.remove('subtree-collapsed');
         p.classList.add('subtree-open');
       }
       p = p.parentNode;
     }
   }
   var loc = helpPageFrame.contentDocument.location;
   var tree = document.getElementById('webchm_help_tree');
   var ans  = tree.getElementsByTagName('a');
   for (var i = 0; i < ans.length; i++) {
     var a = ans[i];
     if (a.href == loc) {
       a.classList.add('active');
       openParents(a);
     } else {
       a.classList.remove('active');
     }
   }
}

// Boot
// -------------------------------------------------

function boot(indexFileNameDefault, isIndexQueryParamAllowed) {

  if (indexFileNameDefault    == null)  { indexFileNameDefault    = 'index.hhc'; }
  if (isIndexQueryParamAllowed == null) { isIndexQueryParamAllowed = false; }

  var indexFileName = null;

  if (isIndexQueryParamAllowed) {
    var params = getQueryParams(location.search, 'q@');

    if (params['q@index'] != null) {
      indexFileName = params['q@index'];
    }

    // this is forbidden for security reasons:
    // (cannot load anything from another path or subdomain or query, only name supported)

    var FORBIDDEN_IN_INDEX_FILE_NAME = [ '\\', '//', '/', ':', '..', '?' ]; 

    if (indexFileName != null) {
      for (var i = 0; i < FORBIDDEN_IN_INDEX_FILE_NAME.length; i++) {
        if (indexFileName.indexOf(FORBIDDEN_IN_INDEX_FILE_NAME[i]) >= 0) {
          console.log('Invalid index file name', [indexFileName]);
          indexFileName = null;
          break;
        }
      }
    }

    var INDEX_FILE_NAME_EXTENSION = '.hhc'; 

    if (indexFileName != null) {
      if (indexFileName.length < INDEX_FILE_NAME_EXTENSION.length) {
          console.log('Invalid index file name (too short)', [indexFileName]);
          indexFileName = null;
      }
    }

    if (indexFileName != null) {
      if (indexFileName.substr(-INDEX_FILE_NAME_EXTENSION.length).toLowerCase() !== INDEX_FILE_NAME_EXTENSION) {
          console.log('Invalid index file name (only '+INDEX_FILE_NAME_EXTENSION+' extension supported)', [indexFileName]);
          indexFileName = null;
      }
    }
  }

  if (indexFileName == null) {
    indexFileName = indexFileNameDefault;
  }

  function showError(msg) {
    console.log(msg);
    var node = document.getElementById('webchm_help_tree_load_sign');
    node.innerText = msg;
    node.classList.remove('tree-load-wait');
    node.classList.add('tree-load-error');
  }

  if ((indexFileName == null) || (indexFileName == "")) {
    showError('Invalid index file name' + '\n' + 'See console log for details');
    return;
  }

  execAjax(indexFileName, function(theReq) {
    if (theReq != null) {
      if ((theReq.responseText == null) || (theReq.responseText == '')) {
        showError('ERROR! Cannot access index file response text');
      } else {
        var node = fillTreeIndexNodeByHhc(theReq.responseText);
        if (node != null) {
          // load first page
          var ans = node.getElementsByTagName('a');
          if (ans.length > 0) {
            var a = ans[0];
            a.click();
          }
        }
      }
    } else {
      var msg = '';

      msg += 'ERROR!';
      msg += '\n'+'Cannot load help index ['+indexFileName+']'

      msg += '\n'+'Please rename (or copy) your help .hhc file to ['+indexFileName+']';

      if (isIndexQueryParamAllowed) {
        msg += '\n' + 'Alternatively, you may provide correct index file name as [index] argument: ';
        msg += '\n' + document.location.pathname + '?' + 'index=' + '{name of your .hhc file}';
      }

      showError(msg);
    }
  });
}

// Export

self.boot = boot;
self.procChangeContentDocLocation = procChangeContentDocLocation;
self.procTreeNodeToggleColapse    = procTreeNodeToggleColapse;

}();
