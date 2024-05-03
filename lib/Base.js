class Base {
    constructor(client) {
        Object.defineProperty(this, 'client', { value: client });
    }
    patch(data) { return data; }
}

module.exports = Base;
