
// This may be the data of a view.
// Created for mocking and checking.
const data = {
    _list: []
};

const mockGet = jest.fn(function () {
    return this._list;
});

const mockSet = jest.fn(function (value) {
    this._list = value;
});

Object.defineProperty(data, 'list', {
    set: mockSet,
    get: mockGet
});

export {data as default, mockGet, mockSet}