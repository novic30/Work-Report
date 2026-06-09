### Terminology
**NAND Flash:** Non-volatile memory chip where device data is stored
**RAM:** Volatile memory, flushed on reboot, used to hold encryption keys.  
**SIM/eSIM:** Card storing network identifiers and sometimes user data.  
**SD Card:** External removable storage, Android only.  
**ADB:** Android Debug Bridge, used to communicate with Android via USB.  
**Bootloader:** Code that checks and launches the operating system.
**BFU:** Before First Unlock, acquisition without the device password.  
**AFU:** After First Unlock, acquisition using the device passcode.  
**Physical Acquisition:** Bit-by-bit copy of the flash chip, no longer available on modern devices.  
**Full File System Acquisition:** All active decrypted files, current gold standard.  
**Logical Acquisition:** Backup-style data pull, less complete than full file system.  
**Manual Acquisition:** Manually reading data from a live device screen.  
**SQLite:** Cross-platform database format used by most apps to store data.  Sometimes, deletion still keeps data in sqlite.
**PList:** iOS preference file, similar to XML on Android.  
**XML:** Android preference file format stored in Shared Prefs folder.  
**Agent:** An app installed with special permissions to access restricted data.
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

