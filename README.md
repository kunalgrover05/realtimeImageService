#### Capabilities
Realtime Image sharing service with single server.

#### How does it work?
- Client uploads an image to S3
- S3 sends a notification to SNS
- Node subscribes to SNS to view updates from S3 and triggers file conversion
- File is converted to required resolution and stored back to S3 with Public ACL.
- Clients are connected to server using Sockets. Server broadcasts to clients that images were updated.
- Node has a 5 minute update + broadcast mechanism which guarentees eventual consistency in case of any problems in the service.

How to make it a multi node system?
- It will work as a multi node system with only one small problem. Each and every node will try to execute the image conversion setup. The solution is to simply make image conversion happen on a single node and make it inform other nodes again using SNS.
