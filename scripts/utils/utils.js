/*
 * utils.js
 * 
 * Some useful functions dealing with string manipulation, time, debugging,
 * xpaths, DOM manipulation, and visualization.
 * 
 */

WA.Utils = {
  /**
   * Removes spaces from the beginning/end of a string argument.
   * @param stringToTrim String that should have whitespace stripped from its
   *        start and end.
   * @return String with whitespace removed.
   */
  trim: function(str) {
    return ((str == null) ? null : str.replace(/^\s+|\s+$/g,""));
  },

  /**
   * Count the number of times the supplied regular expression is found in the
   * supplied string.
   * @param str String in which to count.
   * @param substr Regular expression to count.
   * @return Integer Count of times that the substring appears in the string.
   */
  countSubRE: function(str, substr) {
  	return str.length - str.replace(new RegExp(substr, 'i'), '').length;
  },

  /**
   * Count the number of words in the supplied string.
   * @param str String to count the number of words in.
   * @return Integer  Number of words in str.
   */
  countWords: function(str) {
  	return (this.trim(str).split(/\s+/).length);
  },

  /**
   * Returns a reference to the textarea used for recording messages.
   * @return Reference to textarea used for recording messages.
   */
  getRecordingTextarea: function() {
    var doc = getNavigationDocument();
    var rta = doc.getElementById('recording');
    return rta;
  },

  /**
   * Returns the current time.
   * @return The current time.
   */
  getTime: function() {
    var d = new Date();
    return d.valueOf();
  },

  /**
   * Add the text of the parameter line to the recording textarea.
   * @param line String to record in the recording text area.
   */
  recordLine: function(line) {
    if(recordActions) {
      var rta = this.getRecordingTextarea();
      rta.value += this.getTime() + " " + line + "\n";
    }
  },

  /**
   * Calls the supplied function on each document
   * and subdocument (frame, iframe).
   * 
   * @param doc Root document.
   * @param func Function to call on each document.
   */
  callForEachDoc: function(win, func) {
    for(var i=0; i < win.frames.length; i++) {
      func(win.frames[i].document);
    }
  },

  /**
   * Makes a POST HTTP request to the provided url, sending the provided parameters.
   * 
   * @param url URL to POST to.
   * @param params Parametercs to POST.
   * @param cb Callback for the onreadystatechange event.
   */
  postURL: function(url, params, cb) {
    var prefetch_req = null;

    // Find native XMLHttpRequest object.
    if(window.XMLHttpRequest) {
      prefetch_req = new XMLHttpRequest();
    } else if(window.ActiveXObject) {
      prefetch_req = new ActiveXObject("Microsoft.XMLHTTP");
    }

    // Setup callback and open the connection.
    prefetch_req.onreadystatechange = cb;
    prefetch_req.open("POST", url, true);

    //Send the proper header information along with the request.
    prefetch_req.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    prefetch_req.setRequestHeader("Content-length", params.length);
    prefetch_req.setRequestHeader("Connection", "close");

    // Make the request.
    prefetch_req.send(params);
  },

  /** 
   * Returns an XPATH for the specified node, starting with its document element
   * as root.
   * @param node DOM element to create the XPATH for.
   * @return A string of the XPATH that was created.
   */
  getXPath: function(node) {
   if(!node) {
   	return "(none)";
   }

   var xpath = "";

   var namespace = node.ownerDocument.documentElement.namespaceURI;
   var prefix = namespace ? "x:" : "";
  
   var node2 = node;
   var doc = node.ownerDocument;

   var node_id = null;
   if(node.getAttribute) {
     node_id = node.getAttribute('id');
   }

   for(var i=0; node2 && node2 != doc; i++) {
     if(!node2.tagName || !node2.parentNode) {
       return "";
     }

     var tag = node2.tagName.toLowerCase();
     var id = node2.id;
     var className = node2.className;
  
     var segment = prefix + tag;
     if(tag.length > 0) {
       var cl = node2.getAttribute('class');
       if(id && id != "" && false) {
         xpath = "//" + segment + '[@id="' + id + '"]' + xpath;
         break;
       } else {
         var par_childs = node2.parentNode.childNodes;
         var node_num = 1;
  
         for(var j=0, pcl=par_childs.length; j<pcl; j++) {
           var child_tag = par_childs[j].tagName;
           if(!child_tag) {
             continue;
           }
           child_tag = par_childs[j].tagName.toLowerCase();
           if(par_childs[j] == node2) {
             break;
           }
           if(child_tag == tag) {
             node_num++;
           }
         }
         segment += '[' + node_num + ']';
       }
     } else if(tag == "tr") {
       var rowCount = node2.parentNode.rows.length;
       if(rowCount > 1 && rowCount < 5) {
         segment += '[' + (node2.rowIndex+1) + ']';
       }
     } else if(tag == "td") {
       var cellCount = node2.parentNode.cells.length;
       if(cellCount > 1 && cellCount < 5) {
         segment += '[' + (node2.cellIndex+1) + ']';
       }
     }

     xpath = "/" + segment + xpath;
  
     node2 = node2.parentNode;
   }

   if(node_id) {
     xpath += '#' + node_id;
   }
   return xpath;
  },

  /**
   * Simple test of whether the user's browser is IE.
   * This could be improved...
   */
  isIE: function() {
    return (navigator.appName == "Microsoft Internet Explorer");
  },

  
  /**
   * A long but simple hash function that produces unique strings
   * to use as keys in the system that don't contain characters
   * disallowed in sound names by Sound Manager 2.
   * @param str String to calculate the hash of.
   * @return String of hash.
   */
  simpleHash: function(str) {
    // If string is null or undefined, return null string hash.
    if(str == null) {
      return 'nullhash';
    }

    // Next, branch based on the type of string.
    var type = String(typeof str);
    if(type == 'undefined') {
      return 'undefinedhash';
    }
    if(type != 'string') {
      str = String(str);
    }

    // If the string is empty, return the empty string hash.
    if(str.length <= 0) {
      return 'emptystring';
    }

    var bin = Array(16);
    var str_len = str.length;

    for(var i=0; i<16; i++) {
      bin[i] = str_len + i;
    }
    for(var i=0; i<str_len; i++) {
      var update_val = str.charCodeAt(i)*(i & 0xFF)
      bin[(i & 0xF)] += update_val;
      bin[((i << 2) & 0xF)] += update_val;
    }

    var hex_tab = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#*@!";
    var str2 = "";
    for(var i=0, bl=bin.length; i<bl; i++) {
      str2 += hex_tab.charAt(bin[i] & 0x3F);
    }

    // Prepare the final string.
    var val = str.substring(0, 15) + str2;
    val = val.replace(/&#(\d)+;/g, "p$1");
    val = val.replace(/[^a-zA-Z0-9]+/g, '');

    return val;
  },


	/**
	 * This function returns the [x, y] position of the supplied object.
	 * This can be slow since it requires tracing the element back to the root.
	 * @param obj DOM element for which the position should be calculated.
	 * @return [x,y] position of the supplied element.
	 */
	findPos: function(obj) {
	  var curleft = curtop = 0;
	  if(obj != null && obj.offsetParent) {
	    curleft = obj.offsetLeft;
	    curtop = obj.offsetTop;
	    while (obj = obj.offsetParent) {
	      curleft += obj.offsetLeft;
	      curtop += obj.offsetTop;
	    }
	  } else {
	  	return null;
	  }

	  return [curleft,curtop];
	},

  /**
   * Return the height/width of the visible portion of the supplied window.
   * @param Window.
   * @return [width, height]
   */
  contentWidthHeight: function(win) {
		if(self.innerWidth != undefined) {
		  return [win.innerWidth, win.innerHeight];
    } else {
  		var docelem = win.document.documentElement;
  		return [docelem.clientWidth, docelem.clientHeight];
		}
  },

  /**
   * getScrollOffset
   * Gets the scroll offset of the browser.
   * @param win Window Element to get the scroll offset of.
   * return [scrollX, scrollY]
   */
  getScrollOffset: function(win) {
  	if(win.scrollY != undefined) {
  		return [win.scrollX, win.scrollY];
  	} else if(win.document.documentElement.scrollTop) {
  		var delem = win.document.documentElement;
      return [delem.scrollLeft, delem.scrollTop];
  	} else {
  		return [0, 0];
  	}
  },

  /**
   * Addds the specified listener function to the target node.
   * @param target Node
   * @param func Listener function to add.
   */
  setListener: function(target, evt, func) {
	  if(window.attachEvent) target.attachEvent('on' + evt, func);
	  else if(window.addEventListener) target.addEventListener(evt, func, false);  	
  },

  /**
   * Function for logging error messages to the Firebug console when it is available.
   * @param str String to log to the console.
   */
  log: function(str) {
  	if(typeof console != 'undefined' && typeof console.log != 'undefined') {
  		console.log(str);
  	}
  }
};