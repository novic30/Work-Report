After installing nginx and apache2, We must create web directories for siteA.local and siteB.local which will be V-Hosted using Apache and Nginx:
sudo mkdir -p /var/www/site1.local
sudo mkdir -p /var/www/site2.local

For nginx, we will host site1.local:
We will modify /etc/nginx/sites-available/default which will be:
server {
	listen 80;
	root /var/www/site1.local/;
	server_name site1.local;
}

In /etc/hosts we must do:
127.0.0.1	site1.local
127.0.0.1	site2.local

Additionally, in wondows, we must use this command to make similar changes in windows hosts file too:
Add-Content -Path C:\Windows\System32\drivers\etc\hosts -Value "`n127.0.0.1`tsite1.local`n127.0.0.1`tsite2.local" -Force

Now, we can do sudo systemctl start nginx and finally access site1.local


Now, in apache2, we create a file at /etc/apache2/sites-available/site2.local.conf where we made up the site2.local.conf which didn't exist before:
<VirtualHost *:80>

        ServerName site2.local
        DocumentRoot /var/www/site2.local/

</VirtualHost>

Additionally, disable apache2 placeholder page as it's no longer relevant: sudo a2dissite 000-default.conf
Finally, we can also do sudo systemctl start apache2 and access site2.local
Note: If site2.local doesn't work, you should change sudo nano /etc/apache2/ports.conf to go from Listen 80 to Listen 0.0.0.0:80
