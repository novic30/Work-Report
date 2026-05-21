NAT is present in the router or similar device allows multiple private IPs to share a single public IP.

For example, in a home, multiple devices would have their own private IPs forming a LAN(Local-Area Network).
However, these private IPs can't be used directly to connect to the internet. Instead, they would need to use public IP which would allow them to connect to the WAN(Wide-Area Network) which is the internet.

Here, public IP addresses are globally unique identifiers assigned by the ISP and are accessible from anywhere in the internet.

In comparison, private IP addresses are present in LAN like homes, schools and offices and would connect to the internet through a puhlic IP using a NAT.
Common private IP ranges are: 10.0.0.0 to 10.255.255.255, 172.16.0.0 to 172.31.255.255, and 192.168.0.0 to 192.168.255.255

Additionally, IPs can be divided into static and dynamic IP addresses. Static IP addresses are the IP addresses which are always used by a single device or server like router using 192.168.1.1 in LAN always or Google having some public static IP like 8.8.8.8
As for dynamic IP addresses, these are for mobile devices and laptops which would connect and obtain an IP address and gain a new IP address when reconnecting. This is done through DHCP which would lease an IP address to a device for 24 hours (maybe). Then, the device would have to renew the lease by sending renewal request to dhcp server (which is normally in the router).
