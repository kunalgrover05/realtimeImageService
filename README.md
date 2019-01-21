#### Capabilities
Realtime Image sharing service with single server.
Try out here: http://imageviewerrealtime-dev.us-east-1.elasticbeanstalk.com/

#### How does it work?
- Client uploads an image to S3
- S3 sends a notification to SNS
- Node server subscribes to SNS to view updates from S3 and triggers file conversion.
- File is converted to required resolution and stored back to S3 with Public ACL.
- Clients are connected to server using Sockets. Server broadcasts to clients that images are updated (after conversion).
- Node has a 5 minute update + broadcast mechanism which guarentees eventual consistency (eg server goes down).

#### How to make it a multi node system?
- Works as a multi node system with only one small disadvantage. Each and every node will try to execute the image conversion step. The solution is to simply make image conversion happen on a single node and make it inform other nodes again using SNS.

#### Frontend
- Frontend is a simple Vue.js application which is connected to the server using SocketIO.
- Whenever SocketIO publishes an update in the image URLs, Vue smartly renders only as many images as required instead of rendering all, making it easily workable on the client side.
