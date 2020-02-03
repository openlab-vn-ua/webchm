# webchm
Support for online view of extracted chm help files as html via web browser

# How to use:
1. Extract .chm file into separate folder of your web site. If you use windows, you may use build in hh.exe utility:
```
hh -decompile TARGET_FOLDER SOURCE.CHM
```
2. Add `webchm.js + webchm_view.html + webchm_view.css + webchm_view.js` to the folder

3. Find your help file index (.hhc file)

4. Launch webchm_view.html?index={name of your index file}.hhc and enjoy

5. If you want, you may do minor changes in `webchm_view.html` so:
    * Create `webchm_view_user.css` to future alter visual styles (uncomment loading in head)
    * Edit call to `webchmView.boot('index.hhc', true);` to alter default .hhc index name (default 'index.hhc')
    * Edit call to `webchmView.boot('index.hhc', true);` to disable 'index' param processing (more secure)
