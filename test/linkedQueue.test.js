const LinkedQueue = require('../build/linkedQueue');

let link = new LinkedQueue();

test('test method add', () => {
    link.add('task 1');
    expect(link._LENGTH).toBe(1);
    expect(link.getLength()).toBe(1);

    link.add('task 2');
    expect(link._LENGTH).toBe(2);
    expect(link.getLength()).toBe(2);

    expect(link._END.value).toBe('task 2');
    expect(link._HEAD.value).toBe('task 1');

    link.add('task 3');
    expect(link._LENGTH).toBe(3);
    expect(link._END.value).toBe('task 3');
});

test('test method next', () => {
    expect(link.next()).toBe('task 1');
    expect(link.getLength()).toBe(2);
    expect(link._HEAD.value).toBe('task 2');

    expect(link.next()).toBe('task 2');
    expect(link.getLength()).toBe(1);
    expect(link._HEAD.value).toBe('task 3');
    expect(link._END.value).toBe('task 3');

    expect(link.next()).toBe('task 3');
    expect(link._HEAD).toBeNull();
    expect(link.getLength()).toBe(0);
    expect(link._END).toBeNull();

    expect(link.next()).toBeNull();
    expect(link._END).toBeNull();

    expect(link.next()).toBeNull();

    link.add('task 1');
    expect(link.getLength()).toBe(1);
    expect(link.next()).toBe('task 1');
});

test('test method jump', () => {
    let l = new LinkedQueue();
    l.add('task 1');
    
    expect(l._END.value).toBe('task 1');

    l.jump('task 0');
    expect(l._HEAD.value).toBe('task 0');
    expect(l._END.value).toBe('task 1');
    expect(l.getLength()).toBe(2);
    expect(l.next()).toBe('task 0');
    expect(l.next()).toBe('task 1');
    expect(l.next()).toBeNull();

    l.jump('task 3');
    l.jump('task 2');
    l.add('task 4');
    l.jump('task 1');
    l.add('task 5');
    expect(l.next()).toBe('task 1');
    expect(l.next()).toBe('task 2');
    expect(l.next()).toBe('task 3');
    expect(l.next()).toBe('task 4');
    expect(l.next()).toBe('task 5');
    expect(l._LENGTH).toBe(0);
    expect(l._HEAD).toBeNull();
    expect(l._END).toBeNull();
})