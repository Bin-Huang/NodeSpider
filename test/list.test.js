const List = require('../build/list');

test('queue order test', () => {
    let l = new List();
    l.add('1', 'task 1');
    expect(l.next()).toBe('task 1');
    expect(l.check('1')).toBe(true);



    l.add('c', 'task c');
    l.add('d', 'task d');
    l.jump('b', 'task b');
    l.add('e', 'task e');
    l.jump('a', 'task a');

    expect(l.getLength()).toBe(5);
    expect(l.getSize()).toBe(6);
    expect(l.next()).toBe('task a');
    expect(l.next()).toBe('task b');
    expect(l.next()).toBe('task c');

    expect(l.getLength()).toBe(2);
    expect(l.getSize()).toBe(6);

    expect(l.next()).toBe('task d');
    expect(l.next()).toBe('task e');
    expect(l.next()).toBe(null);
});