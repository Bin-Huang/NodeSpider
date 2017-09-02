const { Spider, streamPlan } = require("../build/index");

const s = new Spider();
const de = s.plan((err, current) => {
    console.log(err.message);
});
const st = s.add(streamPlan({
    callback: (req, current) => {
        console.log(req);
        throw new Error("lkdfjdskljf");
    },
}));

s.queue(de, "kldfjklsdjf");
s.queue(de, "121212");
