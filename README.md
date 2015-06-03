# Awake

This is a simple OS X Dashboard Widget for waking up devices using wake on lan.
If you just want to install the current version of the widget, you only need to download and double click the `Awake.wdgt` file in the `dist` folder.

## General

Since Dashcode isn't supported on modern versions of OS X the workflow for widget development is quiet ugly.
To get from source to a installed widget you have to rename the widget root folder containing all relevant files (here `src/Awake`) adding a `.wdgt` extension.
Finally a double click installs the widget to your dashboard.
Because of caching issues I recommend restarting the `Dashboard` process before installing a new version of the same widget, which happens pretty often during development.
Therefore I added the `deploy.sh` script to automate the folder renaming and process termination, which creates a ready to install `Awake.wdgt` file in the `dist` folder.

## License

MIT-Zero License, which basically means: do whatever you want!