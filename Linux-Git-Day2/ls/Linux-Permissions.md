rwx = Read Write and Execute permissions

Typical Format is: - --- --- --- where --- could be rwx or rw- etc. depending on permissions.

First - is for file type where - means file, d = Directory, 1 = Link etc.

Second --- means Permissions the owner have over the given file/directory

Third --- means Permissions certain groups in the system have over the given file/directory

Fourth --- means Permissions other users have on this given file/directory



```bash
ls -la # Lists file and folders including hidden ones with their permissions
chmod a+r file # Give read permission to all users

Permission model for 'chmod 754 shell' is:
Binary Notation:                4 2 1  |  4 2 1  |  4 2 1
----------------------------------------------------------
Binary Representation:          1 1 1  |  1 0 1  |  1 0 0
----------------------------------------------------------
Octal Value:                      7    |    5    |    4
----------------------------------------------------------
Permission Representation:      r w x  |  r - x  |  r - -

