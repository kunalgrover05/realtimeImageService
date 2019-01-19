var socket = io();
console.log("Scoket connected");
const files = [];

var app = new Vue({
    el: '#app',
    data: {
        files: []
    },
    template: '<div  style="flex-flow: wrap; flex-direction: row; align-items: center; display: flex"><img v-for="file in files" :src="file.Url" style="max-width: 250px" /></div>'
})


console.log("REDNER JS Is running");
socket.on('update', function (files) {
    console.log(files);
    app.files = files;
    // Render only new files
});