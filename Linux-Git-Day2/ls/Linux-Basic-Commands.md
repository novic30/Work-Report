```bash
apt	= Used to installing, updating, removing, and otherwise managing deb packages on Ubuntu, Debian, and related Linux distributions
	sudo apt install given-package # downloads given package if it's available to be downloaded
	sudo apt install package1 package2 package3 # allows downloading for multiple packages.
	sudo apt update # updates packages present in the apt index which is basically a database that holds records of available packages from the repositories enabled in your system.



sudo 	# Run a command as admin/root
	sudo nano sensitive-File
	sudo rm imp-file


ls	= List files and folders in currect directory.
	ls -l # gives more details like permissions, ownership of files/folders, group owner, size of file, date and time, directory name which the file is in
	ls -la # gives same but -a makes it also lists hidden files such as .example-hidden-file
	ls .. # does listing for parent directory
	ls child/ # does listing for a subdirectory in the current directory

cd	= Let's us change the current working directory.
	cd .. # takes us to parent directory
	cd child/ # takes us to child subdirectory
	cd ../sibling/ # takes us to another directory under parent directory
	cd ../../../ # takes us to parent directory of parent directory of parent directory.
	cd ~ # takes us to home directory
	cd - #takes us back to the previous directory we were in
	cd ch #will be autocompleted to child/ when pressing [TAB] twice

mv	= Used to move and rename files and directories from one place to another
	mv ../mvFile . # moves mvFile from parent directory to current directory
	mv mvFile BetterName # changes the name of the file/directory

cp	= Used to copy files from one place to another
	cp ../mvFile . # copies file into current directory
	cp Storage/readme.txt Storage/local/ # makes a readme.txt file like Storage/local/readme.txt

nano	= Editor directly available in the terminal to edit files like these note taking files.
	nano notes/wutever-notes.md

cat	= Outputs the contents of the files to terminal
	cat wutever-notes.md
	cat random.txt
	cat something.pdf # will output some weird language because the content is machine language or something
	cat something.txt > specific.txt # outputs content of something.txt to specific.txt by overwriting specific.txt file
        cat something.txt >> specific.txt # outputs content of something.txt to specific.txt by appending after wutever is already present in specific.txt

pwd     # = Returns current working directory filepath

clear	# = Cleans the shell output

touch	= Creates a file
	touch bob.txt # creates a txt file called bob.txt

mkdir	= Creates a folder/subdirectory
	mkdir Working-Project #creates a folder for Working-Project which we can cd to start working on the project.
	mkdir -p .github/workflows/ #is used to create parent directories automatically.

tree	= Shows the whole structure of the current directory, files and subdirectories and their files
	tree .
	tree .. #shows structure for parent directory.



man	= Shows manual page for a given command by doing 'man <tool>' to show the guide for the given <tool> command like man ls for ls
	- Alternate way of getting a guide is by doing <tool> --help or <tool> -h like 
	ls --help # OR 
	curl -h  #OR
	man ls

curl 	= Used to transfer data like http, ftp, etc. data
	curl https://www.example.com/
	curl ftp://ftp.example.com/README
	curl http://www.example.com:8000/ # get url hosted on specific port specific port
whoami	# = Displayes current username
hostname #= Prints name of current host system
uname	#= Prints basic info about operating system name and system hardware
ssh	= Remote login through doing 'ssh username@[IP Address]'

