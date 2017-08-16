const { Spider, defaultPlan, downloadPlan } = require("../build/index");

const n = new Spider();

const planA = n.add(defaultPlan({
    callback: (err, current) => {
        if (err) {
            return console.log(err);
        }
        const $ = current.$;
        n.queue(dl, $("img").src());
        console.log($("img").src());
    },
}));
const dl = n.add(downloadPlan({
    callback: (err, current) => {
        console.log(err);
        console.log(current.url);
    },
    ext: ".png",
    path: "./",
}));

n.queue(dl, "http://img.hb.aicdn.com/3d8a0e0723f672a99a5b89db48662c2c8a57be48b0ca-BD4qsu_fw658");

// n.queue(planA, "http://huaban.com/pins/747493855/");
