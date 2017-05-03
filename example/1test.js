const NodeSpider = require("../build/spider");

let s = new NodeSpider();

s.addTask({
    url: "sdlkjflk",
    callback: "skljfkl",
});
s.addTask("ljflkjfklsdfkjsdlksljdfkdsjfksjkfjksdjfksjfskfjskjd", (err, current, $) => {
    if (err) {
        return s.retry(currentTask, 3);
    }
    $("a").todo();
    $("a").url();
    $("#something").download();
    $()
});

s.addTask("http://wwjklsjkflsjkflsdjkfljekwljkejkdfkvndfnwekregergjerigjidsjvjk", myStractor, {
    preWork: 
});