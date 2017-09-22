# add new Plan
```javascript
const s = new Spider();
s.add(defaultPlan({
    name: "myPlan",
    callbacks: [
        (err, current) => console.log(current.url);
    ]
}));
s.queue("myPlan", "http://www.baidu.com");
```
