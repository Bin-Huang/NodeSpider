const { Spider } = require("../build/index");
const fs = require("fs");

const stream = fs.createWriteStream("./1.txt");

const s = new Spider();

s.connect("txt", stream)

s.save("txt", {
    name: "ben",
    age: 22
});
s.save("txt", {
    name: "ben",
    age: 21,
    height: 179,
});

s.end();