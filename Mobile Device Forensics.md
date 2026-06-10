### Terminology
**NAND Flash:** Non-volatile memory chip where device data is stored like System and User related data. This stays even after a reboot.
**RAM:** Volatile memory, flushed on reboot, used to hold encryption keys.  
**SIM/eSIM:** Card storing network identifiers and sometimes user data. Nowadays called UICC (Universal Integrated Circuit Card).
**SD Card:** External removable storage, Android only.  
**Cloud:** Third-party storage which is used more and more often to app user-related data.
**ADB:** Android Debug Bridge, used to communicate with Android via USB.  
**Bootloader:** Code that checks and launches the operating system.
**BFU:** Before First Unlock, acquisition without the device password.  
**AFU:** After First Unlock, acquisition using the device passcode.  
**Physical Acquisition:** Bit-by-bit copy of the flash chip, no longer available on modern devices.  
**Full File System Acquisition:** All active decrypted files, current gold standard.  
**Logical Acquisition:** Backup-style data pull, less complete than full file system.  
**Manual Acquisition:** Manually reading data from a live device screen.  
**SQLite:** Cross-platform database format used by most apps to store data.  Sometimes, deletion still keeps data in sqlite.
**FQLite** is to also see the deleted data through file carving in databases unlike sqlite db browser.
**PList:** iOS preference file, similar to XML on Android.  
**XML:** Android preference file format stored in Shared Prefs folder.  

**DCIM:** This is where pictures directly taken from device would be stored


### Android Vs IOS
ANDROID
- Based on Linux kernel, open source
- Because it is open source, manufacturers like Samsung, Motorola, LG etc. can customize the Android OS and put their own stamp on it
- Service providers like T-Mobile, Verizon, AT&T also add their own apps and modifications on top
- This causes trouble in forensics because the same file on a Pixel device may be in a completely different location on a Samsung device
- So examiners cannot rely on one fixed file path for artifacts across all Android devices
- Data stored in NAND flash internally, and optionally on SD cards
- Common file types: SQLite databases, XML files, and Protobufs on newer versions
KEY TROUBLE CAUSED BY ANDROID OPEN SOURCE
- Different manufacturers and carriers create different variants of Android
- Same artifact can have different name or location depending on brand or carrier
- Forensic examiners must account for all these variations, making investigations more complex compared to the more uniform iOS environment

IOS
- Based on Unix kernel, essentially the touch version of Mac OS
- Closed and controlled by Apple, no manufacturer customization
- More consistent and uniform across devices, easier to predict file locations
- No SD card slot, all data stored on internal NAND flash only
- Apple never stored user data to SIM cards, always to internal flash
- Common file types: SQLite databases and PList files

### Getting Access to Data Order of Operations
1. RAM
2. Internal Flash (SIM Card and SD Card also applicable)
3. SIM
4. SD Card
5. Cloud

### Acquisition Terminology
**Physical:** Bit-by-bit copy of flash memory which has access to full partitions
**Full File System:** JailBreak for iOS or Rooted for Android
**File System:** Logical Layout of stored data/files which also gives access to raw files (like the hex code version of the files, deleted files etc.).
**Backup:** ITunes for iOS, ADB Tools for Android, Cloud as an alternate nowadays.
**Logical:** Data is read from file system and reported including raw files and metadata, sometimes including cloud data.
**Manual:** With physical access to phone, just go around and round the phone physically for forensics.

**Bootloader:** Ensures that operating system is correct version and is working as intended.
	-DFU (Device firmware Update) mode in iOS, and Bootloader mode in ANdroid
**ADB:** Android specific Android debug bridge used to pull physical partitions from device. If rooted, unrestricted access to file system.
**File System iOS:** Can be acquired through quick or full acquisition depending on tool and device support and model. JailBreak provides unrestricted access to file system. 

**Agent:** An app installed with special permissions to access restricted data. This means we would download a dummy app which would be ours into the device so that we can use the app to analyse the mobile for forensics

**App Downgrade:** Some apps would be reduced to older versions so that we might access new data for forensics.

# Tools

### FTK Imager
- Used to mount physical disks, logical drives, image files, or the contents of a folder and store it as a forensic image (raw dd, E01)
- Can be used to open these forensic images for analysis even when done by other tools
- 

**shared_pref:** It is used to set up apps up. Like how health fitness apps would ask ur age weight on setup. Thus, this folder might contain PII!!!

