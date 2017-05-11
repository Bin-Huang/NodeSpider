function dodo () {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log("do");
            resolve();
        }, 2000);
    });
}
async function as() {
    for(let i of [1,2,3,4]) {
        await dodo();
    }
}