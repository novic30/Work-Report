```bash

jobs	# Lists background processes which are currently running or stopped
ps aux # It shows all the processes currently running
ps -aux | grep ssh # Shows the process you want to see instead of seeing a loooong list of stuff
ps -ef | grep sleep	# Gets list of processes running in background
pkill app # Terminates all processes named app
pkill -9 app # Forces termination of app. Useful when app would freeze.
kill -9 <PID> #Forcefully terminate specific PID which is an id for a process. Useful when process freezes.
Ctrl+C # Use keyboard to stop a process which is actively running on current terminal

fg 1 # Bring background process to the front so that we can interact with it

systemctl  start ssh # Starts running ssh on current device
systemctl enable ssh # SSH will run after startup from now on
