https://www.geeksforgeeks.org/javascript/what-is-long-polling-and-short-polling/
# Short Polling

Short polling is a technique where the client continuously sends requests to the server at fixed intervals. The server immediately responds—either with data if available or an empty response if not. This cycle keeps repeating, allowing the client to check for updates regularly.

When the server finally finds the data, it would finally send the response with relevant daya.
**Benefit: -** Simple to implement using standard HTTP/AJAX requests without complex setup.
**Con: -** Can cause unnecessary requests and increase server load due to frequent polling even when no new data is available.

### Short polling examples
- News feeds and blogs that refresh periodically (e.g., every few seconds or minutes)
- Weather updates and stock market tickers with fixed refresh intervals
- Social media feeds or dashboards that do not require immediate updates

### Proper Complete Example of Short Polling

 ****Example:**** A chat application that sends a request to the server every 5 seconds to check for new messages, even if no new messages have arrived.
![[Pasted image 20260615131402.png]]

### Short Polling Example Code Implementation
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" 
          content="width=device-width, 
                         initial-scale=1.0">
    <title>Short Polling using AJAX</title>
    <style>
        h1, h3 {
            text-align: center;
            color: green;
        }

        button {
            margin-left: 34.5rem;
        }
    </style>

    <script>
        function loadInformation() {
            setInterval(function () {

                // Request
                var request = new XMLHttpRequest();
                request.open("GET", "./data.json");
                request.send();

                // Response
                request.onreadystatechange = function () {
                    if (this.readyState == 4 && this.status == 200) {

                        // Also checked status==200 to 
                        // verify its status is OK or not
                        console.log(this.responseText);
                    }
                }
            }, 1000);
        }
    </script>
</head>

<body>
    <h1>Geeks for Geeks</h1>
    <h3>Short Polling using AJAX</h3>
    <button onClick="loadInformation()">
        Click to Load
    </button>
</body>

</html>
```
![[Pasted image 20260615131612.png]]


# Long Polling
Long polling is a technique where the client sends a request and the server holds it until new data is available instead of responding immediately. Once data is sent, the client quickly makes another request, enabling near real-time communication.

### Long Polling Examples
- Chat applications where messages should appear immediately after being sent
- Notification systems (e.g., alerts, reminders, activity updates)
- Collaborative editing tools or live dashboards where changes must be reflected instantly
### Proper Complete Example of Long Polling
 ****Example:**** A messaging application where the client sends a request and waits until a new message arrives; once received, it instantly sends another request to keep listening for further messages.
 ![[Pasted image 20260615134831.png]]


### Long Polling Example Code Implementation

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" 
          content="width=device-width, 
                         initial-scale=1.0">
    <title>Long Polling using AJAX</title>
    <style>
        h1, h3 {
            text-align: center;
            color: green;
        }

        button {
            margin-left: 34.5rem;
        }
    </style>

    <script>
        function loadInformation() {

            // Request
            var request = new XMLHttpRequest();
            request.open("GET", "./data.json");
            request.send();
            
            // Response
            request.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {

                    // Also checked status==200 to 
                    // verify its status is OK or not
                    console.log(this.responseText);
                    loadInformation();
                }
            }
        }
    </script>
</head>

<body>
    <h1>Geeks for Geeks</h1>
    <h3>Long Polling using AJAX</h3>
    <button onClick="loadInformation()">
        Click to Load
    </button>
</body>

</html>
```


|#### ****Short Polling****|#### ****Long Polling****|
|---|---|
|It is based on Timer. So, it is used for those applications that need to update data at a fixed interval of time|It is based on getting the response. So, It is used for those applications that don't want empty responses.|
|Here, an empty response can be sent if a response is not available.|Here, empty response is typically avoided but can still be sent in case of timeout|
|It is less preferred.|Preferred for near real-time use cases compared to short polling, depending on system requirements.|
|It creates lots of traffic.|It also creates traffic but less than short polling.|