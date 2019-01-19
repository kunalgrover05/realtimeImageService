var socket = io();
console.log("Scoket connected");
const files = [];

var app = new Vue({
    el: '#app',
    data: {
        files: []
    },
})


console.log("REDNER JS Is running");
socket.on('update', function (files) {
    console.log(files);
    app.files = files;
    // Render only new files
});