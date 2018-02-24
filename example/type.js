const { Spider, defaultPlan } = require("../build/index");

const s = new Spider();

const plan = defaultPlan((err, current) => {
    if (err || !current.response.headers) {
        current.response.headers
    } else {
        current.response.headers;
    }
})