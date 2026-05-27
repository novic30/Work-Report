node-modules/ folder is where all dependencies are installed. Done through npm i in vite project. Not pushed to github bc it's bulky and can be installed easily using npm i.


.gitignore tells what folders or files to not push into the github/gitlab like node-modules or other private files containing imp. info like keys etc.
package.json: Most imp file telling the configuration about the entire project like dependencies and script this project uses(it get automatically modified as we install dependencies using npm i). Here, dependencies are the ones required to run the project and host it while devDependencies are used by developers to work on the project and write and modify the project.
package-lock.json: package json would give acceptable range for dependency version while package lock lists the exact version of the dependency downloaded with other details.
vite.config.js: For other plugins and modifying hosting details of project like the port it's being hosted on
README.md: Guide for what the project is about and how to use it.
eslint.config.js: Configuration which sets rule about how to write code and ensures code quality.

ALL INSIDE src/ folder:
	assets/ folder contains icons and logos which you don't want to be publicly served. which wouldrequire import syntax to be accessed.
	App.css which contains css for styling the App.jsx
	App.jsx is basically writing the html code
	index.css is the global css which will work everywhere.
	main.jsx v.imp. Index html is a default html where you can decide title for browser tab. Rest is done through main.jsx where you can actually have working html js sicne it uses App.jsx to modify the default index.htmla nd give it functionlity.


public/ Contains all the static files to be served like pictures, icons etc. which can be accessed directly by above src folders without imports.


