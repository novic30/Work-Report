Note: No executables should ever be hidden files starting with . That's likely malicious

in uac live_response/process
run:
```bash
grep -F -- '->' running_processes_full_paths.txt | sed 's/.* -> //' | grep -v ^/

ls -l /proc/*/exe 2>/dev/null | grep deleted
#For deleted executables still running


┌──(a㉿DESKTOP-QEPBAMV)-[/mnt/d/USCC/Linux Day 4/lab/live_response/process]
└─$ grep deleted running_processes_full_paths.txt
```

Looking for sus things through grep:
![[Pasted image 20260611212005.png]]
/dev/shm/.rk is suspicious, thus:
```bash
grep /dev/shm bodyfile/bodyfile.txt
```




Normal:
/

/home
/home/<USER>

/root

/usr and subdirectories contain the executables. Thus those running outside /usr maybe suspicious except for /opt which contains 3rd party software
/usr/bin/
/usr/lib
/usr/local
/usr/local/bin
/usr/local/lib

/bin

/lib



/dev
/dev/shm

/tmp would often contain early exploitation information as it's commonly used in beginning of exploit

Configuration Files and Folders below:
/etc
/etc/nginx /etc/httpd where their configurations are present

/var
/var/tmp
/var/log



### Terminology

.ssh private unprotected keys are stolen and used for lateral movement by trying their access against known hosts.