// This software is freeware with MIT license

// How to use:
// 1. Extract .chm file into separate folder of your web site
// 2. Add webchm.js + webchm_view.html + webchm_view.css + webchm_view.js to the folder
// 3. Find your help file index (.hhc file)
// 4. Launch webchm_view.html?index={name of your index file}.hhc and enjoy
// 5. If you want, you may do minor changes in webchm_view.html so:
// 5.1 Create webchm_view_user.css to future alter visual styles (uncomment loading in head)
// 5.2 Edit call to webchmView.boot('index.hhc', true); to alter default .hhc index name (default 'index.hhc')
// 5.3 Edit call to webchmView.boot('index.hhc', true); to disable 'index' param processing (more secure)

// Main object
// document.webchm

// Core function
// Simple HTML generator from CHM root content .hhc file
// Result tree will be UL/LI tree with A anchors inside
// document.webchm.fillNodeByChmHhc(node, hhcFileText, options) // fill node with navigation tree
// document.webchm.getHtmlByChmHhc(hhcFileText, options) // get navigation tree as html text

webchm = new function() {

 function getXmlTextByHtmlText(text) {
   var dom = document.createElement("div");

   dom.innerHTML = text;
   text = dom.innerHTML; // parsed

   // make param tags self-closing to produce valid xml

   regex = /(<param\s+[\s\S]*?\/?)(>)/gmi; 
   subst = '$1/>';
   text = text.replace(regex, subst);

   return text;
 }

 function isChmRootBodyValid(text, options) {

   // Validate file text for allowed tags (for security reasons)
   var ALOWED  = [ 'li', 'ul', 'object', 'param' ]; // ONLY these tags are allowed

   var PFX     = 'tag@';
   var allows  = { } // hash of allowed tags

   for (var i = 0; i < ALOWED.length; i++) {
     allows[PFX + ALOWED[i]] = true;
   }

   var regex   = /<([0-9a-z_-]+)/gmi;
   var matches = text.matchAll(regex);

   for (var i = 0; i < matches.length; i++) {
     if (matches[i].length < 2) { 
       console.log('Cannot validate .hhc file text', [matches[i]]);
       return false; 
     }

     var tag = matches[i][1];
     tagLc = tag.toLowerCase();

     if (allows[PFX + tagLc] !== true) {
       console.log('Invalid tag found in .hhc file', [tag, matches[i]]);
       return false;
     }
   }

   return true;
 }

 function getXmlTextByChmRootText(text, options) {
   var regex,subst;

   // remove text outside of body

   regex = /[\s\S]*?<BODY[\s\S]*?>/gmi;
   var subst = '';
   text = text.replace(regex, subst);

   regex = /<\/BODY>[\s\S]*/gmi;
   var subst = '';
   text = text.replace(regex, subst);

   if (!isChmRootBodyValid(text, options)) { return null; }

   text = getXmlTextByHtmlText(text);

   return text;
 }

 function getParamsForObject(obj) {
   var result = {};
   var params = obj.getElementsByTagName("param");
   for (var i = 0; i < params.length; i++) {
     var name  = params[i].getAttribute("Name");
     var value = params[i].getAttribute("Value");
     result["param@"+name] = value;
   }
   return result;
 }

 function isValidLinkText(link, options) {
   // Validate links to limit content for security reasons

   var linkLc = link.toLowerCase();

   if (linkLc.indexOf('script:') >= 0) {
     // javascript: and alike is not allowed in links
     var msg = "Unsupported content of a link (scripting not allowed)";
     console.log(msg, [link]);
     return false;
   }

   if (link.indexOf(':') >= 0) {
     // http: https: mailto:, ftp: and alike is not allowed, so filter any protocol spec
     var msg = "Unsupported content of a link (protocols or external links not allowed)";
     console.log(msg, [link]);
     return false;
   }

   return true;
 }

 function getAnchorByObject(obj, options) {
   if (obj.getAttribute("type") != "text/sitemap") {
     return null;
   }

   var params = getParamsForObject(obj);

   var text = params["param@Name"];

   if (text == null) {
     return null;
   }

   var link = params["param@Local"];

   if (!isValidLinkText(link, options)) {
     throw "Invalid/unsupported link text:"+link; // do not return, more rigid with throw
     return null;
   }

   if (link == null) {
     return null;
   }

   var a = document.createElement("a");

   a.setAttribute("href", link);
   a.innerText = text;

   if (options.onAnchorMake != null) {
     var ra = options.onAnchorMake(a, params);
     if (ra != null) { a = ra; } // anchor updated
   }

   return a;
 }

 function fillResultNodeByChmXmlText(dom, text, options) {

   dom.innerHTML = text;
   var objs = dom.getElementsByTagName("object");

   var proc = [];
   for (var i = 0;i < objs.length;i++) {
     proc.push(objs[i]);
   }

   for (var i = 0;i < proc.length;i++) {
     var obj = proc[i];
     var a = getAnchorByObject(obj, options);
     if (a != null) {
       obj.parentNode.replaceChild(a, obj);
       if (options.onAnchorAdded != null) {
         options.onAnchorAdded(a);
       }
     } else {
       obj.parentNode.removeChild(obj);
     }
   }

   return dom;
 }

 function getResultHtmlByChmXmlText(text, options) {
   var dom = document.createElement("div");
   fillResultNodeByChmXmlText(dom, text, options);
   return dom.innerHTML;
 }

 function getHtmlByChmHhc(hccFileText, options) {

   if (options == null) { options = {}; }

   var text = hccFileText;
   text = getXmlTextByChmRootText(text, options);
   if (text == null) { return null; }
   text = getResultHtmlByChmXmlText(text, options);
   if (text == null) { return null; }

   return(text);
 }

 function fillNodeByChmHhc(node, hccFileText, options) {

   if (options == null) { options = {}; }

   var text = hccFileText;

   text = getXmlTextByChmRootText(text, options);

   if (text == null) { return null; }

   node = fillResultNodeByChmXmlText(node, text, options);

   return(node);
 }

 this.getHtmlByChmHhc = getHtmlByChmHhc;
 this.fillNodeByChmHhc = fillNodeByChmHhc;
}();
